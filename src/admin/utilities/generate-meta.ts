import type { Metadata } from "next"
import type { Media, Config } from "@/admin/payload/payload-types"
import { getFrontendCollections } from "@/admin/config/frontend"
import { mergeOpenGraph } from "./merge-og"
import { getServerSideURL } from "./get-url"
import { getSettings } from "@/admin/data/globals"
import { isExternalUrl } from "./url-helpers"

/*************************************************************************/
/*  TYPE DECLARATIONS
/*************************************************************************/

type UniversalDocument = Partial<Config["collections"][keyof Config["collections"]]>

/*************************************************************************/
/*  UTILITY FUNCTIONS
/*************************************************************************/

/**
 * Get the meta image URL from either featured image or seo image
 */

function getImageURL(image?: Media | Config["db"]["defaultIDType"] | null): string {
  const serverUrl = getServerSideURL()

  let url = serverUrl + "/website-template-OG.webp"

  if (image && typeof image === "object" && "url" in image) {
    const ogUrl = image.sizes?.og?.url
    const imageUrl = ogUrl || image.url

    if (imageUrl && isExternalUrl(imageUrl)) {
      url = imageUrl
    } else if (imageUrl) {
      url = serverUrl + imageUrl
    }
  }

  return url
}

/**
 * Get the collection config
 */

function getCollectionConfig(collection?: string) {
  if (!collection) return null
  const frontendCollections = getFrontendCollections()
  return frontendCollections.find(c => c.slug === collection)
}

/**
 * Build the title
 */
function buildTitle(
  doc: UniversalDocument | null,
  settings: any,
  collectionConfig: any
): string {
  const hasSEO = collectionConfig?.hasSEO !== false
  const siteName = settings?.general?.siteName || "Wild Creative - Smart Site"
  const docAny = doc as any

  if (hasSEO && docAny?.seo?.meta?.title) {
    return `${docAny.seo.meta.title} | ${siteName}`
  }

  const docTitle = docAny?.title || docAny?.name || docAny?.quote || docAny?.headline
  if (docTitle) {
    return `${docTitle} | ${siteName}`
  }

  return siteName
}

/**
 * Build social media title (prioritize social overrides)
 */
function buildSocialTitle(
  doc: UniversalDocument | null,
  settings: any,
  collectionConfig: any,
  platform: "openGraph" | "twitter"
): string {
  const docAny = doc as any
  const socialData = docAny?.seo?.socialMedia?.[platform]

  if (socialData?.title) {
    return socialData.title
  }

  return buildTitle(doc, settings, collectionConfig)
}

/**
 * Build the description
 */
function buildDescription(
  doc: UniversalDocument | null,
  settings: any,
  collectionConfig: any
): string {
  const hasSEO = collectionConfig?.hasSEO !== false
  const docAny = doc as any

  if (hasSEO && docAny?.seo?.meta?.description) {
    return docAny.seo.meta.description
  }

  const docDescription =
    docAny?.description || docAny?.bio || docAny?.excerpt || docAny?.quote
  if (docDescription) {
    return docDescription
  }

  return settings?.general?.siteDescription || ""
}

/**
 * Build social media description (prioritize social overrides)
 */
function buildSocialDescription(
  doc: UniversalDocument | null,
  settings: any,
  collectionConfig: any,
  platform: "openGraph" | "twitter"
): string {
  const docAny = doc as any
  const socialData = docAny?.seo?.socialMedia?.[platform]

  if (socialData?.description) {
    return socialData.description
  }

  return buildDescription(doc, settings, collectionConfig)
}

/**
 * Build the image
 */
function buildImage(
  doc: UniversalDocument | null,
  collectionConfig: any,
  settings?: any
): string {
  const hasSEO = collectionConfig?.hasSEO !== false
  const docAny = doc as any

  if (hasSEO && docAny?.seo?.meta?.image) {
    return getImageURL(docAny.seo.meta.image)
  }

  const docImage = docAny?.featuredImage || docAny?.image || docAny?.companyLogo
  if (docImage) {
    return getImageURL(docImage)
  }

  // Fallback to global default meta image
  const globalSettings = settings as any
  if (globalSettings?.seo?.defaultMetaImage) {
    return getImageURL(globalSettings.seo.defaultMetaImage)
  }

  return getImageURL(null)
}

/**
 * Build social media image (prioritize social overrides)
 */
