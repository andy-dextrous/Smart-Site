import { resendAdapter } from "@payloadcms/email-resend"
import type { EmailAdapter } from "payload"
const previewEmail: EmailAdapter = () => ({ name: "local-preview", defaultFromAddress: "preview@smartsite.local", defaultFromName: "SmartSite preview", sendEmail: async () => ({ accepted: [], rejected: [], message: "Delivery disabled in local/preview mode" }) })
export const email = process.env.SMARTSITE_ENVIRONMENT === "local" || !process.env.RESEND_API_KEY ? previewEmail : resendAdapter({ defaultFromAddress: process.env.RESEND_EMAIL_DOMAIN || "", defaultFromName: process.env.EMAIL_FROM_NAME || "Website", apiKey: process.env.RESEND_API_KEY })
