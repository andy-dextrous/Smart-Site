import { resendAdapter } from "@payloadcms/email-resend"

export const email = resendAdapter({
  defaultFromAddress: "dev@payloadcms.com",
  defaultFromName: "Payload CMS",
  apiKey: process.env.RESEND_API_KEY || "",
})
