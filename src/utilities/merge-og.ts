import type { Metadata } from "next"
import { getServerSideURL } from "@/utilities/get-url"

const defaultOpenGraph: Metadata["openGraph"] = {
  type: "website",
  description: "An open-source website built with Payload and Next.js.",
  images: [
    {
      url: `${getServerSideURL()}/assets/logos/logo.svg`,
    },
  ],
  siteName: "Payload Website Template",
  title: "Payload Website Template",
}

export const mergeOpenGraph = (og?: Metadata["openGraph"]): Metadata["openGraph"] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
