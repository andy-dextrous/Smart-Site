import { z } from "zod"

/*************************************************************************/
/*  CONSOLE LOG CLIENT TOOL - CORE LOGIC
/*************************************************************************/

export const consoleLogToolSchema = z.object({
	message: z.string().optional().describe("Optional message to include"),
})

export type ConsoleLogInput = z.infer<typeof consoleLogToolSchema>

export const consoleLogTool = {
	id: "consoleLog",
	description: "A simple test tool that runs in the browser and logs to console",
	inputSchema: consoleLogToolSchema,
	execute: async ({ message }: ConsoleLogInput) => {
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