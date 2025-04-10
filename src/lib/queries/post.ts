import { getPayload } from "payload"
import { cache } from "react"
import configPromise from "@payload-config"
import { Post } from "@/payload/payload-types"
import { draftMode } from "next/headers"

/*******************************************************/
/* Get Post By Slug
/*******************************************************/

export const getPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: "posts",
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

/*******************************************************/
/* Get All Posts
/*******************************************************/

export const getPosts = cache(async () => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: "posts",
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return result.docs || ([] as Post[])
})
