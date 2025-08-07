import { z } from "zod"
import { TOOL_REGISTRY } from "@smart-site-ai/mastra/tools/registry"

/*************************************************************************/
/*  ADD ELEMENT TOOL - CLIENT EXECUTION
/*************************************************************************/

export const addElementToolSchema = z.object({
	tag: z.string().describe("HTML tag name like 'div', 'p', 'span'"),
	text: z.string().describe("Text content for the element"),
	className: z.string().optional().describe("CSS class names to apply"),
})

export type AddElementInput = z.infer<typeof addElementToolSchema>

export const addElementTool = {
	id: TOOL_REGISTRY.addElement,
	description: "Adds a new HTML element to the webpage",
	inputSchema: addElementToolSchema,
	execute: async ({ tag, text, className }: AddElementInput) => {
		// Create new element
		const element = document.createElement(tag)
		element.textContent = text
		element.id = `ai-element-${Date.now()}`
		
		if (className) {
			element.className = className
		}
		
		// Add some default styling for visibility
		element.style.padding = "1rem"
		element.style.margin = "1rem"
		element.style.backgroundColor = "rgba(59, 130, 246, 0.1)"
		element.style.border = "2px solid rgb(59, 130, 246)"
		element.style.borderRadius = "0.5rem"
		
		// Append to main content or body
		const mainElement = document.querySelector('main') || document.body
		mainElement.appendChild(element)
		
		return {
			elementId: element.id,
			added: true,
			tag,
			text,
			parentElement: mainElement.tagName,
		}
	},
}