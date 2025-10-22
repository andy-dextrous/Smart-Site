import { slugField } from "@/admin/payload/fields/slug"
import { seoFields, titleField } from "@/admin/payload/fields/seo"
import { lockSlugAfterPublish } from "@/admin/payload/hooks/utilities/lock-slug"
import { beforeUniversalChange } from "@/admin/payload/hooks/collections/universal/before-change"
import { afterUniversalChange } from "@/admin/payload/hooks/collections/universal/after-change"
import { afterUniversalDelete } from "@/admin/payload/hooks/collections/universal/after-delete"
import type { CollectionConfig, CollectionSlug, Field } from "payload"
import { generatePreviewPath } from "@/admin/utilities/generate-preview-path"
import {
  getFrontendCollections as getConfigFrontendCollections,
  isFrontendCollection as isConfigFrontendCollection,
  getCollectionConfig,
  type SmartSiteConfig,
} from "@/admin/config"

/*************************************************************************/
/*  TYPE DECLARATIONS
/*************************************************************************/

export type SEOSchemaType =
  | "WebPage"
  | "Article"
  | "Service"
  | "Person"
  | "Organization"
  | "LocalBusiness"
  | "Product"
  | "Event"
  | "FAQPage"
  | "HowTo"

export type FrontendCollection = {
  slug: string
  label: string
  hasSEO?: boolean
  searchEnabled?: boolean
}

export type EnableFrontendOptions = {
  label?: string
  seoSchemaType?: SEOSchemaType
  enablePreview?: boolean
  enableLivePreview?: boolean
  customHooks?: boolean
  slugLocked?: boolean
  seoEnabled?: boolean
}

type CollectionStructure = {
  hasTitle: boolean
  hasCustomSEO: boolean
  hasExistingTabs: boolean
  hasBlockContent: boolean
  primaryLabelField?: string
}

/*************************************************************************/
/*  STATIC DATA
/*************************************************************************/

const registeredCollections = new Map<string, FrontendCollection>()

type EnhancedFieldsResult = {
  fields: Field[]
  usesContentGroup: boolean
}

/*************************************************************************/
/*  ENHANCED CORE FACTORY FUNCTION
/*************************************************************************/

export function enableFrontend<TSlug extends CollectionSlug>(
  config: CollectionConfig<TSlug>,
  options?: EnableFrontendOptions
): CollectionConfig<TSlug> {
  const {
    label,
    seoSchemaType,
    enablePreview = true,
    enableLivePreview = true,
    customHooks = true,
    slugLocked = true,
    seoEnabled = true,
  } = options || {}
  const structure = analyzeCollectionStructure(config)
  const enhanced = buildEnhancedFields(config, structure, seoSchemaType, seoEnabled)
  const collection = createFrontendCollection(config, label, structure, seoEnabled)

  registeredCollections.set(config.slug, collection)

  const slugSourceField = structure.primaryLabelField ?? "title"

  const baseHooks = {
    ...config.hooks,
    beforeChange: customHooks
      ? [...(config.hooks?.beforeChange || []), beforeUniversalChange]
      : config.hooks?.beforeChange,
    afterChange: customHooks
      ? [...(config.hooks?.afterChange || []), afterUniversalChange]
      : config.hooks?.afterChange,
    afterDelete: customHooks
      ? [...(config.hooks?.afterDelete || []), afterUniversalDelete]
      : config.hooks?.afterDelete,
    beforeOperation:
      customHooks && slugLocked
        ? [...(config.hooks?.beforeOperation || []), lockSlugAfterPublish]
        : config.hooks?.beforeOperation,
  }

  if (enhanced.usesContentGroup) {
    baseHooks.beforeValidate = appendHook(baseHooks.beforeValidate, normalizeContentBeforeValidate)
    baseHooks.afterRead = appendHook(baseHooks.afterRead, normalizeContentAfterRead)
  }

  return {
    ...config,
    fields: [...enhanced.fields, ...slugField(slugSourceField)],
    admin: {
      ...config.admin,
      // Add preview functionality automatically when enabled
      livePreview:
        enableLivePreview === false
          ? config.admin?.livePreview
          : config.admin?.livePreview ?? {
              url: ({ data, req }) => {
                const previewPath = generatePreviewPath({
                  slug: typeof data?.slug === "string" ? data.slug : "",
                  collection: config.slug as CollectionSlug,
                  req,
                  data,
                })
                // Add livePreview parameter for admin bar hiding
                return `${previewPath}&livePreview=true`
              },
            },
      preview:
        enablePreview === false
          ? config.admin?.preview
          : config.admin?.preview ?? ((data, { req }) => {
              return generatePreviewPath({
                slug: typeof data?.slug === "string" ? data.slug : "",
                collection: config.slug as CollectionSlug,
                req,
                data,
              })
            }),
    },
    hooks: baseHooks,
  }
}

