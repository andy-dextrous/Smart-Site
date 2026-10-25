import type { MetadataRoute } from "next"
import site from "@/site.config"
import {
  getFrontendCollectionKeys,
  shouldIncludeCollectionInSitemap,
} from "@/website/sitemaps/config"
import { generateSitemap } from "@/website/sitemaps/generator"
import { getServerSideURL } from "@/utilities/get-url"

/*************************************************************************/
/*  GENERATE SITEMAPS - ONE PER FRONTEND COLLECTION
/*************************************************************************/

export async function generateSitemaps() {
  try {
    const config = site
    if (!config.features.sitemaps) {
      return []
    }
    const activeSitemapKeys = await getFrontendCollectionKeys()

    return activeSitemapKeys.map(collectionSlug => ({
      id: collectionSlug,
    }))
  } catch (error) {
    console.error("Error generating sitemap list:", error)
    return []
  }
}

/*************************************************************************/
/*  DYNAMIC SITEMAP GENERATION BY COLLECTION SLUG
/*************************************************************************/

export default async function sitemap({
  id,
}: {
  id: Promise<string>
}): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getServerSideURL()
  const collectionSlug = await id

  try {
    const config = site
    if (!config.features.sitemaps) {
      return []
    }

    const getSitemapEntries = async (collectionName: string) => {
      if (!(await shouldIncludeCollectionInSitemap(collectionName))) {
        return []
      }

      const result = await generateSitemap({
        collectionName,
        siteUrl,
      })

      if (!result.entries.length) {
        return []
      }

      return result.entries.map(entry => ({
        url: entry.loc,
        lastModified: entry.lastmod ? new Date(entry.lastmod) : new Date(),
        changeFrequency: entry.changefreq as MetadataRoute.Sitemap[0]["changeFrequency"],
        priority: entry.priority,
      }))
    }
    return await getSitemapEntries(collectionSlug)
  } catch (error) {
    console.error(`❌  Error generating sitemap for collection ${collectionSlug}:`, error)
    return []
  }
}
