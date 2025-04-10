import configPromise from "@payload-config"
import { getPayload } from "payload"
import { cache } from "react"

export const queryPageBySlug = cache(
  async ({ slug, draft }: { slug: string; draft: boolean }) => {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: "pages",
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return result.docs?.[0] || null
  }
)

export const queryAllPages = cache(async () => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: "pages",
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return result.docs || []
})
