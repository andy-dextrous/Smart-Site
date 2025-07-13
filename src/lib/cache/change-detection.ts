import isEqual from "fast-deep-equal"

export interface ChangeDetection {
  uriChanged: boolean
  statusChanged: boolean
  contentChanged: boolean
  slugChanged: boolean
  parentChanged: boolean
  titleChanged: boolean
  oldUri?: string
  newUri?: string
  oldSlug?: string
  newSlug?: string
  oldParent?: string
  newParent?: string
  oldStatus?: string
  newStatus?: string
}

export interface CollectionChange {
  collection: string
  doc: any
  previousDoc?: any
  changes: ChangeDetection
  operation: "create" | "update" | "delete"
}

/*************************************************************************/
/*  CLEAN CHANGE DETECTION WITH SEPARATED OPERATION HANDLERS

    Replaces the complex single function with clean, focused handlers for
    each operation type. This eliminates the nested conditional logic and
    makes the code much easier to understand and maintain.
/*************************************************************************/

export function detectChanges(
  doc: any,
  previousDoc?: any,
  operation: "create" | "update" | "delete" = "update"
): ChangeDetection {
  switch (operation) {
    case "create":
      return detectCreateChanges(doc)
    case "update":
      return detectUpdateChanges(doc, previousDoc)
    case "delete":
      return detectDeleteChanges(previousDoc)
    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}

/*************************************************************************/
/*  CREATE OPERATION HANDLER
/*************************************************************************/

function detectCreateChanges(doc: any): ChangeDetection {
  return {
    uriChanged: false,
    statusChanged: false,
    contentChanged: true, // Always true for new documents
    slugChanged: false,
    parentChanged: false,
    titleChanged: false,
    newUri: doc.uri || (doc.slug ? `/${doc.slug}` : undefined),
    newSlug: doc.slug,
    newStatus: doc._status,
    newParent: doc.parent?.id || doc.parent,
  }
}

/*************************************************************************/
/*  UPDATE OPERATION HANDLER
/*************************************************************************/

function detectUpdateChanges(doc: any, previousDoc: any): ChangeDetection {
  if (!previousDoc) {
    throw new Error("Previous document required for update operation")
  }

  const changes: ChangeDetection = {
    uriChanged: false,
    statusChanged: false,
    contentChanged: false,
    slugChanged: false,
    parentChanged: false,
    titleChanged: false,
  }

  // Extract values for comparison
  const oldUri =
    previousDoc.uri || (previousDoc.slug ? `/${previousDoc.slug}` : undefined)
  const newUri = doc.uri || (doc.slug ? `/${doc.slug}` : undefined)
  const oldSlug = previousDoc.slug
  const newSlug = doc.slug
  const oldStatus = previousDoc._status
  const newStatus = doc._status
  const oldParent = previousDoc.parent?.id || previousDoc.parent
  const newParent = doc.parent?.id || doc.parent
  const oldTitle = previousDoc.title || previousDoc.name
  const newTitle = doc.title || doc.name

  // URI changes
  if (oldUri !== newUri) {
    changes.uriChanged = true
    changes.oldUri = oldUri
    changes.newUri = newUri
  }

  // Slug changes
  if (oldSlug !== newSlug) {
    changes.slugChanged = true
    changes.oldSlug = oldSlug
    changes.newSlug = newSlug
  }

  // Status changes
  if (oldStatus !== newStatus) {
    changes.statusChanged = true
    changes.oldStatus = oldStatus
    changes.newStatus = newStatus
  }

  // Parent changes (for hierarchical content)
  if (oldParent !== newParent) {
    changes.parentChanged = true
    changes.oldParent = oldParent
    changes.newParent = newParent
  }

  // Title changes (affects navigation display)
  if (oldTitle !== newTitle) {
    changes.titleChanged = true
  }

  // Content changes (deep comparison excluding system fields)
  if (hasContentChanges(doc, previousDoc)) {
    changes.contentChanged = true
  }

  return changes
}

/*************************************************************************/
/*  DELETE OPERATION HANDLER
/*************************************************************************/

function detectDeleteChanges(previousDoc: any): ChangeDetection {
  if (!previousDoc) {
    throw new Error("Previous document required for delete operation")
  }

  return {
    uriChanged: false,
    statusChanged: false,
    contentChanged: true, // Always true for deletions
    slugChanged: false,
    parentChanged: false,
    titleChanged: false,
    oldUri: previousDoc.uri || (previousDoc.slug ? `/${previousDoc.slug}` : undefined),
    oldSlug: previousDoc.slug,
    oldStatus: previousDoc._status,
    oldParent: previousDoc.parent?.id || previousDoc.parent,
  }
}

/*************************************************************************/
/*  CONTENT CHANGE DETECTION UTILITY
/*************************************************************************/

function hasContentChanges(doc: any, previousDoc: any): boolean {
  // Fields to exclude from content change detection
  const excludeFields = [
    "id",
    "_status",
    "createdAt",
    "updatedAt",
    "__v",
    "uri",
    "slug",
    "parent",
    "title",
    "name",
  ]

  const cleanDoc = { ...doc }
  const cleanPreviousDoc = { ...previousDoc }

  excludeFields.forEach(field => {
    delete cleanDoc[field]
    delete cleanPreviousDoc[field]
  })

  // Use secure deep comparison instead of vulnerable JSON.stringify
  return !isEqual(cleanDoc, cleanPreviousDoc)
}

/*************************************************************************/
/*  CHANGE IMPACT ANALYSIS
/*************************************************************************/

export function getChangeImpact(changes: ChangeDetection): {
  requiresURIRegeneration: boolean
  requiresCascadeOperation: boolean
  requiresNavigationUpdate: boolean
  requiresRedirect: boolean
  severity: "low" | "medium" | "high"
} {
  let severity: "low" | "medium" | "high" = "low"
  let requiresURIRegeneration = false
  let requiresCascadeOperation = false
  let requiresNavigationUpdate = false
  let requiresRedirect = false

  // High impact changes
  if (changes.uriChanged || changes.slugChanged) {
    severity = "high"
    requiresURIRegeneration = true
    requiresRedirect = true
  }

  if (changes.parentChanged) {
    severity = "high"
    requiresCascadeOperation = true
    requiresURIRegeneration = true
  }

  if (changes.statusChanged) {
    severity = "high"
    requiresNavigationUpdate = true
  }

  // Medium impact changes
  if (changes.titleChanged) {
    severity = severity === "low" ? "medium" : severity
    requiresNavigationUpdate = true
  }

  // Low impact (content only)
  if (
    changes.contentChanged &&
    !changes.uriChanged &&
    !changes.statusChanged &&
    !changes.slugChanged
  ) {
    severity = "low"
  }

  return {
    requiresURIRegeneration,
    requiresCascadeOperation,
    requiresNavigationUpdate,
    requiresRedirect,
    severity,
  }
}

/*************************************************************************/
/*  BATCH CHANGE ANALYSIS
/*************************************************************************/

export function analyzeBatchChanges(operations: CollectionChange[]): {
  totalChanges: number
  highImpactChanges: number
  cascadeOperationsNeeded: number
  collectionsAffected: string[]
  summary: string
} {
  const collectionsAffected = new Set<string>()
  let highImpactChanges = 0
  let cascadeOperationsNeeded = 0

  for (const operation of operations) {
    collectionsAffected.add(operation.collection)

    const impact = getChangeImpact(operation.changes)

    if (impact.severity === "high") {
      highImpactChanges++
    }

    if (impact.requiresCascadeOperation) {
      cascadeOperationsNeeded++
    }
  }

  const summary = `${operations.length} operations across ${collectionsAffected.size} collections: ${highImpactChanges} high-impact changes, ${cascadeOperationsNeeded} cascade operations needed`

  return {
    totalChanges: operations.length,
    highImpactChanges,
    cascadeOperationsNeeded,
    collectionsAffected: Array.from(collectionsAffected),
    summary,
  }
}
