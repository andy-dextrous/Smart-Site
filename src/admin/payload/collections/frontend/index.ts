import { slugField } from "@/admin/payload/fields/slug"
import { seoFields, titleField } from "@/admin/payload/fields/seo"
import { lockSlugAfterPublish } from "@/admin/payload/hooks/utilities/lock-slug"
import { beforeUniversalChange } from "@/admin/payload/hooks/collections/universal/before-change"
import { afterUniversalChange } from "@/admin/payload/hooks/collections/universal/after-change"
import { afterUniversalDelete } from "@/admin/payload/hooks/collections/universal/after-delete"
import type { CollectionConfig, CollectionSlug, Field } from "payload"
import { generatePreviewPath } from "@/admin/utilities/generate-preview-path"
import fs from "fs"
import path from "path"

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
}

export type EnableFrontendOptions = {
  label?: string
  seoSchemaType?: SEOSchemaType
}

type CollectionStructure = {
  hasTitle: boolean
  hasCustomSEO: boolean
  hasExistingTabs: boolean
  hasBlockContent: boolean
}

/*************************************************************************/
/*  STATIC DATA
/*************************************************************************/

const jsonPath = path.join(
  process.cwd(),
  "src/admin/payload/collections/frontend/frontend-collections.json"
)
const registeredCollections = new Map<string, FrontendCollection>()
let frontendCollectionsData: FrontendCollection[] = []

/*************************************************************************/
/*  ENHANCED CORE FACTORY FUNCTION
/*************************************************************************/

export function enableFrontend<TSlug extends CollectionSlug>(
  config: CollectionConfig<TSlug>,
  options?: EnableFrontendOptions
): CollectionConfig<TSlug> {
  const { label, seoSchemaType } = options || {}
  const structure = analyzeCollectionStructure(config)
  const enhancedFields = buildEnhancedFields(config, structure, seoSchemaType)
  const collection = createFrontendCollection(config, label, structure)

  registeredCollections.set(config.slug, collection)

  return {
    ...config,
    fields: [...enhancedFields, ...slugField()],
    admin: {
      ...config.admin,
      // Add preview functionality automatically
      livePreview: config.admin?.livePreview ?? {
        url: ({ data, req }) => {
          const previewPath = generatePreviewPath({
            slug: typeof data?.slug === "string" ? data.slug : "",
            collection: config.slug as CollectionSlug,
            req,
            data,
          })
          // Add livePreview parameter for admin bar hiding
          return previewPath + "&livePreview=true"
        },
      },
      preview:
        config.admin?.preview ??
        ((data, { req }) => {
          return generatePreviewPath({
            slug: typeof data?.slug === "string" ? data.slug : "",
            collection: config.slug as CollectionSlug,
            req,
            data,
          })
        }),
    },
    hooks: {
      ...config.hooks,
      beforeChange: [...(config.hooks?.beforeChange || []), beforeUniversalChange],
      afterChange: [...(config.hooks?.afterChange || []), afterUniversalChange],
      afterDelete: [...(config.hooks?.afterDelete || []), afterUniversalDelete],
      beforeOperation: [...(config.hooks?.beforeOperation || []), lockSlugAfterPublish],
    },
  }
}

/*************************************************************************/
/*  COLLECTION STRUCTURE ANALYSIS
/*************************************************************************/

function analyzeCollectionStructure(config: CollectionConfig): CollectionStructure {
  return {
    hasTitle: hasFieldRecursive(config.fields, ["title", "name"]),
    hasCustomSEO: hasFieldRecursive(config.fields, ["meta", "seo"]),
    hasExistingTabs: config.fields.some(field => field.type === "tabs"),
    hasBlockContent: config.fields.some(field => field.type === "blocks"),
  }
}

function hasFieldRecursive(fields: Field[], fieldNames: string[]): boolean {
  for (const field of fields) {
    if ("name" in field && fieldNames.includes(field.name)) {
      return true
    }

    if (field.type === "row" && "fields" in field) {
      if (hasFieldRecursive(field.fields, fieldNames)) {
        return true
      }
    }

    if (field.type === "collapsible" && "fields" in field) {
      if (hasFieldRecursive(field.fields, fieldNames)) {
        return true
      }
    }

    if (field.type === "tabs" && "tabs" in field) {
      for (const tab of field.tabs) {
        if ("fields" in tab && hasFieldRecursive(tab.fields, fieldNames)) {
          return true
        }
      }
    }
  }

  return false
}

