import type { Payload } from "payload"
import type { User } from "@/admin/payload/payload-types"
import {
  buildAIAgentSeed,
  ensureAIAgentIdentity,
  generateSecureAPIKey,
} from "@/admin/payload/seed-shared/identity"
import { registerIdentityWithSmartSiteAI } from "@/admin/payload/seed-shared/registration"

/*************************************************************************/
/*  AI AGENT USER SEEDING (SMART SITE STARTER)
/*************************************************************************/

export { generateSecureAPIKey }

export function seedAIAgent(siteName = "Smart Site"): any {
  return buildAIAgentSeed(siteName)
}

interface EnsureAgentOptions {
  force?: boolean
  env?: NodeJS.ProcessEnv
}

export async function ensureAIAgentWithAPIKey(
  payload: Payload,
  context: any,
  siteName: string,
  options?: EnsureAgentOptions
): Promise<{ user: User; apiKey: string | null }> {
  const env = options?.env ?? process.env

  const result = await ensureAIAgentIdentity({
    payload,
    context,
    siteName,
    env,
    forceRegenerate: options?.force ?? false,
  })

  const effectiveApiKey = result.apiKey ?? env.AI_AGENT_API_KEY?.trim()

  if (!effectiveApiKey) {
    throw new Error(
      "AI agent API key is not available after identity provisioning. Check seeding logs and environment configuration."
    )
  }

  await registerIdentityWithSmartSiteAI({
    payload,
    user: result.user as User,
    apiKey: effectiveApiKey,
    siteName,
    env,
  })

  return { user: result.user, apiKey: result.apiKey }
}
