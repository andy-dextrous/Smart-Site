import type { MetadataRoute } from "next"
import { getServerSideURL } from "@/admin/utilities/get-url"
import { allowSearchIndexing } from "@/admin/utilities/runtime-environment"

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
