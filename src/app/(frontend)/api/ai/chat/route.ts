import { getMastraClient, isAIEnabled } from "@/admin/lib/mastra-client"
import { NextRequest } from "next/server"

export const runtime = "edge"
export const maxDuration = 30

/*************************************************************************/
/*  AI CHAT STREAMING ENDPOINT - COMPATIBLE WITH ASSISTANT-UI
/*************************************************************************/

export async function POST(req: NextRequest) {
  // Check if AI is enabled
  if (!isAIEnabled()) {
    return new Response("AI functionality is disabled", { status: 503 })
  }

  // Get Mastra client
  const client = getMastraClient()
  if (!client) {
    return new Response("AI client not available", { status: 503 })
  }

  try {
    const { messages, agentId = "orchestrator" } = await req.json()

    // Get agent from remote server
    const agent = client.getAgent(agentId)

    // Stream response (this returns a Response object with streaming body)
    const result = await agent.stream({
      messages,
    })

    // Return the streaming response directly
    return result
  } catch (error) {
    console.error("AI chat error:", error)
    return new Response("AI service temporarily unavailable", { status: 500 })
  }
}
