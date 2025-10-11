import { NextResponse } from "next/server"

export const revalidate = 0

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_URL ||
    (process.env.VERCEL_URL ? ensureProtocol(process.env.VERCEL_URL) : null)

  if (!baseUrl) {
    return NextResponse.json({ ok: false, reason: "missing-base-url" })
  }

  try {
    const target = new URL("/admin", baseUrl)
    await fetch(target.toString(), { cache: "no-store" })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, reason: "fetch-failed" })
  }
}

function ensureProtocol(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  return `https://${url}`
}
