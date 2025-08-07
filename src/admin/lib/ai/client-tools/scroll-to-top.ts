import { z } from "zod"
import { TOOL_REGISTRY } from "@smart-site-ai/mastra/tools/registry"

/*************************************************************************/
/*  SCROLL TO TOP TOOL - CLIENT EXECUTION
/*************************************************************************/

export const scrollToTopToolSchema = z.object({})

export type ScrollToTopInput = z.infer<typeof scrollToTopToolSchema>

export const scrollToTopTool = {
	id: TOOL_REGISTRY.scrollToTop,
	description: "Scrolls the webpage to the top",
	inputSchema: scrollToTopToolSchema,
	execute: async () => {
		// Scroll to top with smooth animation
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		})
		
		return {
			scrolled: true,
			previousPosition: window.scrollY,
			timestamp: new Date().toISOString(),
		}
	},
}