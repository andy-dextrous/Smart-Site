import { NextResponse } from "next/server"

export async function GET(): Promise<Response> {
  // Create a simple success response
  const response = NextResponse.json({ success: true })

  // Clear the preview cookie
  response.cookies.delete("__prerender_bypass")

  // Add cache control headers to prevent caching
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")

  return response
}
