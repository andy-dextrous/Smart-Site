import { z } from "zod"
import { TOOL_REGISTRY } from "@smart-site-ai/mastra/tools/registry"

/*************************************************************************/
/*  HIGHLIGHT ELEMENT TOOL - CLIENT EXECUTION
/*************************************************************************/

export const highlightElementToolSchema = z.object({
	selector: z.string().describe("CSS selector for the element to highlight"),
	color: z.string().optional().describe("Highlight color (default: yellow)"),
})

export type HighlightElementInput = z.infer<typeof highlightElementToolSchema>

export const highlightElementTool = {
	id: TOOL_REGISTRY.highlightElement,
	description: "Highlights an element on the page by adding a border and background",
	inputSchema: highlightElementToolSchema,
	execute: async ({ selector, color = "yellow" }: HighlightElementInput) => {
		try {
			// Find all matching elements
			const elements = document.querySelectorAll(selector)
			
			if (elements.length === 0) {
				return {
					highlighted: false,
					elementFound: false,
					message: `No elements found matching selector: ${selector}`,
				}
			}
			
			// Apply highlight to all matching elements
			elements.forEach((element: Element) => {
				const htmlElement = element as HTMLElement
				
				// Store original styles
				htmlElement.dataset.originalBorder = htmlElement.style.border
				htmlElement.dataset.originalBackground = htmlElement.style.backgroundColor
				htmlElement.dataset.originalTransition = htmlElement.style.transition
				
				// Apply highlight
				htmlElement.style.transition = "all 0.3s ease"
				htmlElement.style.border = `3px solid ${color}`
				htmlElement.style.backgroundColor = color === "yellow" 
					? "rgba(255, 255, 0, 0.2)" 
					: `${color}33` // Add transparency
				
				// Remove highlight after 3 seconds
				setTimeout(() => {
					htmlElement.style.border = htmlElement.dataset.originalBorder || ""
					htmlElement.style.backgroundColor = htmlElement.dataset.originalBackground || ""
					htmlElement.style.transition = htmlElement.dataset.originalTransition || ""
					
					delete htmlElement.dataset.originalBorder
					delete htmlElement.dataset.originalBackground
					delete htmlElement.dataset.originalTransition
				}, 3000)
			})
			
			return {
				highlighted: true,
				elementFound: true,
				elementsHighlighted: elements.length,
				message: `Highlighted ${elements.length} element(s) for 3 seconds`,
			}
		} catch (error) {
			return {
				highlighted: false,
				elementFound: false,
				message: `Invalid selector: ${selector}`,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
}