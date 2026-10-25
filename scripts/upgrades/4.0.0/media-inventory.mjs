import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
import path from "node:path"
import { loadRequest, save, readOptional } from "./common.mjs"
const { request, env, restoreEnv, fingerprint } = await loadRequest()
for (const key of Object.keys(process.env))
  if (
    /^(DATABASE_|STAGING_|SMARTSITE_|PAYLOAD_|BLOB_|VERCEL_BLOB_|S3_|AWS_|RESEND_|CRON_SECRET)/.test(
      key
    )
  )
    delete process.env[key]
// URL resolution must never initialize the live source application.
Object.assign(process.env, env, {
  DATABASE_URL: restoreEnv.DATABASE_URL,
  SMARTSITE_DATABASE_TARGET: "default",
  DISABLE_PAYLOAD_HMR: "true",
  NODE_ENV: "production",
})
delete process.env.PORT
const require = createRequire(path.join(request.siteRoot, "package.json"))
const { getPayload } = await import(pathToFileURL(require.resolve("payload")).href)
const native = path.join(request.siteRoot, "src/payload.config.ts")
const configFile = (await readOptional(native))
  ? native
  : path.join(request.siteRoot, "src/admin/payload/payload.config.ts")
const { default: config } = await import(pathToFileURL(configFile).href)
const resolved = await config
resolved.onInit = undefined
resolved.email = () => ({
  name: "upgrade-inventory",
  defaultFromAddress: "disabled@example.invalid",
  defaultFromName: "Disabled",
  sendEmail: async () => {
    throw new Error("Email disabled during upgrade inventory")
  },
})
resolved.jobs = { ...resolved.jobs, autoRun: [] }
const uploads = resolved.collections.filter(collection => collection.upload)
if (uploads.some(collection => collection.slug !== "media"))
  throw new Error(
    "Custom upload collections require a separately verified backup procedure; automatic backup is not certified"
  )
const mediaConfig = uploads.find(collection => collection.slug === "media")
if (
  !mediaConfig?.upload?.disableLocalStorage &&
  mediaConfig?.upload?.staticDir &&
  path.resolve(request.siteRoot, mediaConfig.upload.staticDir) !==
    path.join(request.siteRoot, "public/media")
)
  throw new Error(
    "Custom media staticDir requires a separately verified backup procedure"
  )
const payload = await getPayload({ config: resolved })
try {
  const files = []
  let after
  while (true) {
    const result = await payload.find({
      collection: "media",
      sort: "id",
      limit: 100,
      pagination: false,
      depth: 0,
      overrideAccess: true,
      where: after ? { id: { greater_than: after } } : {},
    })
    for (const doc of result.docs) {
      for (const [variant, item] of [
        ["original", doc],
        ...Object.entries(doc.sizes || {}),
      ]) {
        if (!item?.filename) continue
        if (!item.url)
          throw new Error(`Media URL cannot be resolved for ${doc.id}/${variant}`)
        files.push({
          mediaId: doc.id,
          variant,
          filename: item.filename,
          url: new URL(item.url, env.NEXT_PUBLIC_URL).href,
          bytes: item.filesize,
          mimeType: item.mimeType || doc.mimeType,
        })
      }
    }
    if (result.docs.length < 100) break
    after = result.docs.at(-1).id
  }
  await save(path.join(request.reportDirectory, "media-inventory.json"), {
    fingerprint,
    files,
  })
  console.log(JSON.stringify({ mediaFiles: files.length }))
} finally {
  await payload.destroy()
}