/*************************************************************************/
/*  DYNAMIC FRONTEND WRAPPER
/*************************************************************************/

export function applyFrontendWrapper(
  baseConfig: CollectionConfig,
  slug: string,
  smartSiteConfig: SmartSiteConfig
): CollectionConfig {
  const collectionConfig = smartSiteConfig.collections[slug]
  
  if (!collectionConfig) {
    return baseConfig
  }
  
  if (!collectionConfig.frontend || !collectionConfig.enabled) {
    return baseConfig
  }
  
  const frontendOptions = {
    label: collectionConfig.label,
    seoSchemaType: collectionConfig.frontendOptions?.seoSchemaType,
    enablePreview: collectionConfig.frontendOptions?.enablePreview,
    enableLivePreview: collectionConfig.frontendOptions?.enableLivePreview,
    customHooks: collectionConfig.frontendOptions?.customHooks,
    slugLocked: collectionConfig.frontendOptions?.slugLocked,
    seoEnabled: collectionConfig.seo !== false,
  }

  return enableFrontend(baseConfig, frontendOptions)
}

/*************************************************************************/
/*  COLLECTION STRUCTURE ANALYSIS
/*************************************************************************/

function analyzeCollectionStructure(config: CollectionConfig): CollectionStructure {
  const preferredLabelField = resolvePrimaryLabelField(config)

  return {
    hasTitle: Boolean(preferredLabelField),
    hasCustomSEO: Boolean(findFieldNameRecursive(config.fields, ["meta", "seo"])),
    hasExistingTabs: config.fields.some(field => field.type === "tabs"),
    hasBlockContent: config.fields.some(field => field.type === "blocks"),
    primaryLabelField: preferredLabelField,
  }
}

function resolvePrimaryLabelField(config: CollectionConfig): string | undefined {
  const adminLabelField =
    typeof config.admin?.useAsTitle === "string" ? config.admin.useAsTitle : undefined

  if (adminLabelField && fieldExists(config.fields, adminLabelField)) {
    return adminLabelField
  }

  return findFieldNameRecursive(config.fields, ["title", "name"])
}

function fieldExists(fields: Field[], fieldName: string): boolean {
  return Boolean(findFieldNameRecursive(fields, [fieldName]))
}

function findFieldNameRecursive(fields: Field[], fieldNames: string[]): string | undefined {
  for (const field of fields) {
    if ("name" in field && fieldNames.includes(field.name)) {
      return field.name
    }

    if ("fields" in field && Array.isArray((field as any).fields)) {
      const nestedField = findFieldNameRecursive((field as any).fields, fieldNames)
      if (nestedField) {
        return nestedField
      }
    }

    if (field.type === "tabs" && "tabs" in field) {
      for (const tab of field.tabs) {
        if ("fields" in tab) {
          const nestedField = findFieldNameRecursive(tab.fields, fieldNames)
          if (nestedField) {
            return nestedField
          }
        }
      }
    }

    if (field.type === "blocks" && "blocks" in field) {
      for (const block of field.blocks) {
        if ("fields" in block) {
          const nestedField = findFieldNameRecursive(block.fields, fieldNames)
          if (nestedField) {
            return nestedField
          }
        }
      }
    }
  }

  return undefined
}

