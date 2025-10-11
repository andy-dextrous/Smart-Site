import { getPayload } from "payload"
import configPromise from "@payload-config"
import { getFrontendCollections } from "@/admin/config/frontend"
import { routingEngine } from "@/admin/routing"
import { getTemplateIdForCollection } from "@/admin/routing/index-manager"

type DraftLookupHints = {
  collection?: string
  documentId?: string
}

type DraftModeResult = {
  document: any
  uriIndex: {
    uri: string
    sourceCollection: string
    documentId: string
    status?: string
    breadcrumbs?: any[]
    templateId?: string | null
  }
}

/*************************************************************************/
/*  DRAFT MODE DATA FETCHING - BYPASSES CACHE FOR REAL-TIME CONTENT
    USED IN LIVE PREVIEW MODE
/*************************************************************************/

export async function getDraftModeData(
  uri: string,
  hints: DraftLookupHints = {}
): Promise<DraftModeResult | null> {
  const payload = await getPayload({ config: configPromise })

  // 1. Fast path when preview hints include document ID + collection
  if (hints.documentId && hints.collection) {
    const byId = await loadDocumentById(payload, hints.collection, hints.documentId)
    if (byId) {
      return prepareDraftResponse({
        payload,
        uri,
        collection: hints.collection,
        document: byId,
      })
    }
  }

  // 2. Attempt lookup via URI index (covers published documents)
  const indexDoc = await findIndexEntryByURI(payload, uri)
  if (indexDoc) {
    const document = await loadDocumentById(payload, indexDoc.sourceCollection, indexDoc.documentId)
    if (!document) {
      return null
    }

    await ensureTemplateSections({
      payload,
      collection: indexDoc.sourceCollection,
      document,
      templateId: indexDoc.templateId,
    })

    return {
      document,
      uriIndex: indexDoc,
    }
  }

  // 3. Fall back to querying frontend collections directly for drafts
  const collectionsToSearch = determineCollectionSearchOrder(hints.collection)

  for (const collection of collectionsToSearch) {
    const document = await loadDocumentByURI(payload, collection, uri)
    if (document) {
      return prepareDraftResponse({
        payload,
        uri,
        collection,
        document,
      })
    }
  }

  return null
}

/*************************************************************************/
/*  INTERNAL HELPERS
/*************************************************************************/

async function findIndexEntryByURI(payload: any, uri: string) {
  const indexResult = await payload.find({
    collection: "uri-index",
    where: { uri: { equals: uri } },
    limit: 1,
    overrideAccess: true,
  })

  return indexResult.docs[0] || null
}

async function loadDocumentById(payload: any, collection: string, id: string) {
  try {
    const document = await payload.findByID({
      collection,
      id,
      draft: true,
      depth: 5,
      overrideAccess: true,
    })

    return document || null
  } catch {
    return null
  }
}

async function loadDocumentByURI(payload: any, collection: string, uri: string) {
  try {
    const result = await payload.find({
      collection,
      where: { uri: { equals: uri } },
      draft: true,
      depth: 5,
      limit: 1,
      pagination: false,
      overrideAccess: true,
    })

    return result.docs?.[0] || null
  } catch {
    return null
  }
}

function determineCollectionSearchOrder(priorityCollection?: string) {
  const frontendCollections = getFrontendCollections().map(collection => collection.slug)

  if (!priorityCollection) {
    return frontendCollections
  }

  const ordered = new Set<string>([priorityCollection, ...frontendCollections])
  return Array.from(ordered)
}

async function prepareDraftResponse({
  payload,
  uri,
  collection,
  document,
}: {
  payload: any
  uri: string
  collection: string
  document: any
}): Promise<DraftModeResult | null> {
  if (!document) {
    return null
  }

  const templateId = await ensureTemplateSections({
    payload,
    collection,
    document,
  })

  const breadcrumbs = await generateBreadcrumbsSafe({
    collection,
    document,
  })

  return {
    document,
    uriIndex: {
      uri,
      sourceCollection: collection,
      documentId: String(document.id),
      status: document._status || "draft",
      breadcrumbs,
      templateId: templateId ?? undefined,
    },
  }
}

async function ensureTemplateSections({
  payload,
  collection,
  document,
  templateId,
}: {
  payload: any
  collection: string
  document: any
  templateId?: string | null
}): Promise<string | null | undefined> {
  const hasSections = Array.isArray(document.sections) && document.sections.length > 0
  if (hasSections) {
    return templateId
  }

  let resolvedTemplateId =
    templateId ??
    extractTemplateIdFromDocument(document) ??
    (await getTemplateIdForCollection(collection, payload))

  if (!resolvedTemplateId) {
    return null
  }

  try {
    const template = await payload.findByID({
      collection: "templates",
      id: resolvedTemplateId,
      draft: false,
      depth: 2,
      overrideAccess: true,
    })

    if (template?.sections) {
      document.sections = template.sections
    }
  } catch {
    resolvedTemplateId = null
  }

  return resolvedTemplateId
}

function extractTemplateIdFromDocument(document: any): string | null {
  const templateField = document?.template || document?.templateId

  if (!templateField) {
    return null
  }

  if (typeof templateField === "string") {
    return templateField
  }

  if (typeof templateField === "object" && templateField.id) {
    return templateField.id
  }

  return null
}

async function generateBreadcrumbsSafe({
  collection,
  document,
}: {
  collection: string
  document: any
}) {
  try {
    return await routingEngine.generateBreadcrumbs({
      collection,
      slug: document.slug,
      data: document,
    })
  } catch {
    return []
  }
}
