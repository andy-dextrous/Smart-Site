import { revalidateAll } from "@/admin/cache/revalidation"
import { userHasMinimumRole } from "@/admin/payload/access/roles"
import config from "@payload-config"
import { headers } from "next/headers"
import { getPayload } from "payload"

export async function GET(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    )
  }

  if (!userHasMinimumRole(user, "admin") || user.role === "ai-agent") {
    return Response.json(
      { success: false, message: "Insufficient permissions" },
      { status: 403 }
    )
  }

  try {
    const result = await revalidateAll()

    return Response.json(
      {
        success: result.success,
        message: result.message,
        user: user.email,
      },
      {
        status: result.success ? 200 : 500,
      }
    )
  } catch (error) {
    payload.logger.error("Failed to run global revalidation:", error)

    return Response.json(
      {
        success: false,
        message: "Global revalidation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
