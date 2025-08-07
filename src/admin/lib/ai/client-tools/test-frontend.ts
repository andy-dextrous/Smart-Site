import { z } from "zod"
import { TOOL_REGISTRY } from "@smart-site-ai/mastra/tools/registry"

/*************************************************************************/
/*  TEST FRONTEND TOOL - CLIENT EXECUTION
/*************************************************************************/

export const testFrontendToolSchema = z.object({
	message: z.string().optional().describe("Optional message to include"),
})

export type TestFrontendInput = z.infer<typeof testFrontendToolSchema>

// Named to match TOOL_REGISTRY.testFrontend for type safety
export const testFrontendTool = {
	id: TOOL_REGISTRY.testFrontend,
	description: "A simple test tool that runs in the browser and logs to console",
	inputSchema: testFrontendToolSchema,
	execute: async ({ message }: TestFrontendInput) => {
		console.log("🎯 FRONTEND TOOL EXECUTED IN BROWSER!")
		console.log("Message received:", message || "No message provided")
		console.log("Window location:", window.location.href)
		console.log("User agent:", navigator.userAgent)
		console.log("Timestamp:", new Date().toISOString())

		// Access DOM, localStorage, etc.
		const pageTitle = document.title
		const currentUrl = window.location.href

		// Return result that matches what the server expects
		return {
			message: `Frontend tool executed! Message: ${message || "none"}`,
			timestamp: new Date().toISOString(),
			executionLocation: `Browser (${pageTitle} at ${currentUrl})`,
		}
	},
}