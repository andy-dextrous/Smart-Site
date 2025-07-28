import { PayloadRequest, CollectionSlug } from "payload"

type Props = {
  collection: CollectionSlug
  slug: string
  req: PayloadRequest
  data?: any
}

/*************************************************************************/
/*  PREVIEW PATH GENERATION - SIMPLIFIED FOR URI ENGINE
/*************************************************************************/

export const generatePreviewPath = ({ collection, slug, data }: Props): string => {
  const baseURL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
  const documentURI = data?.uri || `/${collection}/${slug}`

  const encodedParams = new URLSearchParams({
    collection,
    path: String(documentURI),
    previewSecret: process.env.PREVIEW_SECRET || "",
  })

  return `${baseURL}/api/preview?${encodedParams.toString()}`
}
