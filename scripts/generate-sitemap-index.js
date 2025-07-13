#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/*************************************************************************/
/*  SITEMAP INDEX GENERATOR - POST BUILD SCRIPT
/*************************************************************************/

function loadFrontendCollections() {
  try {
    const jsonPath = path.join(
      process.cwd(),
      "src/payload/collections/frontend/frontend-collections.json"
    )
    const jsonData = fs.readFileSync(jsonPath, "utf8")
    return JSON.parse(jsonData)
  } catch (error) {
    console.error("❌ Failed to load frontend collections:", error)
    process.exit(1)
  }
}

function generateSitemapIndex(siteUrl, collections) {
  const sitemapEntries = collections
    .map(
      collection => `  <sitemap>
    <loc>${siteUrl}/sitemap/${collection.slug}-sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
    )
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`
}

function main() {
  try {
    // Determine site URL with Vercel auto-detection
    const siteUrl = process.env.NEXT_PUBLIC_URL
    console.log(`🔧 Generating sitemap index for: ${siteUrl}`)

    const collections = loadFrontendCollections()
    const sitemapIndexXML = generateSitemapIndex(siteUrl, collections)

    const outputPath = path.join(process.cwd(), "public", "sitemap.xml")
    fs.writeFileSync(outputPath, sitemapIndexXML, "utf8")

    console.log(`✅ Sitemap index generated successfully at: ${outputPath}`)
    console.log(`📊 Contains ${collections.length} collection sitemaps`)
  } catch (error) {
    console.error("❌ Error generating sitemap index:", error)
    process.exit(1)
  }
}

main()
