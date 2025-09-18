import crypto from "crypto"
import type { Payload } from "payload"
import type { User } from "@/admin/payload/payload-types"

/*************************************************************************/
/*  AI AGENT IDENTITY SHARED HELPERS
/*************************************************************************/

const AI_AGENT_ROLE = "ai-agent"
const DEFAULT_SITE_DOMAIN = "smartsite.local"

export interface EnsureAIAgentOptions {
  payload: Payload
  context?: any
  env?: NodeJS.ProcessEnv
  allowCreate?: boolean
  forceRegenerate?: boolean
  siteName: string
  onKeyIssued?: (details: { user: User; apiKey: string }) => Promise<void> | void
}

export interface EnsureAIAgentResult {
  user: User
  apiKey: string | null
  created: boolean
}

export function generateSecureAPIKey(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function buildAIAgentSeed(siteName: string, env?: NodeJS.ProcessEnv): Partial<User> {
  const source = env ?? process.env
  const siteUrl = source.NEXT_PUBLIC_SITE_URL || source.NEXT_PUBLIC_URL || DEFAULT_SITE_DOMAIN
  const rawDomain = siteUrl.replace(/^https?:\/\//, "").replace(/:\d+$/, "")
  const domain = rawDomain.includes(".") ? rawDomain : `${rawDomain}.local`

  return {
    name: siteName || "Smart Site",
    lastName: "AI Agent",
    role: AI_AGENT_ROLE,
    email: `ai@${domain}`,
    password: crypto.randomBytes(32).toString("hex"),
    username: "smartsite-ai",
    socialLinks: [],
    education: [],
    loginAttempts: 0,
    enableAPIKey: true,
  } as Partial<User>
}

export async function ensureAIAgentIdentity(options: EnsureAIAgentOptions): Promise<EnsureAIAgentResult> {
  const {
    payload,
    context,
    allowCreate = true,
    onKeyIssued,
    forceRegenerate = false,
  } = options
  const env = options.env ?? process.env
  const logger = payload.logger

  const envUserId = env.AI_AGENT_USER_ID?.trim()
  const envApiKey = env.AI_AGENT_API_KEY?.trim()
  const siteName = options.siteName.trim()

  if (!siteName) {
    throw new Error("Site name is required to create the AI agent identity")
  }

  if (envUserId && !forceRegenerate) {
    try {
      const existing = await payload.findByID({
        collection: "users",
        id: envUserId,
        overrideAccess: true,
      })

      if (existing) {
        if (!envApiKey) {
          throw new Error(
            "AI_AGENT_API_KEY is missing but AI_AGENT_USER_ID is set. Restore the secret or run the explicit rotation flow."
          )
        }

        logger.info("AI agent located via environment ID; returning without modification")
        return { user: existing as User, apiKey: null, created: false }
      }

      throw new Error(
        "AI_AGENT_USER_ID references a user that does not exist. Restore the database record or rerun the rotation flow."
      )
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(String(error))
    }
  }

  const existingAgent = await payload.find({
    collection: "users",
    where: { role: { equals: AI_AGENT_ROLE } },
    limit: 1,
    overrideAccess: true,
    context,
  })

  if (existingAgent.docs.length > 0) {
    const agent = existingAgent.docs[0] as User

    if (forceRegenerate) {
      const apiKey = generateSecureAPIKey()
      const updated = (await payload.update({
        collection: "users",
        id: agent.id,
        data: {
          apiKey,
          enableAPIKey: true,
        } as any,
        overrideAccess: true,
        context,
      })) as User

      logger.info("Regenerated AI agent API key via force option")

      env.AI_AGENT_USER_ID = String(updated.id)
      env.AI_AGENT_API_KEY = apiKey

      if (onKeyIssued) {
        await onKeyIssued({ user: updated, apiKey })
      }

      return { user: updated, apiKey, created: false }
    }

    if (!envApiKey) {
      logger.info("AI agent user exists but no API key in env; generating fresh credentials")
      return await ensureAIAgentIdentity({
        ...options,
        env,
        forceRegenerate: true,
      })
    }

    logger.info("AI agent already exists; keeping existing credentials")
    env.AI_AGENT_USER_ID = String(agent.id)
    return { user: agent, apiKey: null, created: false }
  }

  if (!allowCreate) {
    throw new Error("AI agent identity is missing and creation is disabled in this context")
  }

  const apiKey = generateSecureAPIKey()
  const seedData = buildAIAgentSeed(siteName, env)

  const created = await payload.create({
    collection: "users",
    data: {
      ...seedData,
      apiKey,
    } as any,
    overrideAccess: true,
    context,
  })

  const user = created as User

  logger.info(`Created AI agent with API key: ${seedData.email}`)

  env.AI_AGENT_USER_ID = String(user.id)
  env.AI_AGENT_API_KEY = apiKey

  if (onKeyIssued) {
    await onKeyIssued({ user, apiKey })
  }

  return { user, apiKey, created: true }
}
