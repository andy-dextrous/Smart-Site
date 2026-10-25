/** Real, disposable 3.0.1 -> 4.0 Docker application acceptance.
 * Run from a clean exported 4.0 artifact: node tests/fixtures/docker-app-upgrade.mjs.
 * Requires Docker Compose, Node 24, pnpm, Git, tar, and network access. Never uses an
 * existing site's .env or Docker project. All generated credentials/logs stay private.
 * --archive /absolute/3.0.1.tar.gz permits an offline copy (checksum still required).
 * --keep preserves the owned fixture/resources after failure for investigation.
 */
import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, writeFile, readdir, rm, chmod } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'

const source = process.cwd()
const archiveSha = '9f03cfa5b99c5b56fdc28b54e2505a31176f33b39be9fa9372af77acf0844160'
const oldCommit = '24ac40629464d34cf69f683bf488898d1dd44339'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = async file => JSON.parse(await readFile(file, 'utf8'))
const argument = flag => { const i = process.argv.indexOf(flag); return i < 0 ? undefined : process.argv[i + 1] }
const keep = process.argv.includes('--keep')
const fixture = await mkdtemp(path.join(tmpdir(), 'smartsite-docker-app-'))
await chmod(fixture, 0o700)
const project = `smartsite-app-${randomBytes(6).toString('hex')}`
const site = path.join(fixture, 'site'), baseline = path.join(fixture, 'baseline'), target = path.join(fixture, 'target')
const reports = path.join(fixture, 'upgrade-reports'), envFile = path.join(fixture, 'host.private.env')
const composeFile = path.join(fixture, 'compose.yaml'), logFile = path.join(fixture, 'acceptance.private.log')
const oldImage = `${project}:old`, newImage = `${project}:native4`
const secret = () => randomBytes(32).toString('hex')
const credentials = { adminPassword: secret(), mcpKey: secret() }
const siteId = randomUUID(), password = secret(), cronSecret = secret(), payloadSecret = secret()
const email = 'docker-owner@example.test'
const dbName = 'docker_upgrade_acceptance'
let mongoClient, dockerStarted = false, passed = false, stage = 'prepare'
const images = [oldImage, newImage]
const log = createWriteStream(logFile, { mode: 0o600 })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(DATABASE_|STAGING_|SMARTSITE_|PAYLOAD_|BLOB_|VERCEL_BLOB_|S3_|AWS_|RESEND_|CRON_SECRET|MONGO_|NEXT_PUBLIC_|NEXT_DEPLOYMENT_ID|PORT$|NODE_ENV$)/.test(key)))
async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd || fixture, env: options.env || cleanEnv, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { log.write(bytes); if (options.capture) output += bytes.toString() })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve(output.trim()) : reject(new Error(`${stage}: ${command} exited ${code}; inspect private log ${logFile}`)))
  })
}
const compose = (...args) => run('docker', ['compose', '--project-name', project, '--file', composeFile, ...args])
const step = label => { stage = label; console.log(`Docker application acceptance: ${label}`) }
const freePort = () => new Promise((resolve, reject) => { const server = createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)) }) })
const appPort = await freePort()
let mongoPort = await freePort()
while (mongoPort === appPort) mongoPort = await freePort()
const baseURL = `http://127.0.0.1:${appPort}`
const dbURL = host => `mongodb://acceptance:${password}@${host}/${dbName}?authSource=admin&directConnection=true&replicaSet=smartsite-rs`
const commonEnv = {
  DATABASE_PROVIDER: 'mongoose', PAYLOAD_SECRET: payloadSecret, SMARTSITE_SITE_ID: siteId,
  SMARTSITE_ENVIRONMENT: 'local', SMARTSITE_DEPLOYMENT_PROFILE: 'self-hosted-mongo',
  CRON_SECRET: cronSecret, SMARTSITE_BACKGROUND_RECOVERY: "true", NEXT_PUBLIC_URL: baseURL, NEXT_PUBLIC_SITE_URL: baseURL,
  NEXT_PUBLIC_PRODUCTION_URL: baseURL, NEXT_TELEMETRY_DISABLED: '1',
  NEXT_PUBLIC_DISABLE_RECAPTCHA: 'true', NODE_ENV: 'production', PORT: '3000', HOSTNAME: '0.0.0.0',
}
const hostEnv = { ...commonEnv, DATABASE_URL: dbURL(`127.0.0.1:${mongoPort}`) }
const appEnv = { ...commonEnv, DATABASE_URL: dbURL('mongo:27017') }
const envText = env => Object.entries(env).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n') + '\n'
const writePrivate = (file, bytes) => writeFile(file, bytes, { mode: 0o600 })
async function artifactCopy(from, to) {
  const manifest = await json(path.join(from, 'smartsite-export.json'))
  assert.equal(manifest.schemaVersion, 1)
  await mkdir(to, { recursive: true })
  for (const entry of manifest.files) {
    assert.ok(!path.isAbsolute(entry.path) && !entry.path.split('/').includes('..'))
    const bytes = await readFile(path.join(from, entry.path))
    assert.equal(sha(bytes), entry.sha256, `Artifact drift: ${entry.path}`)
    await mkdir(path.dirname(path.join(to, entry.path)), { recursive: true })
    await writeFile(path.join(to, entry.path), bytes)
  }
  await cp(path.join(from, 'smartsite-export.json'), path.join(to, 'smartsite-export.json'))
}
async function mcp(name, args = {}, token = credentials.mcpKey) {
  const response = await fetch(`${baseURL}/api/mcp`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }), signal: AbortSignal.timeout(90000) })
  assert.equal(response.ok, true, `MCP ${name}: HTTP ${response.status}`)
  const text = await response.text()
  const value = JSON.parse(text.includes('data:') ? text.split('\n').find(line => line.startsWith('data:')).slice(5) : text)
  assert.ok(!value.error && !value.result?.isError, `MCP ${name} returned an error`)
  return JSON.parse(value.result.content[0].text)
}
const save = args => mcp('smartsiteSave', { operationId: randomUUID(), ...args })
async function waitHTTP() {
  for (let attempt = 0; attempt < 120; attempt++) {
    try { const r = await fetch(`${baseURL}/api/smartsite/health`, { signal: AbortSignal.timeout(2500) }); if (r.ok) { const health = await r.json(); assert.equal(health.siteId, siteId); return } } catch {}
    await pause(1000)
  }
  throw new Error(`${stage}: application did not become healthy; ${logFile}`)
}
async function assertAuth() {
  const response = await fetch(`${baseURL}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: credentials.adminPassword }), signal: AbortSignal.timeout(30000) })
  assert.equal(response.status, 200, 'Original account must still log in')
  const account = await response.json()
  assert.equal(account.user.email, email)
  assert.equal(account.user.role, 'developer')
  const rejected = await fetch(`${baseURL}/api/mcp`, { method: 'POST', headers: { Authorization: 'Bearer invalid-test-key', 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }), signal: AbortSignal.timeout(15000) })
  assert.ok(!rejected.ok, 'Invalid MCP key must not be accepted')
  assert.equal((await mcp('smartsiteRead', { action: 'catalogue' })).siteId, siteId)
  return account.user.id
}
async function assertPublic(expected, fixtureData) {
  await waitHTTP()
  const response = await fetch(`${baseURL}/docker-existing`, { signal: AbortSignal.timeout(30000) })
  assert.equal(response.status, 200, 'Published route survives')
  const text = await response.text()
  assert.ok(text.includes(expected), 'Public renderer uses preserved content')
  assert.ok(!text.includes('Private Docker draft'), 'Private draft remains private')
  const publicChild = await fetch(`${baseURL}/api/pages/${fixtureData.childId}`)
  assert.equal(publicChild.status, 200, 'Previously published child remains public')
  assert.equal((await publicChild.json()).title, 'Docker child', 'Draft edits do not replace published content')
  const media = await mcp('smartsiteRead', { action: 'get', target: 'media', id: fixtureData.mediaId })
  const mediaURL = new URL(media.document.url, baseURL)
  assert.equal(mediaURL.origin, baseURL, 'Uploaded media stays local')
  const image = await fetch(mediaURL, { signal: AbortSignal.timeout(30000) })
  assert.equal(image.status, 200, 'Persisted media is served through HTTP')
  assert.equal(sha(Buffer.from(await image.arrayBuffer())), fixtureData.mediaSHA)
  for (const item of fixtureData.mediaFiles) {
    const response = await fetch(item.url)
    assert.equal(response.status, 200, `Preserved variant ${item.filename}`)
    assert.equal(sha(Buffer.from(await response.arrayBuffer())), item.sha256)
  }
  assert.equal(await assertAuth(), fixtureData.ownerId)
}
const mongoShell = script => compose('exec', '-T', 'mongo', 'sh', '-c', 'mongosh "mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@127.0.0.1:27017/admin?authSource=admin&directConnection=true" --quiet --eval "$1"', 'sh', script)
async function copyMediaVolume(fromMount, toMount, fromPath, toPath) {
  await run('docker', ['run', '--rm', '--init', '--network', 'none', '--entrypoint', 'node', '--mount', `type=bind,source=${path.join(target, 'docker/copy-media.mjs')},target=/copy-media.mjs,readonly`, '--mount', fromMount, '--mount', toMount, oldImage, '/copy-media.mjs', '--from', fromPath, '--to', toPath])
}
async function imageFiles(document) {
  const files = []
  for (const item of [document, ...Object.values(document.sizes || {})]) {
    if (!item?.filename) continue
    const url = new URL(item.url, baseURL)
    assert.equal(url.origin, baseURL)
    const response = await fetch(url)
    assert.equal(response.status, 200)
    files.push({ filename: item.filename, url: url.href, sha256: sha(Buffer.from(await response.arrayBuffer())) })
  }
  assert.ok(files.length > 1, 'Image fixture must exercise resized variants')
  return files
}
const kit = path.join(target, 'scripts/upgrades/4.0.0')
const requestFile = path.join(fixture, 'request.private.json')
const upgrade = (name, ...args) => run(process.execPath, [path.join(kit, `${name}.mjs`), '--request', requestFile, ...args], { cwd: site })
console.log(`Owned Docker fixture: ${project}; private evidence: ${fixture}`)
try {
  assert.equal((await json(path.join(source, 'package.json'))).version, '4.0.1')
  await run('docker', ['info'])
  await run('docker', ['compose', 'version'])
  const disk = await run('docker', ['run', '--rm', '--entrypoint', 'df', 'mongo:8', '-Pk', '/'], { capture: true })
  const diskRow = disk.split('\n').filter(line => line.trim().startsWith('overlay')).at(-1) || disk.split('\n').at(-1)
  const availableKiB = Number(diskRow.trim().split(/\s+/)[3])
  assert.ok(Number.isFinite(availableKiB) && availableKiB >= 16 * 1024 * 1024, 'Docker needs at least 16 GiB free for two production images/builds; free reviewed disposable build resources before rerunning')
  await artifactCopy(source, target)
  let archive = argument('--archive')
  if (!archive) {
    archive = path.join(fixture, 'official-3.0.1.tar.gz')
    const response = await fetch(`https://api.github.com/repos/andy-dextrous/Smart-Site/tarball/${oldCommit}`, { signal: AbortSignal.timeout(120000) })
    assert.ok(response.ok, `Official 3.0.1 archive download: HTTP ${response.status}`)
    await writeFile(archive, Buffer.from(await response.arrayBuffer()))
  }
  assert.equal(sha(await readFile(archive)), archiveSha, 'Official archive checksum')
  await mkdir(baseline)
  await run('tar', ['-xzf', path.resolve(archive), '--strip-components=1', '-C', baseline])
  await artifactCopy(baseline, site)
  await writePrivate(envFile, envText(hostEnv))
  await writePrivate(path.join(fixture, 'app.private.env'), envText(appEnv))
  await writePrivate(path.join(fixture, 'build.private.env'), envText({ ...commonEnv, DATABASE_URL: dbURL(process.platform === 'linux' ? `127.0.0.1:${mongoPort}` : `host.docker.internal:${mongoPort}`), NEXT_DEPLOYMENT_ID: `${project}-native4` }))
  await writePrivate(path.join(fixture, 'mongo.private.env'), envText({ MONGO_INITDB_ROOT_USERNAME: 'acceptance', MONGO_INITDB_ROOT_PASSWORD: password, MONGO_INITDB_DATABASE: dbName, MONGO_APP_USERNAME: 'fixture-app', MONGO_APP_PASSWORD: secret(), MONGO_REPLICA_KEY: secret() }))
  const volume = name => `${project}_${name}`
  const composeConfig = {
    services: {
      mongo: { image: 'mongo:8', env_file: ['./mongo.private.env'], entrypoint: ['bash', '/smartsite/start-replica.sh'], ports: [`127.0.0.1:${mongoPort}:27017`], volumes: ['mongo-data:/data/db', 'mongo-config:/data/configdb', `${path.join(target, 'docker/mongo/start-replica.sh')}:/smartsite/start-replica.sh:ro`, `${path.join(target, 'docker/mongo/init-app-user.js')}:/docker-entrypoint-initdb.d/init-app-user.js:ro`, 'public-media:/fixture-media'] },
      'mongo-init': { image: 'mongo:8', env_file: ['./mongo.private.env'], entrypoint: ['mongosh', '--nodb', '--quiet', '/smartsite/init-replica.js'], volumes: [`${path.join(target, 'docker/mongo/init-replica.js')}:/smartsite/init-replica.js:ro`] },
      build: { init: true, image: oldImage, env_file: ['./app.private.env'], command: ['/app/docker/build-app.sh'], volumes: ['old-next:/app/.next'] },
      app: { init: true, image: oldImage, env_file: ['./app.private.env'], command: ['/app/docker/start-app.sh'], ports: [`127.0.0.1:${appPort}:3000`], volumes: ['old-next:/app/.next', 'public-media:/app/public/media'] },
    },
    volumes: Object.fromEntries(['mongo-data', 'mongo-config', 'public-media', 'old-next', 'new-next'].map(name => [name, { name: volume(name) }]))
  }
  const writeCompose = () => writePrivate(composeFile, JSON.stringify(composeConfig, null, 2)) // Compose also accepts JSON.
  await writeCompose()
  step('start isolated persistent Mongo replica set')
  dockerStarted = true
  await compose('up', '-d', 'mongo')
  await compose('run', '--rm', 'mongo-init')
  step('install and provision the official 3.0.1 site')
  await run('corepack', ['pnpm', 'install', '--frozen-lockfile', '--ignore-workspace'], { cwd: site })
  await mkdir(path.join(site, '.smartsite/local'), { recursive: true })
  await writePrivate(path.join(site, '.smartsite/local/state.json'), JSON.stringify({ siteId, email, siteName: 'Docker existing site' }))
  await writePrivate(path.join(site, '.smartsite/local/credentials.json'), JSON.stringify(credentials))
  await run(process.execPath, ['--import', 'tsx', 'scripts/local/provision.ts'], { cwd: site, env: { ...cleanEnv, ...hostEnv } })
  const require = createRequire(path.join(site, 'package.json'))
  const { MongoClient, BSON } = require('mongodb')
  const { snapshotDatabase, compareSnapshots } = await import(pathToFileURL(path.join(kit, 'mongo.mjs')))
  mongoClient = new MongoClient(hostEnv.DATABASE_URL)
  await mongoClient.connect()
  const db = mongoClient.db(dbName)
  step('build and run the actual 3.0.1 source Docker image')
  await run('docker', ['build', '--tag', oldImage, '--file', path.join(site, 'Dockerfile'), site])
  await compose('run', '--rm', 'build')
  await compose('up', '-d', 'app')
  await waitHTTP()
  const ownerId = await assertAuth()
  step('populate the old application through HTTP MCP')
  const sharp = require('sharp')
  const originalImage = await sharp({ create: { width: 1024, height: 768, channels: 3, background: '#336699' } }).png().toBuffer()
  const upload = await mcp('smartsiteUploadMedia', { operationId: randomUUID(), base64: originalImage.toString('base64'), alt: 'Docker upgrade persisted image' })
  const parent = await save({ action: 'create', target: 'pages', mode: 'publish', data: { title: 'Docker existing', slug: 'docker-existing', featuredImage: upload.document.id, sections: [{ blockType: 'hero', heading: 'Docker original published heading' }] } })
  const child = await save({ action: 'create', target: 'pages', mode: 'publish', data: { title: 'Docker child', slug: 'child', parent: parent.document.id, sections: [] } })
  const current = await mcp('smartsiteRead', { action: 'get', target: 'pages', id: child.document.id })
  await save({ action: 'update', target: 'pages', id: child.document.id, mode: 'draft', expectedRevision: current.revision, data: { title: 'Private Docker draft' } })
  const settings = await mcp('smartsiteRead', { action: 'get', target: 'settings' })
  await save({ action: 'update', target: 'settings', mode: 'live', expectedRevision: settings.revision, data: { general: { ...settings.document.general, siteName: 'Preserved Docker site' } } })
  // Payload intentionally converts the upload to WebP; preserve the bytes it actually stores.
  const storedImage = await fetch(new URL(upload.document.url, baseURL))
  assert.equal(storedImage.status, 200)
  const storedBytes = Buffer.from(await storedImage.arrayBuffer())
  assert.ok(storedBytes.length > 0)
  const fixtureData = { ownerId, pageId: parent.document.id, childId: child.document.id, mediaId: upload.document.id, mediaSHA: sha(storedBytes), mediaFiles: await imageFiles(upload.document) }
  await assertPublic('Docker original published heading', fixtureData)
  const authBefore = await db.collection('users').findOne({ email })
  const originalHash = authBefore.hash, originalSalt = authBefore.salt
  assert.ok(typeof originalHash === 'string' && originalHash.length > 0)
  assert.ok(typeof originalSalt === 'string' && originalSalt.length > 0)
  step('freeze writes and snapshot the populated database and media')
  await compose('stop', 'app')
  // Actual 3.x writes under standalone, despite the old Compose upload mount.
  // Perform the documented, verified relocation BEFORE creating an inspection.
  const legacyMedia = path.join(fixture, 'legacy-media')
  await mkdir(legacyMedia)
  await compose('cp', 'app:/app/.next/standalone/public/media/.', legacyMedia)
  await copyMediaVolume(`type=bind,source=${legacyMedia},target=/source,readonly`, `type=volume,source=${volume('public-media')},target=/destination`, '/source', '/destination')
  const originalSnapshot = await snapshotDatabase(db, BSON, siteId)
  await compose('exec', '-T', 'mongo', 'sh', '-c', 'mongodump --uri="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@127.0.0.1:27017/$MONGO_INITDB_DATABASE?authSource=admin&directConnection=true" --archive=/tmp/before.archive')
  await compose('cp', 'mongo:/tmp/before.archive', path.join(fixture, 'before.archive'))
  await compose('exec', '-T', 'mongo', 'tar', '-C', '/fixture-media', '-czf', '/tmp/before-media.tar.gz', '.')
  await compose('cp', 'mongo:/tmp/before-media.tar.gz', path.join(fixture, 'before-media.tar.gz'))
  await mkdir(path.join(site, 'public/media'), { recursive: true })
  await run('tar', ['-xzf', path.join(fixture, 'before-media.tar.gz'), '-C', path.join(site, 'public/media')])
  await writeFile(path.join(site, 'src/docker-upgrade-client-note.txt'), 'A client-owned source file survives the standalone upgrade.\n')
  await run('git', ['init', '-q'], { cwd: site })
  await run('git', ['add', '.'], { cwd: site })
  const staged = await run('git', ['diff', '--cached', '--name-only'], { cwd: site, capture: true })
  assert.ok(!staged.split('\n').some(name => name.startsWith('.smartsite/') || name.startsWith('public/media/') || (name.startsWith('.env') && !name.endsWith('.example'))), 'No private files in fixture source commit')
  await run('git', ['-c', 'user.name=SmartSite fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'Immutable 3.0.1 fixture with client addition'], { cwd: site })
  const restoreURL = new URL(hostEnv.DATABASE_URL); restoreURL.pathname = '/docker_upgrade_restore_proof'
  const restoreEnvironmentFile = path.join(fixture, 'restore.env')
  await writePrivate(restoreEnvironmentFile, `DATABASE_URL=${restoreURL.href}\n`)
  await writePrivate(requestFile, JSON.stringify({ schemaVersion: 1, siteRoot: site, expectedSiteId: siteId, sourceVersion: '3.0.1', targetVersion: '4.0.1', oldBaselineDirectory: baseline, targetArtifactDirectory: target, verifiedManifestPath: path.join(target, 'smartsite-export.json'), environmentFile: envFile, reportDirectory: reports, baselineManifestSha256: sha(await readFile(path.join(baseline, 'smartsite-export.json'))), targetManifestSha256: sha(await readFile(path.join(target, 'smartsite-export.json'))), restoreEnvironmentFile, writesQuiesced: true, allowedMediaHosts: [] }, null, 2))
  step('run the shipped upgrade kit with verified backup and dry run')
  await upgrade('inspect')
  await upgrade('backup')
  await upgrade('reconcile')
  assert.deepEqual((await json(path.join(reports, 'reconciliation.json'))).conflicts, [], 'Clean official release plus additive customization must reconcile without conflicts')
  await upgrade('reconcile', '--apply')
  assert.equal(await readFile(path.join(site, 'src/docker-upgrade-client-note.txt'), 'utf8'), 'A client-owned source file survives the standalone upgrade.\n')
  await run('corepack', ['pnpm', 'install', '--frozen-lockfile', '--ignore-workspace'], { cwd: site })
  await upgrade('migrate')
  await upgrade('migrate', '--apply')
  await upgrade('migrate', '--apply') // Receipts make the operation safe to resume.
  await upgrade('verify')
  assert.equal((await db.collection('users').findOne({ email })).hash, originalHash)
  assert.equal((await db.collection('users').findOne({ email })).salt, originalSalt)
  step('build the actual native 4.0 prebuilt Docker release')
  await run('docker', ['build', '--no-cache-filter', 'builder', ...(process.platform === 'linux' ? ['--network=host'] : ['--add-host=host.docker.internal:host-gateway']), '--file', path.join(site, 'Dockerfile.prebuilt'), '--secret', `id=smartsite_env,src=${path.join(fixture, 'build.private.env')}`, '--tag', newImage, site])
  composeConfig.services.app.image = newImage
  composeConfig.services.app.volumes = ['new-next:/app/.next', 'public-media:/app/public/media']
  await writeCompose()
  await compose('up', '-d', '--force-recreate', 'app')
  await assertPublic('Docker original published heading', fixtureData)
  step('edit through native 4.0 MCP and recreate the application container')
  const nativePage = await mcp('smartsiteRead', { action: 'get', target: 'pages', id: fixtureData.pageId })
  await save({ action: 'update', target: 'pages', id: fixtureData.pageId, mode: 'publish', expectedRevision: nativePage.revision, data: { sections: [{ blockType: 'hero', heading: 'Docker native four heading' }] } })
  const nativeUpload = await mcp('smartsiteUploadMedia', { operationId: randomUUID(), base64: (await sharp({ create: { width: 1024, height: 768, channels: 3, background: '#cc6633' } }).png().toBuffer()).toString('base64'), alt: 'Native Docker persistence and deletion' })
  const nativeFiles = await imageFiles(nativeUpload.document)
  await compose('stop', 'app')
  // Controlled crash injection: a real persisted intent is left with an expired
  // owner lease. The restarted app's own poller must recover it without a test
  // request to /api/publication or an out-of-process runner.
  const interrupted = await db.collection('site-publication-work').findOne({}, { sort: { _id: -1 } })
  assert.ok(interrupted, 'Native content editing persisted publication work')
  await db.collection('site-publication-work').updateOne({ _id: interrupted._id }, { $set: { status: 'running', owner: 'fixture-crashed-container', leaseUntil: new Date(Date.now() - 1000), attempts: 1, checkpoint: null, error: null } })
  await compose('rm', '--force', 'app')
  await compose('up', '-d', 'app')
  await waitHTTP()
  for (let attempt = 0; attempt < 30; attempt++) {
    const pending = await db.collection('site-publication-work').countDocuments({ status: { $in: ['pending', 'running', 'failed'] } })
    if (!pending) break
    if (attempt === 29) throw new Error('Publication did not recover after container recreation')
    await pause(2000)
  }
  await assertPublic('Docker native four heading', fixtureData)
  for (const file of nativeFiles) {
    const response = await fetch(file.url)
    assert.equal(response.status, 200, 'Native upload survived container recreation')
    assert.equal(sha(Buffer.from(await response.arrayBuffer())), file.sha256)
    await compose('exec', '-T', 'mongo', 'test', '-f', `/fixture-media/${file.filename}`)
  }
  const login = await fetch(`${baseURL}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: credentials.adminPassword }) }).then(response => response.json())
  const deletion = await fetch(`${baseURL}/api/media/${nativeUpload.document.id}`, { method: 'DELETE', headers: { Authorization: `JWT ${login.token}`, Origin: baseURL } })
  assert.equal(deletion.status, 200, 'Authenticated media deletion succeeds')
  assert.equal(await db.collection('media').countDocuments({ alt: 'Native Docker persistence and deletion' }), 0)
  for (const file of nativeFiles) {
    assert.equal((await fetch(file.url)).ok, false, 'Deleted original/variant is no longer served (Payload may return500 for missing files)')
    await compose('exec', '-T', 'mongo', 'test', '!', '-e', `/fixture-media/${file.filename}`)
  }
  assert.equal(await db.collection('users').countDocuments(), 1)
  assert.equal(await db.collection('payload-mcp-api-keys').countDocuments(), 1)
  step('rollback to the compatible 3.0.1 image while retaining all 4.0 writes')
  await compose('stop', 'app')
  composeConfig.services.app.image = oldImage
  composeConfig.services.app.volumes = ['old-next:/app/.next', 'public-media:/app/public/media']
  await writeCompose()
  // The shipped source-mode rollback recompiles its retained image before boot,
  // replacing stale build/cache state while preserving the current database.
  await compose('run', '--rm', 'build')
  await copyMediaVolume(`type=volume,source=${volume('public-media')},target=/source,readonly`, `type=volume,source=${volume('old-next')},target=/legacy`, '/source', '/legacy/standalone/public/media')
  await compose('up', '-d', '--force-recreate', 'app')
  await assertPublic('Docker native four heading', fixtureData)
  assert.equal(await db.collection('site-upgrade-receipts').countDocuments(), 1)
  step('separately restore the pre-cutover snapshot, intentionally discarding the fixture 4.0 edit')
  await compose('stop', 'app')
  await mongoShell(`db.getSiblingDB('${dbName}').dropDatabase()`)
  await compose('exec', '-T', 'mongo', 'sh', '-c', 'mongorestore --uri="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@127.0.0.1:27017/?authSource=admin&directConnection=true" --archive=/tmp/before.archive')
  await compose('exec', '-T', 'mongo', 'sh', '-c', 'find /fixture-media -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -C /fixture-media -xzf /tmp/before-media.tar.gz')
  assert.deepEqual(compareSnapshots(originalSnapshot, await snapshotDatabase(db, BSON, siteId)), [], 'Rollback restores all original collections, versions, identity, indexes and data')
  composeConfig.services.app.image = oldImage
  composeConfig.services.app.volumes = ['old-next:/app/.next', 'public-media:/app/public/media']
  await writeCompose()
  // The shipped source-mode rollback recompiles its retained image before boot,
  // replacing stale build/cache state while preserving the current database.
  await compose('run', '--rm', 'build')
  await copyMediaVolume(`type=volume,source=${volume('public-media')},target=/source,readonly`, `type=volume,source=${volume('old-next')},target=/legacy`, '/source', '/legacy/standalone/public/media')
  await compose('up', '-d', '--force-recreate', 'app')
  await assertPublic('Docker original published heading', fixtureData)
  assert.equal((await db.collection('users').findOne({ email })).hash, originalHash)
  assert.equal((await db.collection('users').findOne({ email })).salt, originalSalt)
  assert.equal(await db.collection('site-upgrade-receipts').countDocuments(), 0)
  assert.equal(await db.collection('pages').countDocuments(), 2)
  const result = { status: 'passed', officialSourceVersion: '3.0.1', officialSourceCommit: oldCommit, archiveSha256: archiveSha, targetVersion: '4.0.1', targetManifestSha256: sha(await readFile(path.join(target, 'smartsite-export.json'))), checks: ['official-source-docker-build', 'HTTP-MCP-population', 'authenticated-admin-and-MCP', 'legacy-Docker-media-relocation', 'persisted-original-and-variant-media', 'native-media-create-delete-recreate', 'kit-backup-restore-inspect-reconcile-dry-run-apply-verify', 'upgrade-resume', 'native-prebuilt-docker-image', 'same-identity-and-password-hash', 'container-recreation', 'publication-recovery', 'compatible-old-image-retains-new-writes', 'old-image-and-data-snapshot-rollback'], project, completedAt: new Date().toISOString() }
  await mkdir(path.join(source, 'test-results'), { recursive: true })
  await writeFile(path.join(source, 'test-results/docker-app-upgrade.json'), JSON.stringify(result, null, 2) + '\n')
  passed = true
  console.log(JSON.stringify(result))
} catch (error) {
  console.error(`Docker application upgrade FAILED at ${stage}. Private evidence: ${fixture}. ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoClient?.close().catch(() => {})
  if (!(keep && !passed)) {
    if (dockerStarted) await compose('down', '--volumes', '--remove-orphans').catch(() => { process.exitCode = 1; console.error(`Owned Docker cleanup failed: ${project}; retain ${composeFile}`) })
    // Compose can leave a previously used volume after a service switches to
    // another build volume. Remove only this fixture's exact owned names.
    if (dockerStarted) {
      const ownedNames = new Set(['mongo-data', 'mongo-config', 'public-media', 'old-next', 'new-next'].map(name => `${project}_${name}`))
      try {
        const remaining = await run('docker', ['volume', 'ls', '--filter', `label=com.docker.compose.project=${project}`, '--format', '{{.Name}}'], { capture: true })
        for (const name of remaining.split('\n').filter(Boolean)) {
          if (!ownedNames.has(name)) throw new Error(`Unexpected volume in fixture project: ${name}`)
          await run('docker', ['volume', 'rm', name])
        }
      } catch { process.exitCode = 1; console.error(`Owned volume cleanup needs inspection: ${project}`) }
    }
    for (const image of images) await run('docker', ['image', 'rm', image]).catch(() => {})
  } else console.error(`Retained only owned resources for diagnosis: docker compose --project-name ${project} --file ${composeFile} down --volumes --remove-orphans`)
  log.end()
  // Keep private failure evidence; successful runs remove private credentials/data.
  if (passed && !process.exitCode) await rm(fixture, { recursive: true, force: true })
}
