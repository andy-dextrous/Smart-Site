import type { MetadataRoute } from "next"
import { getServerSideURL } from "@/lib/get-url"
import { allowSearchIndexing } from "@/lib/runtime-environment"

/*************************************************************************/
/*  ROBOTS.TXT GENERATION - SIMPLIFIED FOR SITEMAP INDEX
/*************************************************************************/

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = getServerSideURL()
  const allowCrawling = allowSearchIndexing()

  if (allowCrawling) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        crawlDelay: 1,
      },
      sitemap: `${siteUrl}/sitemap.xml`,
      host: siteUrl,
    }
  } else {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    }
  }
}
