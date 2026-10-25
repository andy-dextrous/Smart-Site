import type { PayloadRequest } from "payload"
import { getFrontendCollections } from "@/lib/collections"
import { routingEngine } from "@/lib/routing"
import { getTemplateIdForCollection } from "@/lib/routing/index-manager"

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
  req: PayloadRequest,
  hints: DraftLookupHints = {}
): Promise<DraftModeResult | null> {
  if (!req.user) return null
  const payload = req.payload
  const frontendCollections = (await getFrontendCollections()).map(
    collection => collection.slug as string
  )
  if (hints.collection && !frontendCollections.includes(hints.collection)) return null

  // 1. Fast path when preview hints include document ID + collection
  if (hints.documentId && hints.collection) {
    const byId = await loadDocumentById(req, hints.collection, hints.documentId)
    if (!byId) return null
    return prepareDraftResponse({
      req,
      uri,
      collection: hints.collection,
      document: byId,
    })
  }

  // 2. Attempt lookup via URI index (covers published documents)
  const indexDoc = await findIndexEntryByURI(payload, uri)
  if (indexDoc && frontendCollections.includes(indexDoc.sourceCollection)) {
    const document = await loadDocumentById(
      req,
      indexDoc.sourceCollection,
      indexDoc.documentId
    )
    if (!document) {
      return null
    }

    await ensureTemplateSections({
      req,
      collection: indexDoc.sourceCollection,
      document,
      templateId: indexDoc.templateId,
    })

    return {
      document,
      uriIndex: {
        ...indexDoc,
        breadcrumbs: await generateBreadcrumbsSafe({
          req,
          collection: indexDoc.sourceCollection,
          document,
        }),
      },
    }
  }

  // 3. Fall back to querying frontend collections directly for drafts
  const collectionsToSearch = await determineCollectionSearchOrder(hints.collection)

  for (const collection of collectionsToSearch) {
    const document = await loadDocumentByURI(req, collection, uri)
    if (document) {
      return prepareDraftResponse({
        req,
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

async function loadDocumentById(req: PayloadRequest, collection: string, id: string) {
  try {
    const document = await req.payload.findByID({
      req,
      collection: collection as any,
      id,
      draft: true,
      depth: 5,
      overrideAccess: false,
    })

    return document || null
  } catch {
    return null
  }
}

async function loadDocumentByURI(req: PayloadRequest, collection: string, uri: string) {
  try {
    const result = await req.payload.find({
      req,
      collection: collection as any,
      where: { uri: { equals: uri } },
      draft: true,
      depth: 5,
      limit: 1,
      pagination: false,
      overrideAccess: false,
    })

    return result.docs?.[0] || null
  } catch {
    return null
  }
}

async function determineCollectionSearchOrder(priorityCollection?: string) {
  const frontendCollections = (await getFrontendCollections()).map(
    collection => collection.slug
  )

  if (!priorityCollection) {
    return frontendCollections
  }

  const ordered = new Set<string>([priorityCollection, ...frontendCollections])
  return Array.from(ordered)
}

async function prepareDraftResponse({
  req,
  uri,
  collection,
  document,
}: {
  req: PayloadRequest
  uri: string
  collection: string
  document: any
}): Promise<DraftModeResult | null> {
  if (!document) {
    return null
  }

  const templateId = await ensureTemplateSections({
    req,
    collection,
    document,
  })

  const breadcrumbs = await generateBreadcrumbsSafe({
    req,
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
  req,
  collection,
  document,
  templateId,
}: {
  req: PayloadRequest
  collection: string
  document: any
  templateId?: string | null
}): Promise<string | null | undefined> {
  const hasSections = Array.isArray(document.sections) && document.sections.length > 0
  if (hasSections) return templateId

  // Payload normalizes a denied blocks field to []. Check its native permission
  // before treating that value as an empty field eligible for a template.
  const fields =
    req.payload.collections[collection as keyof typeof req.payload.collections]?.config
      .flattenedFields ?? []
  const sectionsField = fields.find(field => "name" in field && field.name === "sections")
  if (sectionsField && "access" in sectionsField && sectionsField.access?.read) {
    try {
      const allowed = await sectionsField.access.read({
        req,
        id: document.id,
        doc: document,
        data: document,
        siblingData: document,
      })
      if (!allowed) return null
    } catch {
      return null
    }
  }

  let resolvedTemplateId =
    templateId ??
    extractTemplateIdFromDocument(document) ??
    (await getTemplateIdForCollection(collection, req.payload, req))

  if (!resolvedTemplateId) {
    return null
  }

  try {
    const template = await req.payload.findByID({
      req,
      collection: "templates",
      id: resolvedTemplateId,
      draft: false,
      depth: 2,
      overrideAccess: false,
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
  req,
  collection,
  document,
}: {
  req: PayloadRequest
  collection: string
  document: any
}) {
  try {
    return await routingEngine.generateBreadcrumbs({
      req,
      enforceAccess: true,
      collection,
      slug: document.slug,
      data: document,
    })
  } catch {
    return []
  }
}