function buildEnhancedFields(
  config: CollectionConfig,
  structure: CollectionStructure,
  seoSchemaType: SEOSchemaType | undefined,
  seoEnabled: boolean
): EnhancedFieldsResult {
  const fields = structure.hasTitle
    ? [...config.fields]
    : [titleField(), ...config.fields]

  if (structure.hasExistingTabs) {
    return addSEOToExistingTabs(fields, structure, seoSchemaType, seoEnabled)
  }

  if (structure.hasBlockContent) {
    return createTabsWithSEO(fields, structure, seoSchemaType, seoEnabled)
  }

  return addSEOToSimpleLayout(fields, structure, seoSchemaType, seoEnabled)
}

function extractTitleFields(fields: Field[]): {
  titleFields: Field[]
  contentFields: Field[]
} {
  const titleFields: Field[] = []
  const contentFields: Field[] = []

  for (const field of fields) {
    if (isTitleField(field)) {
      titleFields.push(field)
    } else {
      contentFields.push(field)
    }
  }

  return { titleFields, contentFields }
}

function isTitleField(field: Field): boolean {
  if ("name" in field) {
    return ["title", "name"].includes(field.name)
  }

  if (field.type === "row" && "fields" in field) {
    return field.fields.some(f => "name" in f && ["title", "name"].includes(f.name))
  }

  return false
}

function addSEOToExistingTabs(
  fields: Field[],
  structure: CollectionStructure,
  seoSchemaType: SEOSchemaType | undefined,
  seoEnabled: boolean
): EnhancedFieldsResult {
  if (structure.hasCustomSEO || !seoEnabled) {
    return {
      fields,
      usesContentGroup: false,
    }
  }

  return {
    fields: fields.map(field => {
      if (field.type === "tabs") {
        return {
          ...field,
          tabs: [
            ...field.tabs,
          {
            name: "seo",
            label: "SEO",
            fields: seoFields({ seoSchemaType }),
          },
        ],
        }
      }
      return field
    }),
    usesContentGroup: false,
  }
}

function createTabsWithSEO(
  fields: Field[],
  structure: CollectionStructure,
  seoSchemaType: SEOSchemaType | undefined,
  seoEnabled: boolean
): EnhancedFieldsResult {
  const { titleFields, contentFields } = extractTitleFields(fields)

  if (structure.hasCustomSEO || !seoEnabled) {
    return {
      fields: [
        ...titleFields,
        {
          type: "tabs",
          tabs: [
            {
              label: "Content",
              fields: contentFields,
            },
          ],
        },
      ],
      usesContentGroup: true,
    }
  }

  return {
    fields: [
      ...titleFields,
      {
        type: "tabs",
        tabs: [
          {
            label: "Content",
            fields: contentFields,
          },
          {
            name: "seo",
            label: "SEO",
            fields: seoFields({ seoSchemaType }),
          },
        ],
      },
    ],
    usesContentGroup: true,
  }
}

function addSEOToSimpleLayout(
  fields: Field[],
  structure: CollectionStructure,
  seoSchemaType: SEOSchemaType | undefined,
  seoEnabled: boolean
): EnhancedFieldsResult {
  if (structure.hasCustomSEO || !seoEnabled) {
    return {
      fields,
      usesContentGroup: false,
    }
  }

  const { titleFields, contentFields } = extractTitleFields(fields)

  return {
    fields: [
      ...titleFields,
      {
        type: "tabs",
        tabs: [
          {
            label: "Content",
            fields: contentFields,
          },
          {
            name: "seo",
            label: "SEO",
            fields: seoFields({ seoSchemaType }),
          },
        ],
      },
    ],
    usesContentGroup: true,
  }
}

function appendHook<T>(
  existing: T[] | undefined,
  hook: T
): T[] {
  return existing ? [...existing, hook] : [hook]
}

function normalizeContentBeforeValidate(args: { data?: Record<string, unknown> }): void {
  if (args.data) {
    flattenContentGroupData(args.data)
  }
}

function normalizeContentAfterRead(args: { doc?: Record<string, unknown> | null }): Record<string, unknown> | undefined | null {
  if (args.doc) {
    flattenContentGroupData(args.doc)
    return args.doc
  }
  return args.doc ?? undefined
}

