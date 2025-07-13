import { NextResponse } from "next/server"
import { getAIStatus } from "@/lib/ai/utils"

export async function GET() {
  try {
    const status = await getAIStatus()

    return NextResponse.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get AI status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
