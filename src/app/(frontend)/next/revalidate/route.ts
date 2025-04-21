import { revalidatePath, revalidateTag } from "next/cache"

export async function GET() {
  // Revalidate all paths
  revalidatePath("/")

  // Revalidate all tags
  revalidateTag("pages-sitemap")
  revalidateTag("posts-sitemap")
  revalidateTag("redirects")
  revalidateTag("global_header")
  revalidateTag("global_footer")
  revalidateTag("global_settings")

  return new Response("All caches revalidated", { status: 200 })
}
