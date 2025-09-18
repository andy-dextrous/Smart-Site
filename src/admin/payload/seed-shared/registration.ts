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
	siteName: string
	env?: NodeJS.ProcessEnv
}

interface RegistrationEndpointResult {
	url: string | null
	reason: string | null
}

function resolveSecret(env: NodeJS.ProcessEnv): string | null {
	return env.SMARTSITE_AI_REGISTRATION_SECRET ?? null
}

function resolveSiteUrl(env: NodeJS.ProcessEnv): string | null {
	return env.NEXT_PUBLIC_URL ?? env.NEXT_PUBLIC_SITE_URL ?? null
}

function isPlaceholderSecret(secret: string | null): boolean {
	if (!secret) {
		return true
	}
	const trimmed = secret.trim()
	if (!trimmed) {
		return true
	}
	const lowered = trimmed.toLowerCase()
	if (lowered === "changeme-register") {
		return true
	}
	return false
}

function buildRegistrationUrl(env?: NodeJS.ProcessEnv): RegistrationEndpointResult {
	const config = getSmartSiteConfig()
	if (!config.features.ai.enabled) {
		return { url: null, reason: "AI feature disabled in smartsite.config.ts" }
	}

	const envEndpoint = env?.SMARTSITE_AI_ENDPOINT?.trim()
	const endpoint = envEndpoint || config.features.ai.endpoint?.trim()
	if (!endpoint) {
		return { url: null, reason: "features.ai.endpoint is not set" }
	}

	const path = config.features.ai.registrationPath?.trim() || "/api/internal/identities"
	if (/^https?:\/\//i.test(path)) {
		return { url: path, reason: null }
	}

	try {
		const resolved = new URL(path.startsWith("/") ? path : `/${path}`, endpoint).toString()
		return { url: resolved, reason: null }
	} catch {
		return {
			url: null,
			reason: "Unable to resolve registration URL from endpoint and registrationPath",
		}
	}
}

function logConfigDebug(
	params: IdentityRegistrationParams,
	endpointResult: RegistrationEndpointResult,
	secretRaw: string | null,
	siteUrl: string | null
) {
	params.payload.logger.info("SMART SITE AI REGISTRATION DEBUG")
	params.payload.logger.info(`  endpoint.enabled: ${endpointResult.url ? "true" : "false"}`)
	params.payload.logger.info(`  endpoint.url: ${endpointResult.url ?? "null"}`)
	params.payload.logger.info(`  endpoint.reason: ${endpointResult.reason ?? "none"}`)
	params.payload.logger.info(`  secret.present: ${secretRaw ? "true" : "false"}`)
	params.payload.logger.info(`  secret.placeholder: ${isPlaceholderSecret(secretRaw)}`)
	params.payload.logger.info(`  siteUrl: ${siteUrl ?? "null"}`)
	const activeEnv = params.env ?? process.env
	params.payload.logger.info(`  env.NEXT_PUBLIC_URL: ${activeEnv.NEXT_PUBLIC_URL ?? "undefined"}`)
	params.payload.logger.info(`  env.SMARTSITE_AI_ENDPOINT: ${activeEnv.SMARTSITE_AI_ENDPOINT ?? "undefined"}`)
	params.payload.logger.info(`  env.SMARTSITE_AI_REGISTRATION_SECRET set: ${Boolean(secretRaw)}`)
}

export async function registerIdentityWithSmartSiteAI(params: IdentityRegistrationParams): Promise<void> {
	const env = params.env ?? process.env
	const endpointResult = buildRegistrationUrl(env)
	const endpoint = endpointResult.url
	const secretRaw = resolveSecret(env)
	const siteName = params.siteName.trim()
	const siteUrl = resolveSiteUrl(env)

	logConfigDebug(params, endpointResult, secretRaw, siteUrl)

	if (!endpoint) {
		const reason = endpointResult.reason ?? "Endpoint is not configured"
		params.payload.logger.info(`Skipping Smart Site AI registration (endpoint unavailable: ${reason})`)
		return
	}

	if (isPlaceholderSecret(secretRaw)) {
		params.payload.logger.info("Skipping Smart Site AI registration (registration secret missing or placeholder value detected)")
		return
	}

	if (!siteUrl) {
		throw new Error("Cannot register identity: NEXT_PUBLIC_URL is not set")
	}
	if (!siteName) {
		throw new Error("Cannot register identity: site name is not set")
	}

	const secret = secretRaw!.trim()
	params.payload.logger.info(`Registering Smart Site identity at ${endpoint} for site ${siteName} (${siteUrl})`)

	const payloadBody = JSON.stringify({
		siteId: String(params.user.id),
		siteUrl,
		apiKey: params.apiKey,
		siteName,
	})
	const bufferBody = Buffer.from(payloadBody, "utf8")

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Content-Length": String(bufferBody.byteLength),
			Authorization: `Bearer ${secret}`,
		},
		body: bufferBody,
	})

	if (!response.ok) {
		const text = await response.text().catch(() => "")
		params.payload.logger.error(`Smart Site AI registration failed (${response.status}) for ${siteName}: ${text || response.statusText}`)
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
