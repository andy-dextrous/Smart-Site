import assert from "node:assert/strict"
// Only called for a source that explicitly chooses hosted Vercel Blob storage.
// Importing configuration must reject a missing token before Payload opens a DB.
if (process.argv.includes("--missing")) {
  await assert.rejects(
    import("@payload-config"),
    /Hosted Elvora requires BLOB_READ_WRITE_TOKEN or VERCEL_BLOB_TOKEN/
  )
  console.log(
    JSON.stringify({ passed: "hosted-blob-missing-token-refused-before-database" })
  )
} else {
  const config = await (await import("@payload-config")).default
  const media = config.collections.find(collection => collection.slug === "media")!
  assert.equal(typeof media.upload === "object" && media.upload.disableLocalStorage, true)
  console.log(JSON.stringify({ passed: "hosted-blob-legacy-token-alias-preserved" }))
}
