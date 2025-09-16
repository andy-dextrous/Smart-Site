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
): Promise<{ user: User; apiKey: string | null }> {
  const aiAgentData = seedAIAgent()

  const envUserId = process.env.AI_AGENT_USER_ID
  const envApiKey = process.env.AI_AGENT_API_KEY

  let existingAgent: User | null = null

  if (envUserId) {
    try {
      const byId = await payload.findByID({
        collection: "users",
        id: envUserId,
        overrideAccess: true,
      })
      if (byId) {
        existingAgent = byId as User
        payload.logger.info("AI agent exists by environment ID; preserving without changes")
      }
    } catch {}
  }

  if (!existingAgent) {
    const search = await payload.find({
      collection: "users",
      where: { role: { equals: "ai-agent" } },
      limit: 1,
      overrideAccess: true,
    })
    if (search.docs.length > 0) {
      existingAgent = search.docs[0] as User
      payload.logger.info("AI agent already exists; preserving without changes")
    }
  }

  if (!existingAgent) {
    const newApiKey = generateSecureAPIKey()
    const created = await payload.create({
      collection: "users",
      data: {
        ...aiAgentData,
        apiKey: newApiKey,
      } as any,
      overrideAccess: true,
    })
    const user = created as User
    process.env.AI_AGENT_API_KEY = newApiKey
    process.env.AI_AGENT_USER_ID = String(user.id)
    payload.logger.info(`Created AI agent with API key: ${aiAgentData.email}`)
    return { user, apiKey: newApiKey }
  }

  const rotateCredentials =
    !envApiKey ||
    !envUserId ||
    String(envUserId) !== String(existingAgent.id) ||
    existingAgent.enableAPIKey === false

  if (rotateCredentials) {
    const newApiKey = generateSecureAPIKey()
    const updated = await payload.update({
      collection: "users",
      id: existingAgent.id,
      data: {
        enableAPIKey: true,
        apiKey: newApiKey,
      } as any,
      overrideAccess: true,
    })
    const user = updated as User
    process.env.AI_AGENT_API_KEY = newApiKey
    process.env.AI_AGENT_USER_ID = String(user.id)
    payload.logger.info("AI agent credentials rotated to match environment configuration")
    return { user, apiKey: newApiKey }
  }

  process.env.AI_AGENT_USER_ID = String(existingAgent.id)
  return { user: existingAgent, apiKey: null }
}
