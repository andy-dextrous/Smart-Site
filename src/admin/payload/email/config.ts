import { resendAdapter } from "@payloadcms/email-resend"

export const email = resendAdapter({
  defaultFromAddress: process.env.RESEND_EMAIL_DOMAIN || "",
  defaultFromName: "Andrew | Wild Creative",
  apiKey: process.env.RESEND_API_KEY || "",
})
