import path from "path"
import fs from "fs-extra"
import chalk from "chalk"
import ora from "ora"
import { randomBytes } from "crypto"
import { stdin as input, stdout as output } from "node:process"
import { createInterface } from "node:readline/promises"
import { getPayload } from "payload"
import { ensureAIAgentWithAPIKey } from "@/admin/payload/endpoints/seed/users/ai-agent"

type EnvMap = Record<string, string>

function parseEnvValue(value: string): string {
	const trimmed = value.trim()
	if (
		(trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1)
	}
	return trimmed
}

async function loadEnvFile(filePath: string): Promise<EnvMap> {
	try {
		const content = await fs.readFile(filePath, "utf8")
		const env: EnvMap = {}
		for (const line of content.split(/\r?\n/)) {
			if (!line || line.trim().startsWith("#") || !line.includes("=")) {
				continue
			}
			const idx = line.indexOf("=")
			const key = line.slice(0, idx).trim()
			const value = parseEnvValue(line.slice(idx + 1))
			if (key) {
				env[key] = value
			}
		}
		return env
	} catch (error: any) {
		if (error.code === "ENOENT") {
			return {}
		}
		throw error
	}
}

async function writeEnvValues(filePath: string, updates: EnvMap): Promise<void> {
	let lines: string[] = []
	try {
		const existing = await fs.readFile(filePath, "utf8")
		lines = existing.split(/\r?\n/)
	} catch (error: any) {
		if (error.code !== "ENOENT") {
			throw error
		}
	}

	const found = new Set<string>()
	lines = lines.map(line => {
		const idx = line.indexOf("=")
		if (idx === -1) {
			return line
		}
		const key = line.slice(0, idx)
		if (Object.prototype.hasOwnProperty.call(updates, key)) {
			found.add(key)
			return `${key}=${updates[key]}`
		}
		return line
	})

	for (const [key, value] of Object.entries(updates)) {
		if (!found.has(key)) {
			lines.push(`${key}=${value}`)
		}
	}

	while (lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop()
	}
	lines.push("")

	await fs.outputFile(filePath, lines.join("\n"))
}

function applyEnv(env: EnvMap) {
	for (const [key, value] of Object.entries(env)) {
		process.env[key] = value
	}
}

function isPlaceholderSecret(value?: string): boolean {
	if (!value) return true
	const trimmed = value.trim()
	if (!trimmed) return true
	const lowered = trimmed.toLowerCase()
	return (
		lowered.includes("create any random secret") ||
		lowered.includes("short nanoid") ||
		lowered.includes("changeme") ||
		lowered === "..."
	)
}

function ensureBaseSecrets(env: EnvMap): EnvMap {
	const updates: EnvMap = {}
	if (isPlaceholderSecret(env.PAYLOAD_SECRET)) {
		const secret = randomBytes(32).toString("hex")
		env.PAYLOAD_SECRET = secret
		updates.PAYLOAD_SECRET = secret
	}
	if (isPlaceholderSecret(env.PREVIEW_SECRET)) {
		const preview = randomBytes(16).toString("hex")
		env.PREVIEW_SECRET = preview
		updates.PREVIEW_SECRET = preview
	}
	return updates
}

async function resolveSiteName(env: EnvMap): Promise<string> {
	const existing = env.SMARTSITE_SITE_NAME?.trim() || process.env.SMARTSITE_SITE_NAME?.trim()
	if (existing && existing.length > 0) {
		return existing
	}

	const fallback = "Smart Site"

	if (!output.isTTY || !input.isTTY) {
		return fallback
	}

	const rl = createInterface({ input, output })
	const answer = (await rl.question(`Site name [${fallback}]: `)).trim()
	rl.close()
	return answer.length > 0 ? answer : fallback
}

async function main() {
	const force = process.argv.includes("--force")
	const appRoot = process.cwd()
	const envPath = path.join(appRoot, ".env")

	const envFile = await loadEnvFile(envPath)
	const baseSecretUpdates = ensureBaseSecrets(envFile)
	applyEnv(envFile)
	applyEnv(baseSecretUpdates)

	if (!process.env.SMARTSITE_AI_REGISTRATION_SECRET) {
		console.error(
			chalk.red(
				"SMARTSITE_AI_REGISTRATION_SECRET is not set. Update your .env before running this command."
			)
		)
		process.exit(1)
	}

	const siteName = await resolveSiteName(envFile)
	process.env.SMARTSITE_SITE_NAME = siteName
	const spinner = ora(`Registering AI agent for "${siteName}"`).start()

	try {
	const payloadConfigModule = await import("@payload-config")
	const payload = await getPayload({ config: payloadConfigModule.default })
		const { user, apiKey } = await ensureAIAgentWithAPIKey(payload, {}, siteName, {
			force,
			env: process.env,
		})

		spinner.succeed("AI agent registration completed")

		const appliedKey = process.env.AI_AGENT_API_KEY ?? apiKey ?? ""
		const appliedUserId = process.env.AI_AGENT_USER_ID ?? String(user.id)

		await writeEnvValues(envPath, {
			...baseSecretUpdates,
			SMARTSITE_SITE_NAME: siteName,
			AI_AGENT_API_KEY: appliedKey,
			AI_AGENT_USER_ID: appliedUserId,
		})

		console.log("")
		console.log(chalk.green("AI agent ready:"))
		console.log(chalk.gray(`  User ID : ${appliedUserId}`))
		console.log(chalk.gray(`  Email   : ${user.email}`))
		if (apiKey) {
			console.log(chalk.yellow("  API Key :"), apiKey)
			console.log(
				chalk.yellow(
					"  (Save this key now; it is shown once. It has been written to .env for local development.)"
				)
			)
		} else {
			console.log(chalk.gray("  API Key : (unchanged)"))
		}

		if (force && !apiKey) {
			console.log(
				chalk.yellow(
					"No new API key was issued. The existing credentials remain active because the service reported an unchanged state."
				)
			)
		}

		console.log("")
		console.log(chalk.cyan("Next steps:"))
		console.log(chalk.cyan("  • Restart your Smart Site process to load the updated environment variables."))
		console.log(chalk.cyan("  • Copy the recovery token from the Smart Site AI logs if one was emitted."))
		process.exit(0)
	} catch (error) {
		spinner.fail("AI agent registration failed")
		console.error(error)
		process.exit(1)
	}
}

main()
