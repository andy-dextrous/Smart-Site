"use client"

import { makeAssistantTool, tool } from "@assistant-ui/react"
import { consoleLogTool } from "@/admin/lib/ai/client-tools/dom-manipulation/console-log"

/*************************************************************************/
/*  ASSISTANT UI WRAPPER FOR CONSOLE LOG TOOL
/*************************************************************************/

// Create Assistant UI tool from the core logic
const testFrontendTool = tool({
  description: consoleLogTool.description,
  parameters: consoleLogTool.inputSchema,
  execute: consoleLogTool.execute,
})

// Create the Assistant UI tool component
export const TestFrontendTool = makeAssistantTool({
  ...testFrontendTool,
  toolName: "testFrontend", // Must match the server-side tool name
})