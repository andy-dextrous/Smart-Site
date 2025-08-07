import { z } from "zod"
import { TOOL_REGISTRY } from "@smart-site-ai/mastra/tools/registry"

/*************************************************************************/
/*  SHOW ALERT TOOL - CLIENT EXECUTION
/*************************************************************************/

export const showAlertToolSchema = z.object({
	message: z.string().describe("The message to display in the alert"),
})

export type ShowAlertInput = z.infer<typeof showAlertToolSchema>

export const showAlertTool = {
	id: TOOL_REGISTRY.showAlert,
	description: "Shows a browser alert dialog with a custom message",
	inputSchema: showAlertToolSchema,
	execute: async ({ message }: ShowAlertInput) => {
		// Show browser alert
		window.alert(message)
		
		return {
			shown: true,
			timestamp: new Date().toISOString(),
			message: message,
		}
	},
}