"use client"

import { useState } from "react"
import { useAIContext } from "@/admin/payload/components/providers/ai-provider"

/*************************************************************************/
/*  AI TEST COMPONENT - VERIFY ORCHESTRATOR CONNECTION
/*************************************************************************/

export function AITest() {
  const { client, isEnabled, getAgent } = useAIContext()
  const [response, setResponse] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const testOrchestrator = async () => {
    if (!isEnabled || !client) {
      setResponse("AI is not enabled or client is not available")
      return
    }

    setLoading(true)
    try {
      const agent = getAgent("orchestrator")
      if (!agent) {
        setResponse("Orchestrator agent not found")
        return
      }

      const result = await agent.generate({
        messages: [
          {
            role: "user",
            content: "Hello! Please introduce yourself and confirm the connection is working.",
          },
        ],
      })

      setResponse(JSON.stringify(result, null, 2))
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isEnabled) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">AI functionality is disabled</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">AI Orchestrator Test</h3>
      
      <div className="space-y-2">
        <p><strong>Status:</strong> {isEnabled ? "Enabled" : "Disabled"}</p>
        <p><strong>Client:</strong> {client ? "Connected" : "Not connected"}</p>
      </div>

      <button
        onClick={testOrchestrator}
        disabled={loading || !client}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Orchestrator Agent"}
      </button>

      {response && (
        <div className="mt-4">
          <h4 className="font-medium">Response:</h4>
          <pre className="mt-2 overflow-auto rounded bg-gray-100 p-4 text-sm">
            {response}
          </pre>
        </div>
      )}
    </div>
  )
}