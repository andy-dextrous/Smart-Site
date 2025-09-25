import { shouldPreventHooks } from "@/admin/utilities/prevent-hooks"
import { revalidateTag } from "next/cache"
import type { GlobalAfterChangeHook } from "payload"

/*************************************************************************/
/*  AI SETTINGS AFTER CHANGE HOOK
/*
/*  Keeps AI configuration caches aligned with Payload saves
/*************************************************************************/

export const afterAISettingsChange: GlobalAfterChangeHook = async ({
	doc,
	previousDoc,
	req: { payload, context },
	global,
}) => {
	if (global.slug !== "ai-settings") return doc

	if (shouldPreventHooks(payload, context)) {
		return doc
	}

	try {
		revalidateTag(`global:${global.slug}`)
		payload.logger.info(`Revalidated global:${global.slug}`)
	} catch (error) {
		payload.logger.error(`Revalidation failed for global ${global.slug}:`, error)
	}

	return doc
}