function buildEnhancedFields(
  config: CollectionConfig,
  structure: CollectionStructure,
  seoSchemaType?: SEOSchemaType
): Field[] {
  const fields = structure.hasTitle
    ? [...config.fields]
    : [titleField(), ...config.fields]

  if (structure.hasExistingTabs) {
    return addSEOToExistingTabs(fields, structure, seoSchemaType)
  }

  if (structure.hasBlockContent) {
    return createTabsWithSEO(fields, structure, seoSchemaType)
  }

  return addSEOToSimpleLayout(fields, structure, seoSchemaType)
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
  seoSchemaType?: SEOSchemaType
): Field[] {
  if (structure.hasCustomSEO) {
    return fields
  }

  return fields.map(field => {
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
  })
}

function createTabsWithSEO(
  fields: Field[],
  structure: CollectionStructure,
  seoSchemaType?: SEOSchemaType
): Field[] {
  const { titleFields, contentFields } = extractTitleFields(fields)

  if (structure.hasCustomSEO) {
    return [
      ...titleFields,
      {
        type: "tabs",
        tabs: [
          {
            name: "content",
            label: "Content",
            fields: contentFields,
          },
        ],
      },
    ]
  }

  return [
    ...titleFields,
    {
      type: "tabs",
      tabs: [
        {
          name: "content",
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
  ]
}

function addSEOToSimpleLayout(
  fields: Field[],
  structure: CollectionStructure,
  seoSchemaType?: SEOSchemaType
): Field[] {
  if (structure.hasCustomSEO) {
    return fields
  }

  const { titleFields, contentFields } = extractTitleFields(fields)

  return [
    ...titleFields,
    {
      type: "tabs",
      tabs: [
        {
          name: "content",
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
  ]
}

function createFrontendCollection(
  config: CollectionConfig,
  label: string | undefined,
  structure: CollectionStructure
): FrontendCollection {
  return {
    slug: config.slug,
    label: label || capitalizeFirst(config.slug),
    hasSEO: !structure.hasCustomSEO,
  }
}

/*************************************************************************/
/*  PAYLOAD ONINITINIT SYNC FUNCTION
/*************************************************************************/

export function syncFrontendCollectionsOnInit(enabledCollections?: CollectionConfig[]) {
  // If collections are provided, filter registered collections to only include enabled ones
  let actualCollections = Array.from(registeredCollections.values())
  
  if (enabledCollections) {
    const enabledSlugs = new Set(enabledCollections.map(c => c.slug))
    actualCollections = actualCollections.filter(c => enabledSlugs.has(c.slug))
  }
  
  frontendCollectionsData = actualCollections

  try {
    const jsonData = JSON.stringify(actualCollections, null, 2)
    fs.writeFileSync(jsonPath, jsonData, "utf8")
  } catch (error) {
    console.error("❌ Failed to sync frontend collections JSON:", error)
  }
}

/*************************************************************************/
/*  REGISTRY ACCESS FUNCTIONS
/*************************************************************************/

export function getFrontendCollections(): FrontendCollection[] {
  if (frontendCollectionsData.length === 0) {
    frontendCollectionsData = loadCollectionsFromJSON()
  }
  return frontendCollectionsData
}

export function isFrontendCollection(slug: string): boolean {
  return getFrontendCollections().some(collection => collection.slug === slug)
}

export function getFrontendCollection(slug: string): FrontendCollection | undefined {
  return getFrontendCollections().find(collection => collection.slug === slug)
}

/*************************************************************************/
/*  JSON FILE OPERATIONS
/*************************************************************************/

export function loadCollectionsFromJSON(): FrontendCollection[] {
  try {
    if (fs.existsSync(jsonPath)) {
      const jsonData = fs.readFileSync(jsonPath, "utf8")
      return JSON.parse(jsonData) as FrontendCollection[]
    }
  } catch (error) {
    console.error("Failed to load frontend collections from JSON:", error)
  }
  return []
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

/*************************************************************************/
/*  EXPORTED COLLECTIONS ARRAY
/*************************************************************************/

export const frontendCollections = getFrontendCollections()
