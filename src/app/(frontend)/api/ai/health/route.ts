import { getMastraClient, isAIEnabled } from "@/admin/ai/mastra-client"

export const runtime = "edge"

/*************************************************************************/
/*  AI HEALTH CHECK ENDPOINT
/*************************************************************************/

export async function GET() {
  // Check if AI is enabled in config
  if (!isAIEnabled()) {
    return Response.json({
      status: "disabled",
      message: "AI functionality is disabled in configuration",
    })
  }

  // Get Mastra client
  const client = getMastraClient()
  if (!client) {
    return Response.json(
      {
        status: "not_configured",
        message: "AI client not available",
      },
      { status: 503 }
    )
  }

  try {
    // Try to get agents list as a simple connectivity test
    const agents = await client.getAgents()

    return Response.json({
      status: "connected",
      message: "AI service is accessible",
      agentCount: Object.keys(agents).length,
      availableAgents: Object.keys(agents),
    })
  } catch (error) {
    console.error("AI health check failed:", error)
    return Response.json(
      {
        status: "disconnected",
        message: "Unable to connect to AI service",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    )
  }
}
