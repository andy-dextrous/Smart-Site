import assert from "node:assert/strict"
import { expect } from "@playwright/test"

export const adminBarGeometry = page =>
  page.evaluate(() => {
    const rect = selector => {
      const element = document.querySelector(selector)
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        top: box.top,
        bottom: box.bottom,
        height: box.height,
        left: box.left,
        right: box.right,
      }
    }
    return {
      bar: rect(".admin-bar"),
      header: rect(".smartsite-header"),
      section: rect("main section"),
      spacer: rect(".admin-bar-space"),
      sheet: rect(".smartsite-mobile-menu"),
      wrapperPosition: document.querySelector("#smooth-wrapper")
        ? getComputedStyle(document.querySelector("#smooth-wrapper")).position
        : null,
      smoothPadding: document.querySelector("#smooth-content")
        ? getComputedStyle(document.querySelector("#smooth-content")).paddingTop
        : null,
      offset: document.documentElement.style.getPropertyValue(
        "--smartsite-admin-bar-height"
      ),
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }
  })

// Use the real authenticated frontend: CSS layer order and ScrollSmoother cannot
// be verified by rendering the toolbar in isolation.
export async function checkAdminBarLayout(page, { url, loggedOut, screenshots }) {
  await page.goto(url, { waitUntil: "networkidle" })
  await expect(page.locator(".admin-bar")).toBeVisible()
  const results = {}
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
    ["narrow", 320, 800],
  ]) {
    await page.setViewportSize({ width, height })
    await page.evaluate(() => scrollTo(0, 0))
    await expect
      .poll(async () => {
        const { bar, header, offset } = await adminBarGeometry(page)
        return header.top >= bar.bottom && offset === `${Math.ceil(bar.height)}px`
      })
      .toBe(true)
    const geometry = (results[name] = await adminBarGeometry(page))
    assert.equal(
      geometry.spacer?.height ?? 0,
      geometry.smoothPadding === null ? Math.ceil(geometry.bar.height) : 0
    )
    assert.ok(geometry.scrollWidth <= width, "Toolbar must not widen the page")
    if (geometry.smoothPadding !== null) {
      assert.equal(geometry.smoothPadding, geometry.offset)
    }
    if (name === "desktop" && loggedOut.section && geometry.section) {
      assert.equal(
        geometry.section.top - loggedOut.section.top,
        Math.ceil(geometry.bar.height)
      )
    }
    await page.screenshot({ path: `${screenshots}/admin-bar-${name}.png` })
    if (name === "mobile") {
      await page.getByRole("button", { name: "Open menu", exact: true }).click()
      await expect(page.locator(".smartsite-mobile-menu")).toBeVisible()
      await expect
        .poll(async () => {
          const { sheet, bar } = await adminBarGeometry(page)
          return sheet.top >= bar.bottom && sheet.bottom <= height + 1 && sheet.left >= -1
        })
        .toBe(true)
      results.mobileMenu = await adminBarGeometry(page)
      await page.screenshot({ path: `${screenshots}/admin-bar-mobile-menu.png` })
      await page.keyboard.press("Escape")
      await expect(page.locator(".smartsite-mobile-menu")).toHaveCount(0)
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect
    .poll(async () => (await adminBarGeometry(page)).offset)
    .toBe(results.desktop.offset)
  return results
}

// A narrow desktop viewport does not exercise ScrollSmoother's touch behavior:
// with default settings its wrapper remains in normal flow on a touch device.
export async function checkTouchAdminBarLayout(
  browser,
  { url, email, password, screenshots }
) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  })
  try {
    const page = await context.newPage()
    await page.goto(url, { waitUntil: "networkidle" })
    const loggedOut = await adminBarGeometry(page)
    assert.equal(loggedOut.bar, null)
    const login = await context.request.post(new URL("/api/users/login", url).href, {
      data: { email, password },
    })
    assert.ok(login.ok(), "Touch fixture must authenticate through Payload")
    await page.reload({ waitUntil: "networkidle" })
    await expect(page.locator(".admin-bar")).toBeVisible()
    await expect
      .poll(async () => {
        const current = await adminBarGeometry(page)
        return (
          current.header.top >= current.bar.bottom &&
          Math.abs(
            current.section.top - loggedOut.section.top - Math.ceil(current.bar.height)
          ) < 1
        )
      })
      .toBe(true)
      .catch(async error => {
        console.error(JSON.stringify({
          check: "touch-admin-bar-geometry",
          loggedOut,
          current: await adminBarGeometry(page),
        }))
        throw error
      })
    const loggedIn = await adminBarGeometry(page)
    assert.ok(loggedIn.scrollWidth <= loggedIn.width)
    await page.screenshot({ path: `${screenshots}/admin-bar-touch.png` })
    await page.getByRole("button", { name: "Open menu", exact: true }).click()
    await expect(page.locator(".smartsite-mobile-menu")).toBeVisible()
    await expect
      .poll(async () => {
        const { sheet, bar } = await adminBarGeometry(page)
        return sheet.top >= bar.bottom && sheet.bottom <= 845 && sheet.left >= -1
      })
      .toBe(true)
    return { loggedOut, loggedIn }
  } finally {
    await context.close()
  }
}