function buildSocialImage(
  doc: UniversalDocument | null,
  settings: any,
  collectionConfig: any,
  platform: "openGraph" | "twitter"
): string {
  const docAny = doc as any
  const socialData = docAny?.seo?.socialMedia?.[platform]
  const globalSettings = settings as any

  // Check for platform-specific override
  if (socialData?.image) {
    return getImageURL(socialData.image)
  }

  // Check for global platform defaults
  if (platform === "openGraph" && globalSettings?.seo?.social?.defaultOGImage) {
    return getImageURL(globalSettings.seo.social.defaultOGImage)
  }

  if (platform === "twitter" && globalSettings?.seo?.social?.defaultTwitterImage) {
    return getImageURL(globalSettings.seo.social.defaultTwitterImage)
  }

  // Fallback to standard image logic
  return buildImage(doc, collectionConfig, settings)
}

/*************************************************************************/
/*  UNIVERSAL META GENERATION
  - Works alongside the SEO field in frontend.ts
/*************************************************************************/

export async function generateMeta(args: {
  doc: UniversalDocument | null
  collection?: string
}): Promise<Metadata> {
  const { doc, collection } = args
  const settings = await getSettings()
  const collectionConfig = getCollectionConfig(collection)
  const docAny = doc as any
  const globalSettings = settings as any

  // Build base metadata
  const title = buildTitle(doc, settings, collectionConfig)
  const description = buildDescription(doc, settings, collectionConfig)
  const ogImage = buildImage(doc, collectionConfig, settings)

  // Build social media metadata with overrides
  const ogTitle = buildSocialTitle(doc, settings, collectionConfig, "openGraph")
  const ogDescription = buildSocialDescription(
    doc,
    settings,
    collectionConfig,
    "openGraph"
  )
  const ogImageUrl = buildSocialImage(doc, settings, collectionConfig, "openGraph")

  const twitterTitle = buildSocialTitle(doc, settings, collectionConfig, "twitter")
  const twitterDescription = buildSocialDescription(
    doc,
    settings,
    collectionConfig,
    "twitter"
  )
  const twitterImageUrl = buildSocialImage(doc, settings, collectionConfig, "twitter")

  // Handle robots directives
  const isNoIndex =
    docAny?.seo?.meta?.noIndex || globalSettings?.seo?.robots?.globalNoIndex || false
  const metaRobots = docAny?.seo?.meta?.metaRobots || []
  let robotsDirective = isNoIndex ? "noindex,nofollow" : "index,follow"

  if (metaRobots && metaRobots.length > 0) {
    const additionalDirectives = metaRobots.join(",")
    robotsDirective = isNoIndex
      ? `noindex,nofollow,${additionalDirectives}`
      : `index,follow,${additionalDirectives}`
  }

  // Handle canonical URL
  const canonicalUrl = docAny?.seo?.meta?.canonicalUrl
  const alternates =
    canonicalUrl && !isExternalUrl(canonicalUrl) ? { canonical: canonicalUrl } : undefined

  // Build enhanced metadata object
  const metadata: Metadata = {
    title,
    description,
    keywords: docAny?.seo?.meta?.focusKeywords || undefined,
    robots: robotsDirective,
    alternates,
    openGraph: mergeOpenGraph({
      title: ogTitle,
      description: ogDescription,
      images: [{ url: ogImageUrl }],
      url: docAny?.uri || "/",
      siteName: globalSettings?.general?.siteName,
      type: docAny?.seo?.socialMedia?.openGraph?.type || "website",
    }),
    twitter: {
      card: docAny?.seo?.socialMedia?.twitter?.cardType || "summary_large_image",
      site: globalSettings?.seo?.social?.twitterSite || undefined,
      title: twitterTitle,
      description: twitterDescription,
      images: [twitterImageUrl],
    },
  }

  // Add verification tags from global settings
  const verificationTags: Record<string, string> = {}

  if (globalSettings?.seo?.verification?.googleSiteVerification) {
    verificationTags["google-site-verification"] =
      globalSettings.seo.verification.googleSiteVerification
  }

  if (globalSettings?.seo?.verification?.bingSiteVerification) {
    verificationTags["msvalidate.01"] =
      globalSettings.seo.verification.bingSiteVerification
  }

  if (globalSettings?.seo?.verification?.yandexSiteVerification) {
    verificationTags["yandex-verification"] =
      globalSettings.seo.verification.yandexSiteVerification
  }

  if (globalSettings?.seo?.verification?.pinterestSiteVerification) {
    verificationTags["p:domain_verify"] =
      globalSettings.seo.verification.pinterestSiteVerification
  }

  // Add verification tags to metadata
  if (Object.keys(verificationTags).length > 0) {
    metadata.verification = verificationTags
  }

  return metadata
}
