import type { Payload } from "payload"
import type { User } from "@/admin/payload/payload-types"
import { getSmartSiteConfig } from "@/admin/config"

/*************************************************************************/
/*  SMART SITE → SMART SITE AI REGISTRATION HELPER
/*************************************************************************/

export interface IdentityRegistrationParams {
	payload: Payload
	user: User
	apiKey: string
	env?: NodeJS.ProcessEnv
}

function resolveSecret(env: NodeJS.ProcessEnv): string | null {
	return env.SMARTSITE_AI_REGISTRATION_SECRET ?? null
}

function resolveSiteUrl(env: NodeJS.ProcessEnv): string | null {
	return env.NEXT_PUBLIC_URL ?? env.NEXT_PUBLIC_SITE_URL ?? null
}

function buildRegistrationUrl(): string | null {
	const config = getSmartSiteConfig()
	if (!config.features.ai.enabled) {
		return null
	}

	const endpoint = config.features.ai.endpoint?.trim()
	if (!endpoint) {
		return null
	}

	const path = config.features.ai.registrationPath?.trim() || "/api/internal/identities"
	if (/^https?:\/\//i.test(path)) {
		return path
	}

	try {
		return new URL(path.startsWith("/") ? path : `/${path}`, endpoint).toString()
	} catch {
		return null
	}
}

export async function registerIdentityWithSmartSiteAI(params: IdentityRegistrationParams): Promise<void> {
	const env = params.env ?? process.env
	const endpoint = buildRegistrationUrl()
	const secret = resolveSecret(env)

	if (!endpoint || !secret) {
		params.payload.logger.info("Skipping Smart Site AI registration (endpoint or secret not configured)")
		return
	}

	const siteUrl = resolveSiteUrl(env)
	if (!siteUrl) {
		throw new Error("Cannot register identity: NEXT_PUBLIC_URL is not set")
	}

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${secret}`,
		},
		body: JSON.stringify({
			siteId: String(params.user.id),
			siteUrl,
			apiKey: params.apiKey,
		}),
	})

	if (!response.ok) {
		const text = await response.text().catch(() => "")
		throw new Error(`Smart Site AI registration failed (${response.status}): ${text || response.statusText}`)
	}

	const data = (await response.json().catch(() => ({}))) as any
	const fingerprint = typeof data?.fingerprint === "string" ? data.fingerprint : "unknown"
	params.payload.logger.info(`Smart Site AI registration succeeded (fingerprint: ${fingerprint})`)

	if (typeof data?.env === "string") {
		params.payload.logger.info("═══════════════════════════════════════════════════════════════")
		params.payload.logger.info("SMART SITE AI ENVIRONMENT SNIPPET:")
		params.payload.logger.info(data.env)
		params.payload.logger.info("═══════════════════════════════════════════════════════════════")
	}

	if (data?.plan?.slug) {
		params.payload.logger.info(`Active plan: ${data.plan.slug} (${data.plan.status})`)
	}
}
