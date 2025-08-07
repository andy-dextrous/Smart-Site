import { z } from "zod"
import { TOOL_REGISTRY } from "@smart-site-ai/mastra/tools/registry"

/*************************************************************************/
/*  CHANGE BACKGROUND TOOL - CLIENT EXECUTION
/*************************************************************************/

export const changeBackgroundToolSchema = z.object({
	color: z.string().describe("CSS color value like 'red', '#FF0000', or 'rgb(255,0,0)'"),
})

export type ChangeBackgroundInput = z.infer<typeof changeBackgroundToolSchema>

export const changeBackgroundTool = {
	id: TOOL_REGISTRY.changeBackground,
	description: "Changes the background color of the webpage to a specified color",
	inputSchema: changeBackgroundToolSchema,
	execute: async ({ color }: ChangeBackgroundInput) => {
		// Change background of main content area
		const mainElement = document.querySelector('main')
		const bodyElement = document.body
		
		if (mainElement) {
			mainElement.style.backgroundColor = color
		}
		bodyElement.style.backgroundColor = color
		
		return {
			success: true,
			message: `Background changed to ${color}`,
			elementsAffected: mainElement ? 2 : 1,
		}
	},
}