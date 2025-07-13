import type { MetadataRoute } from "next"
import { getServerSideURL } from "@/utilities/get-url"

/*************************************************************************/
/*  ROBOTS.TXT GENERATION - SIMPLIFIED FOR SITEMAP INDEX
/*************************************************************************/

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = getServerSideURL()
  const isProduction = process.env.NODE_ENV === "production"
  const isVercelProduction = process.env.VERCEL_ENV === "production"

  const allowCrawling = isProduction && isVercelProduction

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
