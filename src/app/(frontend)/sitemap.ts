import type { MetadataRoute } from "next"
import { getSmartSiteConfig } from "@/admin/config"
import { getFrontendCollectionKeys, shouldIncludeCollectionInSitemap } from "@/admin/sitemaps/config"
import { generateSitemap } from "@/admin/sitemaps/generator"
import { getServerSideURL } from "@/admin/utilities/get-url"

/*************************************************************************/
/*  GENERATE SITEMAPS - ONE PER FRONTEND COLLECTION
/*************************************************************************/

export async function generateSitemaps() {
  try {
    const config = getSmartSiteConfig()
    if (!config.features.sitemaps) {
      return []
    }
    const activeSitemapKeys = getFrontendCollectionKeys()

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
  id: string
}): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getServerSideURL()

  try {
    const config = getSmartSiteConfig()
    if (!config.features.sitemaps) {
      return []
    }

    const getSitemapEntries = async (collectionName: string) => {
      if (!shouldIncludeCollectionInSitemap(collectionName)) {
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
    // ,
    // [`sitemap-${id}`, "sitemap-generation"],
    // {
    //   tags: [`sitemap:${id}`, "sitemap:all"],
    //   revalidate: 3600, // 1 hour
    //
    // }

    return await getSitemapEntries(id)
  } catch (error) {
    console.error(`❌  Error generating sitemap for collection ${id}:`, error)
    return []
  }
}
