import path from "node:path"
import process from "node:process"
import ora from "ora"
import chalk from "chalk"
import type { Payload, CollectionSlug } from "payload"
import { getPayload } from "payload"

type FlattenStats = {
	collection: string
	total: number
	updated: number
	skipped: number
	conflicts: number
}

const DEFAULT_BATCH_SIZE = 50
const TARGET_COLLECTIONS = ["team"]

async function bootstrapPayload(): Promise<Payload> {
	const appRoot = process.cwd()
	process.env.PAYLOAD_CONFIG_PATH =
		process.env.PAYLOAD_CONFIG_PATH ||
		path.join(appRoot, "src", "admin", "payload", "payload.config.ts")

	const payloadConfigModule = await import("@payload-config")
	return getPayload({ config: payloadConfigModule.default })
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

type FlattenResult = {
	data: Record<string, unknown>
	conflicts: string[]
}

function buildUpdatePayload(doc: Record<string, unknown>): FlattenResult | null {
	const content = doc.content
	if (!isPlainObject(content) || Object.keys(content).length === 0) {
		return null
	}

	const updates: Record<string, unknown> = {}
	const conflicts: string[] = []

	for (const [key, value] of Object.entries(content)) {
		if (key in doc && doc[key] !== undefined && doc[key] !== null) {
			if (doc[key] !== value) {
				conflicts.push(key)
			}
			continue
		}
		updates[key] = value
	}

	if (Object.keys(updates).length === 0) {
		return {
			data: { content },
			conflicts,
		}
	}

	return {
		data: {
			...updates,
			content,
		},
		conflicts,
	}
}

async function flattenCollection(payload: Payload, collection: string): Promise<FlattenStats> {
	const stats: FlattenStats = {
		collection,
		total: 0,
		updated: 0,
		skipped: 0,
		conflicts: 0,
	}

	let page = 1
	while (true) {
		const result = await payload.find({
			collection: collection as CollectionSlug,
			limit: DEFAULT_BATCH_SIZE,
			page,
			where: {
				content: {
					exists: true,
				},
			},
			depth: 0,
		})

		if (!result.docs.length) {
			break
		}

		const docs = result.docs as unknown as Array<Record<string, unknown>>

		for (const doc of docs) {
			stats.total += 1
			const updatePayload = buildUpdatePayload(doc)
			if (!updatePayload) {
				stats.skipped += 1
				continue
			}

			if (updatePayload.conflicts.length > 0) {
				stats.conflicts += 1
				console.warn(
					chalk.yellow(
						`⚠️  ${collection}:${String(
							doc.id
						)} contains conflicting keys: ${updatePayload.conflicts.join(", ")} (existing top-level values preserved)`
					)
				)
			}

			await payload.update({
				collection: collection as CollectionSlug,
				id: doc.id as string,
				data: updatePayload.data,
			})
			stats.updated += 1
		}

		if (!result.hasNextPage) {
			break
		}

		page += 1
	}

	return stats
}

async function main() {
	const spinner = ora("Flattening legacy content groups").start()

	try {
		const payload = await bootstrapPayload()
		const summaries: FlattenStats[] = []

		for (const collection of TARGET_COLLECTIONS) {
			spinner.text = `Flattening '${collection}' content`
			const stats = await flattenCollection(payload, collection)
			summaries.push(stats)
		}

		spinner.succeed("Content groups flattened")

		console.log("")
		console.log(chalk.bold("Migration summary"))
		for (const summary of summaries) {
			console.log(
				`${chalk.cyan(summary.collection)}: ${summary.updated} updated, ${summary.skipped} skipped, ${summary.conflicts} conflicts among ${summary.total} candidates`
			)
		}

		console.log("")
		console.log(
			chalk.gray(
				"Run `pnpm --filter @product-studio/smart-site-starter tsx scripts/migrations/flatten-content-group.ts` after pulling these changes."
			)
		)
		process.exit(0)
	} catch (error) {
		spinner.fail("Flattening failed")
		console.error(error)
		process.exit(1)
	}
}

main()
