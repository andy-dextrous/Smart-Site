import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { readdir, mkdir, rm, writeFile, copyFile, chmod } from "node:fs/promises"
import { chromium, expect } from "@playwright/test"
import sharp from "sharp"
import { MongoClient, ObjectId } from "mongodb"
import {
  local,
  loadState,
  readJSON,
  cleanEnvironment,
} from "../../scripts/local/state.mjs"
import { databaseURL } from "../../scripts/local/database.mjs"
import { stopProcess } from "../../scripts/local/runtime.mjs"
import { mcpRequest } from "../../scripts/local/clients.mjs"
const files = await readdir(".")
if (
  files.some(f => f.startsWith(".env") && !f.endsWith(".example")) ||
  files.includes(".smartsite")
)
  throw new Error("Browser acceptance requires a clean disposable export")
const run = args =>
  new Promise((resolve, reject) => {
    const p = spawn(process.execPath, args, { env: cleanEnvironment(), stdio: "inherit" })
    p.on("error", reject)
    p.on("exit", c => (c === 0 ? resolve() : reject(new Error(`Fixture exited ${c}`))))
  })
const richText = text => ({
  root: {
    type: "root",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    children: [
      {
        type: "paragraph",
        version: 1,
        direction: "ltr",
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            version: 1,
            text,
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
})
let browser, client
try {
  await run(["scripts/bootstrap-smartsite.mjs"])
  const state = await loadState(),
    credentials = await readJSON(local + "/credentials.json"),
    base = `http://127.0.0.1:${state.appPort}`
  client = await new MongoClient(databaseURL(state, credentials)).connect()
  const db = client.db()
  const call = async (name, args) =>
    JSON.parse(
      (await mcpRequest(state, credentials, "tools/call", { name, arguments: args }))
        .content[0].text
    )
  const save = args =>
    call("smartsiteSave", { operationId: crypto.randomUUID(), ...args })
  const form = await save({
    target: "forms",
    action: "create",
    mode: "live",
    data: {
      title: "Acceptance enquiry",
      fields: [
        { blockType: "text", name: "name", label: "Your name", required: true },
        { blockType: "email", name: "email", label: "Email address", required: true },
      ],
      submitButtonLabel: "Send test enquiry",
      confirmationType: "message",
      confirmationMessage: richText("Local test received"),
      emails: [],
    },
  })
  const created = await save({
    target: "pages",
    action: "create",
    mode: "publish",
    data: {
      title: "Browser acceptance",
      slug: "browser-acceptance",
      sections: [
        {
          blockType: "hero",
          heading: "A standalone website",
          sectionSettings: { colorScheme: "dark" },
        },
        { blockType: "contact-form", form: form.document.id, layout: "stacked" },
      ],
    },
  })
  const owner = await db.collection("users").findOne({ username: "owner" })
  const template = await save({
    target: "templates",
    action: "create",
    mode: "live",
    data: {
      name: "Public article",
      sections: [
        { blockType: "posts-hero", showAuthor: true },
        { blockType: "posts-content" },
      ],
    },
  })
  const settings = await call("smartsiteRead", { action: "get", target: "settings" })
  await save({
    target: "settings",
    action: "update",
    mode: "live",
    expectedRevision: settings.revision,
    data: {
      routing: {
        ...settings.document.routing,
        postsSingleTemplate: template.document.id,
      },
    },
  })
  const avatarBytes = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "#6633cc" },
  })
    .png()
    .toBuffer()
  const avatar = await call("smartsiteUploadMedia", {
    operationId: crypto.randomUUID(),
    base64: avatarBytes.toString("base64"),
    alt: "Fixture author avatar",
  })
  await db
    .collection("users")
    .updateOne({ _id: owner._id }, { $set: { avatar: new ObjectId(avatar.document.id) } })
  const post = await save({
    target: "posts",
    action: "create",
    mode: "publish",
    data: {
      title: "Public byline acceptance",
      slug: "byline-acceptance",
      authors: [String(owner._id)],
      content: richText("A public article with a private account behind its byline."),
    },
  })
  assert.ok(!JSON.stringify(post).includes("owner@smartsite.local"))
  await rm("test-results/browser", { recursive: true, force: true })
  await mkdir("test-results/browser", { recursive: true })
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  })
  const page = await context.newPage()
  page.setDefaultTimeout(30000)
  const errors = []
  const failures = []
  page.on("pageerror", e => errors.push(e.message))
  await page.goto(base + "/browser-acceptance", { waitUntil: "networkidle" })
  await expect(page.getByRole("heading", { name: "A standalone website" })).toBeVisible()
  await page.screenshot({ path: "test-results/browser/desktop.png", fullPage: true })
  await page.getByRole("button", { name: "Search", exact: true }).click()
  await page.getByPlaceholder("Search pages and posts").fill("Browser acceptance")
  await expect(
    page
      .getByRole("dialog")
      .getByRole("option", { name: /Browser acceptance/ })
      .first()
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByLabel("Your name", { exact: false }).fill("Disposable fixture")
  await page.getByLabel("Email address", { exact: false }).fill("fixture@example.test")
  await page.getByRole("button", { name: "Send test enquiry" }).click()
  await expect(page.getByText("Local test received", { exact: true })).toBeVisible()
  assert.equal(await db.collection("form-submissions").countDocuments(), 1)
  const current = await call("smartsiteRead", {
    action: "get",
    target: "pages",
    id: created.document.id,
  })
  await save({
    target: "pages",
    id: created.document.id,
    action: "update",
    mode: "draft",
    expectedRevision: current.revision,
    data: { title: "Private browser draft" },
  })
  await page.reload({ waitUntil: "networkidle" })
  await expect(page).toHaveTitle(/Browser acceptance/)
  assert.ok(!(await page.content()).includes("Private browser draft"))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload({ waitUntil: "networkidle" })
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.getByRole("heading", { name: "A standalone website" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Send test enquiry" })).toBeVisible()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: "test-results/browser/mobile.png", fullPage: true })
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true
  )
  await page.setViewportSize({ width: 1440, height: 1000 })
  const publicPost = await fetch(base + "/api/posts/" + post.document.id).then(r =>
    r.json()
  )
  assert.ok(JSON.stringify(publicPost.populatedAuthors).includes("Site Owner"))
  assert.ok(!JSON.stringify(publicPost).includes("owner@smartsite.local"))
  assert.ok(publicPost.populatedAuthors[0].avatar.url)
  assert.ok(publicPost.uri, "Published post must have a public route")
  if (publicPost.uri) {
    const response = await page.goto(base + publicPost.uri, { waitUntil: "networkidle" })
    await page.screenshot({ path: "test-results/browser/byline.png", fullPage: true })
    try {
      await expect(page.getByText("Site Owner", { exact: false }).first()).toBeVisible()
      await expect(page.getByRole("img", { name: "Fixture author avatar" })).toBeVisible()
      const avatarBox = await page
        .getByRole("img", { name: "Fixture author avatar" })
        .boundingBox()
      assert.ok(avatarBox.width >= 78 && avatarBox.height >= 78)
      assert.equal(
        await page
          .getByRole("img", { name: "Fixture author avatar" })
          .evaluate(img => img.complete && img.naturalWidth > 0),
        true
      )
      await page.screenshot({ path: "test-results/browser/byline.png", fullPage: true })
    } catch (error) {
      failures.push({
        check: "public-byline-privacy",
        uri: publicPost.uri,
        status: response.status(),
        message: error.message,
      })
    }
  }
  await page.goto(base + "/admin/login", { waitUntil: "networkidle" })
  await page.getByRole("textbox", { name: /Email or Username/ }).fill("owner")
  await page.locator("input[type=password]").fill(credentials.adminPassword)
  await page.getByRole("button", { name: "Login", exact: true }).click()
  await page.waitForURL(base + "/admin", { timeout: 60000 })
  await expect(
    page.getByRole("link", { name: "Pages", exact: true }).first()
  ).toBeVisible()
  assert.equal(
    await page
      .locator(
        'a[href*="smartsite-operations"],a[href*="smartsite-identity"],a[href*="smartsite-uploads"]'
      )
      .count(),
    0
  )
  await page.goto(base + "/admin/collections/pages/" + created.document.id, {
    waitUntil: "networkidle",
  })
  await expect(page.locator("#field-title")).toHaveValue("Private browser draft")
  await page.screenshot({ path: "test-results/browser/cms.png", fullPage: true })
  assert.deepEqual(errors, [])
  const result = {
    passed: [
      "real-desktop-mobile",
      "no-horizontal-overflow",
      "local-form-submission",
      "draft-public-isolation",
      "public-byline-privacy",
      "public-search",
      "cms-login-and-editor",
      "hidden-internal-collections",
      "no-page-errors",
    ].filter(check => !failures.some(failure => failure.check === check)),
    failures,
  }
  await writeFile("test-results/browser/result.json", JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result))
  assert.deepEqual(failures, [], "Browser acceptance failures (see result.json)")
} catch (error) {
  // Keep local diagnostics before teardown; never publish this private fixture log.
  await mkdir("test-results/browser", { recursive: true })
  await copyFile(local + "/app.log", "test-results/browser/app.log")
    .then(() => chmod("test-results/browser/app.log", 0o600))
    .catch(() => {})
  throw error
} finally {
  await browser?.close()
  await client?.close()
  const state = await loadState().catch(error => {
    if (error.code !== "ENOENT") throw error
    return null
  })
  await stopProcess(state?.appProcess)
  await stopProcess(state?.databaseProcess)
  for (const name of [".env", ".smartsite", ".mcp.json", ".codex/config.toml"])
    await rm(name, { recursive: true, force: true })
}
