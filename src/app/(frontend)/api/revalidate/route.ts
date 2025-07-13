import { revalidateAll } from "@/lib/cache/revalidation"

export async function GET() {
  const result = await revalidateAll()

  return new Response(
    JSON.stringify({
      success: result.success,
      message: result.message,
    }),
    {
      status: result.success ? 200 : 500,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}