function flattenContentGroupData(target: Record<string, unknown> | undefined): void {
  if (!target || typeof target !== "object" || Array.isArray(target)) {
    return
  }

  const carrier = target as Record<string, unknown> & { content?: unknown }
  const content = carrier.content
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return
  }

  for (const [key, value] of Object.entries(content as Record<string, unknown>)) {
    if (!(key in carrier)) {
      carrier[key] = value
    }
  }

  delete carrier.content
}

function createFrontendCollection(
  config: CollectionConfig,
  label: string | undefined,
  structure: CollectionStructure,
  seoEnabled: boolean
): FrontendCollection {
  return {
    slug: config.slug,
    label: label || capitalizeFirst(config.slug),
    hasSEO: seoEnabled && !structure.hasCustomSEO,
  }
}

/*************************************************************************/
/*  REGISTRY ACCESS FUNCTIONS
/*************************************************************************/

export function getFrontendCollections(): FrontendCollection[] {
  // Use the new config system to get frontend collections
  const configCollections = getConfigFrontendCollections()
  const frontendCollections: FrontendCollection[] = []

  for (const [slug, collection] of Object.entries(configCollections)) {
    frontendCollections.push({
      slug,
      label: collection.label,
      hasSEO: collection.seo !== false,
      searchEnabled: collection.search?.enabled !== false,
    })
  }

  return frontendCollections
}

export function isFrontendCollection(slug: string): boolean {
  return isConfigFrontendCollection(slug)
}

export function getFrontendCollection(slug: string): FrontendCollection | undefined {
  const config = getCollectionConfig(slug)
  if (config && config.frontend && config.enabled) {
    return {
      slug,
      label: config.label,
      hasSEO: config.seo !== false,
      searchEnabled: config.search?.enabled !== false,
    }
  }
  return undefined
}

export function __getRegisteredCollectionsForTesting(): FrontendCollection[] {
  return Array.from(registeredCollections.values())
}

export function __clearRegisteredCollectionsForTesting(): void {
  registeredCollections.clear()
}

/*************************************************************************/
/*  UTILITY FUNCTIONS
/*************************************************************************/

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/*************************************************************************/
/*  COLLECTION FIELD UTILITIES - ELIMINATES REPETITIVE PATTERNS
/*************************************************************************/

/**
 * Generate archive page field name for a collection
 */
export function getArchivePageFieldName(collection: string): string {
  return `${collection}ArchivePage`
}

/**
 * Generate single template field name for a collection
 */
export function getTemplateFieldName(collection: string): string {
  return collection === "pages" ? "pagesDefaultTemplate" : `${collection}SingleTemplate`
}

/**
 * Get all archive page field names for non-page collections
 */
export function getAllArchivePageFieldNames(): string[] {
  return getFrontendCollections()
    .filter(collection => collection.slug !== "pages")
    .map(collection => getArchivePageFieldName(collection.slug))
}

/**
 * Get all template field names for all collections (including pages)
 */
export function getAllTemplateFieldNames(): string[] {
  const collections = getFrontendCollections()
  return collections.map(collection => getTemplateFieldName(collection.slug))
}

/**
 * Get archive settings objects for all non-page collections
 */
export function getArchiveSettings(): Array<{
  field: string
  collection: string
  label: string
}> {
  return getFrontendCollections()
    .filter(collection => collection.slug !== "pages")
    .map(collection => ({
      field: getArchivePageFieldName(collection.slug),
      collection: collection.slug,
      label: collection.label,
    }))
}

/**
 * Get field value from settings object safely
 */
export function getSettingsFieldValue(
  settings: any,
  fieldName: string
): string | undefined {
  const value = settings?.routing?.[fieldName]

  // Handle both populated relationships and direct ID strings
  if (typeof value === "string") {
    return value
  }

  if (typeof value === "object" && value?.id) {
    return value.id
  }

  return undefined
}

/**
 * Get template ID for a collection from settings
 */
export function getTemplateIdFromSettings(
  settings: any,
  collection: string
): string | undefined {
  const fieldName = getTemplateFieldName(collection)
  return getSettingsFieldValue(settings, fieldName)
}

/**
 * Get archive page ID for a collection from settings
 */
export function getArchivePageIdFromSettings(
  settings: any,
  collection: string
): string | undefined {
  const fieldName = getArchivePageFieldName(collection)
  return getSettingsFieldValue(settings, fieldName)
}
