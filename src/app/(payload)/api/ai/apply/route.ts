import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getPayload } from "payload"
import config from "@payload-config"
import { submitAIWorkspaceApplication, AIApplyError } from "@/admin/lib/ai/apply"
import { userHasMinimumRole } from "@/admin/payload/access/roles"

export const dynamic = "force-dynamic"

export async function POST() {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const auth = await payload.auth({ headers: requestHeaders })

  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!userHasMinimumRole(auth.user, "developer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const status = await submitAIWorkspaceApplication(
      {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name ?? auth.user.email ?? "Unknown",
      },
      { payload }
    )
    return NextResponse.json(status)
  } catch (error) {
    if (error instanceof AIApplyError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json(
      {
        error: "Unable to reach Smart Site AI endpoint",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    )
  }
}
