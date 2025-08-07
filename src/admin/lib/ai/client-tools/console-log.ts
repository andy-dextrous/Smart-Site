import { z } from "zod"
import { TOOL_REGISTRY } from "@smart-site-ai/mastra/tools/registry"

/*************************************************************************/
/*  CONSOLE LOG TOOL - CLIENT EXECUTION
/*************************************************************************/

export const consoleLogToolSchema = z.object({
	message: z.string().describe("The message to log"),
	level: z.enum(["log", "info", "warn", "error"]).optional().describe("Console log level"),
})

export type ConsoleLogInput = z.infer<typeof consoleLogToolSchema>

export const consoleLogTool = {
	id: TOOL_REGISTRY.consoleLog,
	description: "Logs a message to the browser's developer console",
	inputSchema: consoleLogToolSchema,
	execute: async ({ message, level = "log" }: ConsoleLogInput) => {
		// Log to console with appropriate level
		console[level](`🤖 AI Tool Output: ${message}`)
		console[level](`Timestamp: ${new Date().toISOString()}`)
		
		return {
			logged: true,
			level,
			message,
			timestamp: new Date().toISOString(),
		}
	},
}