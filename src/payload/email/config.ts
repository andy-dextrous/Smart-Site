import { resendAdapter } from "@payloadcms/email-resend"

export const email = resendAdapter({
  defaultFromAddress: "mail.wildcreative.com.au",
  defaultFromName: "Andrew | Wild Creative",
  apiKey: process.env.RESEND_API_KEY || "",
})
