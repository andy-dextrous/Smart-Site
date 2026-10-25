// Disposable rehearsal only. Uses a unique Compose project; never accepts a real target.
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { mkdtemp, writeFile, cp, rm } from "node:fs/promises"
import { randomBytes } from "node:crypto"
import os from "node:os"
import path from "node:path"
const exec = promisify(execFile)
const dir = await mkdtemp(path.join(os.tmpdir(), "smartsite-docker-upgrade-"))
const project = "smartsite-acceptance-" + randomBytes(6).toString("hex")
const compose = (...args) =>
  exec("docker", ["compose", "-p", project, "--env-file", ".env", ...args], {
    cwd: dir,
    maxBuffer: 4 * 1024 * 1024,
  })
const databaseScript = body =>
  `const c=new Mongo('mongodb://'+process.env.MONGO_INITDB_ROOT_USERNAME+':'+process.env.MONGO_INITDB_ROOT_PASSWORD+'@127.0.0.1:27017/admin?authSource=admin');const d=c.getDB('acceptance');const check=(x)=>{if(!x)throw new Error('Fixture assertion failed')};${body}`
const shell = body =>
  compose(
    "exec",
    "-T",
    "mongo",
    "mongosh",
    "--nodb",
    "--quiet",
    "--eval",
    databaseScript(body)
  )
const wait = async fn => {
  let last
  for (let i = 0; i < 90; i++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  throw last
}
const oldCompose = volume =>
  `services:\n  mongo:\n    image: mongo:8\n    env_file: [.env]\n    volumes: [${volume}:/data/db]\nvolumes:\n  legacy-data:\n  rollback-data:\n`
try {
  await writeFile(
    path.join(dir, ".env"),
    `MONGO_INITDB_ROOT_USERNAME=acceptance\nMONGO_INITDB_ROOT_PASSWORD=${randomBytes(24).toString("hex")}\nMONGO_INITDB_DATABASE=acceptance\nMONGO_REPLICA_KEY=${randomBytes(64).toString("base64")}\n`,
    { mode: 0o600 }
  )
  await writeFile(path.join(dir, "compose.yaml"), oldCompose("legacy-data"))
  await compose("up", "-d", "mongo")
  await wait(() => shell("check(d.runCommand({ping:1}).ok===1)"))
  await shell(
    "d.records.insertOne({_id:'preserved',value:42});check(d.records.countDocuments()===1)"
  )
  // Store the pre-upgrade backup privately on the host, outside the database volume.
  const dump = await compose(
    "exec",
    "-T",
    "mongo",
    "sh",
    "-c",
    'mongodump --uri="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@127.0.0.1:27017/acceptance?authSource=admin" --archive=/tmp/before.archive --gzip'
  )
  await compose("cp", "mongo:/tmp/before.archive", "before.archive")
  await compose("down")
  await cp("docker/mongo", path.join(dir, "mongo"), { recursive: true })
  await writeFile(
    path.join(dir, "compose.yaml"),
    `services:\n  mongo:\n    image: mongo:8\n    env_file: [.env]\n    entrypoint: [bash, /smartsite/start-replica.sh]\n    volumes:\n      - legacy-data:/data/db\n      - replica-config:/data/configdb\n      - ./mongo/start-replica.sh:/smartsite/start-replica.sh:ro\n  mongo-init:\n    image: mongo:8\n    env_file: [.env]\n    depends_on: [mongo]\n    entrypoint: [mongosh, --nodb, --quiet, /smartsite/init-replica.js]\n    volumes: [./mongo/init-replica.js:/smartsite/init-replica.js:ro]\nvolumes:\n  legacy-data:\n  rollback-data:\n  replica-config:\n`
  )
  await compose("up", "-d", "mongo")
  await compose("run", "--rm", "mongo-init")
  await wait(() =>
    shell(
      "check(d.hello().isWritablePrimary===true);check(d.records.findOne({_id:'preserved'}).value===42)"
    )
  )
  await shell(
    "const s=c.startSession();s.startTransaction();s.getDatabase('acceptance').records.insertOne({_id:'transaction',value:7});s.commitTransaction();s.endSession();check(d.records.countDocuments()===2)"
  )
  await compose("restart", "mongo")
  await wait(() =>
    shell(
      "check(d.hello().isWritablePrimary===true);check(d.records.countDocuments()===2)"
    )
  )
  // Prove old data recovery on a distinct empty volume, keeping upgraded data intact.
  await compose("down")
  await writeFile(path.join(dir, "compose.yaml"), oldCompose("rollback-data"))
  await compose("up", "-d", "mongo")
  await wait(() => shell("check(d.runCommand({ping:1}).ok===1)"))
  await compose("cp", "before.archive", "mongo:/tmp/before.archive")
  await compose(
    "exec",
    "-T",
    "mongo",
    "sh",
    "-c",
    'mongorestore --uri="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@127.0.0.1:27017/acceptance?authSource=admin" --archive=/tmp/before.archive --gzip'
  )
  await shell(
    "check(d.records.countDocuments()===1);check(d.records.findOne({_id:'preserved'}).value===42)"
  )
  console.log(
    JSON.stringify({
      passed: [
        "populated-single-node-conversion",
        "same-volume-record-preservation",
        "authenticated-transaction",
        "replica-restart",
        "pre-upgrade-backup-restored-to-separate-volume",
      ],
    })
  )
} finally {
  // Add all owned volumes to cleanup even if the rollback compose is current.
  await writeFile(
    path.join(dir, "cleanup.yaml"),
    "services: {}\nvolumes:\n  legacy-data:\n  rollback-data:\n  replica-config:\n"
  )
  await compose(
    "-f",
    "compose.yaml",
    "-f",
    "cleanup.yaml",
    "down",
    "-v",
    "--remove-orphans"
  )
  await rm(dir, { recursive: true, force: true })
}
