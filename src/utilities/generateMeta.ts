import type { Metadata } from "next"

import type { Media, Page, Post, Config } from "@/payload/payload-types"

import { mergeOpenGraph } from "./mergeOpenGraph"
import { getServerSideURL } from "./getURL"
import { getSettings } from "@/lib/queries/globals"

const getImageURL = (image?: Media | Config["db"]["defaultIDType"] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + "/website-template-OG.webp"

  if (image && typeof image === "object" && "url" in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  const settings = await getSettings()

  const ogImage = getImageURL(doc?.meta?.image)

  const title = doc?.meta?.title
    ? doc?.meta?.title + " | " + settings?.general?.siteName
    : settings?.general?.siteName || "Wild Child"

  return {
    description: doc?.meta?.description || settings?.general?.siteDescription,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || "",
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join("/") : "/",
    }),
    title,
  }
}
