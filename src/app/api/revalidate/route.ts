import { revalidatePath, revalidateTag } from "next/cache"

export async function GET() {
  revalidatePath("/")
  revalidateTag("pages-sitemap")
  revalidateTag("posts-sitemap")

  return new Response("Revalidated")
}
