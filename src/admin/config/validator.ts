import { z, type ZodIssue } from "zod"
import {
  SMARTSITE_DEFAULTS,
  SmartSiteConfigSchema,
  type SmartSiteConfig,
  type UserConfig,
} from "./defaults"

/*************************************************************************/
/*  CONFIG VALIDATION UTILITIES
/*************************************************************************/

export class ConfigValidationError extends Error {
  issues: ZodIssue[]

  constructor(message: string, issues: ZodIssue[]) {
    super(message)
    this.name = "ConfigValidationError"
    this.issues = issues
  }
}

const SmartSitePartialSchema = SmartSiteConfigSchema.deepPartial()
const CollectionOptions = SmartSiteConfigSchema.shape.collections.element.options
const CollectionOverridesSchema = z.union(
  CollectionOptions.map(option => option.deepPartial()) as unknown as Readonly<
    [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
  >
)

const UserConfigSchema = SmartSitePartialSchema.extend({
  collections: z.record(CollectionOverridesSchema).optional(),
})

function formatIssues(issues: ZodIssue[]): string {
  return issues
    .map(issue => {
      const path = issue.path.length ? issue.path.join(".") : "(root)"
      return ` • ${path}: ${issue.message}`
    })
    .join("\n")
}

function buildError(prefix: string, issues: ZodIssue[]): ConfigValidationError {
  const formatted = formatIssues(issues)
  const message = `${prefix}\n${formatted}\n`
  return new ConfigValidationError(message, issues)
}

export function validateUserConfig(raw: unknown): UserConfig {
  try {
    return UserConfigSchema.parse(raw) as UserConfig
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw buildError("Invalid smartsite.config.ts overrides:", error.issues)
    }

    throw error
  }
}

export function validateMergedConfig(raw: unknown): SmartSiteConfig {
  try {
    return SmartSiteConfigSchema.parse(raw)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw buildError("Merged Smart Site configuration is invalid:", error.issues)
    }

    throw error
  }
}

type ValidationContext = {
  merged: SmartSiteConfig
  user: UserConfig
}

function warn(message: string) {
  const prefix = "⚠️  smartsite.config.ts"
  if (process.env.NODE_ENV !== "production") {
    console.warn(`${prefix}: ${message}`)
  } else {
    console.warn(`${prefix}: ${message}`)
  }
}

export function emitValidationWarnings({ merged, user }: ValidationContext): void {
  const userImageSizes = user.images?.sizes
  if (Array.isArray(userImageSizes)) {
    const sizeNames = new Set((merged.images?.sizes || []).map(size => size.name))
    const requiredSizes = ["thumbnail"]

    for (const required of requiredSizes) {
      if (!sizeNames.has(required)) {
        warn(
          `images.sizes overrides should include the "${required}" size to ensure admin thumbnails render correctly.`
        )
        break
      }
    }
  }

  const userBreakpoints = user.images?.breakpoints
  if (userBreakpoints && Object.keys(userBreakpoints).length === 0) {
    warn(
      "images.breakpoints is empty. Responsive image generation will fall back to default breakpoints from the framework."
    )
  }

  const defaultExtensionCounts = {
    collections: SMARTSITE_DEFAULTS.extensions?.collections?.length ?? 0,
    blocks: SMARTSITE_DEFAULTS.extensions?.blocks?.length ?? 0,
    globals: SMARTSITE_DEFAULTS.extensions?.globals?.length ?? 0,
    plugins: SMARTSITE_DEFAULTS.extensions?.plugins?.length ?? 0,
  }

  const userExtensions = user.extensions
  if (userExtensions) {
    (Object.keys(defaultExtensionCounts) as Array<keyof typeof defaultExtensionCounts>).forEach(key => {
      const userList = userExtensions[key]
      if (Array.isArray(userList) && userList.length === 0 && defaultExtensionCounts[key] > 0) {
        warn(
          `extensions.${key} overrides cleared default entries. Ensure this is intentional before deploying.`
        )
      }
    })
  }

  const userI18n = user.features?.i18n
  if (userI18n === true) {
    warn(
      "features.i18n is enabled without specifying locales. The app defaults to ['en']; provide an object with locales to configure multiple languages."
    )
  }
}
