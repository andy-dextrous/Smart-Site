import { cookies } from "next/headers"
import { draftMode } from "next/headers"

export async function GET(): Promise<Response> {
  // Disable draft mode
  const draft = await draftMode()
  draft.disable()

  // Create the response
  const response = new Response("Draft mode is disabled", {
    status: 200,
    headers: {
      // Set cache control headers to prevent caching of this response
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })

  return response
}
