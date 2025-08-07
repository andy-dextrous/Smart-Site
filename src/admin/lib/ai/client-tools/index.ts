import { testFrontendTool } from "./test-frontend"
import { changeBackgroundTool } from "./change-background"
import { showAlertTool } from "./show-alert"
import { consoleLogTool } from "./console-log"
import { addElementTool } from "./add-element"
import { scrollToTopTool } from "./scroll-to-top"
import { highlightElementTool } from "./highlight-element"
import { TOOL_REGISTRY } from "@smart-site-ai/mastra/tools/registry"

/*************************************************************************/
/*  CLIENT TOOL REGISTRY
/*************************************************************************/

// Registry for runtime tool resolution
export const clientToolRegistry = {
	[TOOL_REGISTRY.testFrontend]: testFrontendTool,
	[TOOL_REGISTRY.changeBackground]: changeBackgroundTool,
	[TOOL_REGISTRY.showAlert]: showAlertTool,
	[TOOL_REGISTRY.consoleLog]: consoleLogTool,
	[TOOL_REGISTRY.addElement]: addElementTool,
	[TOOL_REGISTRY.scrollToTop]: scrollToTopTool,
	[TOOL_REGISTRY.highlightElement]: highlightElementTool,
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
export * from "./test-frontend"
export * from "./change-background"
export * from "./show-alert"
export * from "./console-log"
export * from "./add-element"
export * from "./scroll-to-top"
export * from "./highlight-element"