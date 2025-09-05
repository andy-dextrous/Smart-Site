#!/usr/bin/env tsx

import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { getFrontendCollections } from "../src/admin/config/index"

dotenv.config()

/*************************************************************************/
/*  SITEMAP INDEX GENERATOR - POST BUILD SCRIPT
/*************************************************************************/

function generateSitemapIndex(siteUrl: string, collections: Array<{ slug: string; label: string }>) {
  const sitemapEntries = collections
    .map(
      collection => `  <sitemap>
    <loc>${siteUrl}/sitemap/${collection.slug}.xml</loc>
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
    const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
    console.log(`🔧 Generating sitemap index for: ${siteUrl}`)

    // Get frontend collections from config and transform to array format
    const collectionsObject = getFrontendCollections()
    const collections = Object.entries(collectionsObject).map(([slug, collection]) => ({
      slug,
      label: collection.label,
    }))
    
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