import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getPayload } from "payload"
import config from "@payload-config"
import { getAIBackendStatus } from "@/admin/lib/ai/status"

export const dynamic = "force-dynamic"

export async function GET() {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const auth = await payload.auth({ headers: requestHeaders })

  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const status = await getAIBackendStatus(true)
  return NextResponse.json(status)
}
