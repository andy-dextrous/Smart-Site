#!/usr/bin/env tsx

import fs from "fs"
import path from "path"
import { pathToFileURL } from "url"
import dotenv from "dotenv"

dotenv.config()

/*************************************************************************/
/*  SITEMAP INDEX GENERATOR - POST BUILD SCRIPT
/*************************************************************************/

export type SitemapCollectionEntry = {
  slug: string
  label: string
}

export type SitemapIndexOptions = {
  cwd?: string
  siteUrl?: string
}

export function buildSitemapIndexXml(
  siteUrl: string,
  collections: SitemapCollectionEntry[]
): string {
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

async function loadFrontendCollections(): Promise<SitemapCollectionEntry[]> {
  const { getFrontendCollections } = await import("../src/lib/collections")
  return (await getFrontendCollections()).filter(item => item.sitemap?.enabled !== false)
}

export async function generateSitemapIndexFile(
  options: SitemapIndexOptions = {}
): Promise<{
  outputPath: string
  xml: string
  collections: SitemapCollectionEntry[]
  siteUrl: string
}> {
  const workingDir = options.cwd ?? process.cwd()
  const siteUrl =
    options.siteUrl || process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
  const collectionsObject = await loadFrontendCollections()
  const collections = collectionsObject.map(collection => ({
    slug: collection.slug,
    label: collection.label,
  }))

  const sitemapIndexXML = buildSitemapIndexXml(siteUrl, collections)
  const outputPath = path.join(workingDir, "public", "sitemap.xml")
  fs.writeFileSync(outputPath, sitemapIndexXML, "utf8")

  return {
    outputPath,
    xml: sitemapIndexXML,
    collections,
    siteUrl,
  }
}

async function main() {
  try {
    const { outputPath, collections, siteUrl } = await generateSitemapIndexFile()
    console.log(`🔧 Generating sitemap index for: ${siteUrl}`)
    console.log(`✅ Sitemap index generated successfully at: ${outputPath}`)
    console.log(`📊 Contains ${collections.length} collection sitemaps`)
  } catch (error) {
    console.error("❌ Error generating sitemap index:", error)
    process.exit(1)
  }
}

const executedScript = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined

if (import.meta.url === executedScript) {
  main()
}
