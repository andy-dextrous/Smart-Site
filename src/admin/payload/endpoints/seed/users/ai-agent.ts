import type { User } from "@/admin/payload/payload-types"
import type { Payload } from "payload"
import crypto from "crypto"

/*************************************************************************/
/*  AI AGENT USER SEEDING
/*************************************************************************/

export function seedAIAgent(): any {
  // Generate a strong random password that will never be used
  const randomPassword = crypto.randomBytes(32).toString("hex")
  
  // Use a predictable email based on the site URL or a default
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "smartsite.local"
  const domain = siteUrl.replace(/^https?:\/\//, "").replace(/:\d+$/, "")
  
  return {
    name: "Smart Site",
    lastName: "AI Agent",
    role: "ai-agent", // AI agent role
    email: `ai@${domain}`,
    password: randomPassword, // Random password, never used for login
    username: "smartsite-ai",
    socialLinks: [],
    education: [],
    loginAttempts: 0,
    enableAPIKey: true, // Ensure API key is enabled for this user
  }
}

/**
 * Generate a secure API key for the AI agent user
 * This mimics what Payload does internally when generating API keys
 */
export function generateSecureAPIKey(): string {
  // Generate a secure random API key (32 bytes = 256 bits of entropy)
  // This will be a 64-character hex string
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Create or retrieve the AI agent user with API key
 * This ensures we always have an AI agent with a valid API key
 */
export async function ensureAIAgentWithAPIKey(
  payload: Payload,
  context: any
): Promise<{ user: any; apiKey: string | null }> {
  const aiAgentData = seedAIAgent()
  
  // Check if AI agent already exists
  const existingAgent = await payload.find({
    collection: "users",
    where: { role: { equals: "ai-agent" } },
    limit: 1,
    overrideAccess: true, // Bypass access control to find hidden AI agent
  })

  if (existingAgent.docs.length > 0) {
    const agent = existingAgent.docs[0]
    
    // Check if agent already has an API key
    if ((agent as any).apiKey) {
      payload.logger.info(`AI agent already has API key configured`)
      return { user: agent, apiKey: null } // Don't expose existing key
    }
    
    // Generate new API key for existing agent
    const newApiKey = generateSecureAPIKey()
    
    // Update the user with the new API key
    // Note: Payload will encrypt this automatically
    const updatedAgent = await payload.update({
      collection: "users",
      id: agent.id,
      data: {
        apiKey: newApiKey,
        enableAPIKey: true,
      } as any, // Type assertion until types are regenerated
      overrideAccess: true,
    })
    
    payload.logger.info(`Generated new API key for existing AI agent`)
    return { user: updatedAgent, apiKey: newApiKey }
  }
  
  // Create new AI agent with API key
  const newApiKey = generateSecureAPIKey()
  
  const aiAgent = await payload.create({
    collection: "users",
    data: {
      ...aiAgentData,
      apiKey: newApiKey, // Payload will encrypt this
    } as any, // Type assertion until types are regenerated
    overrideAccess: true,
  })
  
  payload.logger.info(`Created AI agent with API key: ${aiAgentData.email}`)
  return { user: aiAgent, apiKey: newApiKey }
}
