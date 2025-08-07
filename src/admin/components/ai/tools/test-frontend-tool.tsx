"use client"

import { makeAssistantTool, tool } from "@assistant-ui/react"
import { testFrontendTool } from "@/admin/lib/ai/client-tools/test-frontend"
import { TOOL_REGISTRY } from "@smart-site-ai/mastra/tools/registry"

/*************************************************************************/
/*  ASSISTANT UI WRAPPER FOR TEST FRONTEND TOOL
/*************************************************************************/

// Create Assistant UI tool from the core logic
const assistantTestFrontendTool = tool({
  description: testFrontendTool.description,
  parameters: testFrontendTool.inputSchema,
  execute: testFrontendTool.execute,
})

// Create the Assistant UI tool component
export const TestFrontendTool = makeAssistantTool({
  ...assistantTestFrontendTool,
  toolName: TOOL_REGISTRY.testFrontend, // Type-safe name from registry!
})