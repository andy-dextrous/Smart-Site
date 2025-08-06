import { consoleLogTool } from "./dom-manipulation/console-log"

/*************************************************************************/
/*  CLIENT TOOL REGISTRY
/*************************************************************************/

// Registry for runtime tool resolution
export const clientToolRegistry = {
	consoleLog: consoleLogTool,
	// testFrontend maps to consoleLog for backward compatibility
	testFrontend: consoleLogTool,
	// Add more tools as they're created
} as const

export type ClientToolName = keyof typeof clientToolRegistry

// Helper to execute tools by name
export async function executeClientTool(toolName: ClientToolName | string, args: any) {
	const tool = clientToolRegistry[toolName as ClientToolName]
	if (!tool) {
		console.warn(`Client tool ${toolName} not found in registry`)
		return null
	}
	return await tool.execute(args)
}

// Export all tools for direct import
export * from "./dom-manipulation/console-log"