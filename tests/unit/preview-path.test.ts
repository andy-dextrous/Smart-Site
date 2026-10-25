import assert from "node:assert/strict"
import test from "node:test"
import { publicPreviewPath } from "../../src/utilities/preview-path"

test("preview returns retain public path and ordinary query parameters", () => {
  assert.equal(
    publicPreviewPath(
      "/preview/preview/news/item?preview=true&keep=one&keep=two&livePreview=true&previewCollection=pages&previewDocumentId=123"
    ),
    "/news/item?keep=one&keep=two"
  )
  assert.equal(publicPreviewPath("/preview?preview=true"), "/")
  assert.equal(publicPreviewPath("/previewing?q=ok"), "/previewing?q=ok")
})

test("preview returns reject normalized and encoded external paths", () => {
  for (const path of [
    "https://evil.example",
    "//evil.example/x",
    "/.//evil.example/x",
    "/a/..//evil.example/x",
    "/preview//evil.example/x",
    "/\\evil.example/x",
    "/%2fevil.example/x",
    "/%5cevil.example/x",
    "/%00evil",
    "/%invalid",
  ])
    assert.equal(publicPreviewPath(path), null, path)
})
