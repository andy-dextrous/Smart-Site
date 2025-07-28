/*************************************************************************/
/*  CONTEXT MANAGEMENT UTILITIES
/*
/*  Shared utilities for managing hook context state
/*
/*  These utilities:
/*  - Manage dependent updates context across hooks
/*  - Handle job batching for background processing
/*  - Provide consistent context management patterns
/*  - Used by pages, templates, and global hooks
/*************************************************************************/

export function getDependentUpdatesContext(context: any): any[] {
  if (!context.dependentUpdates) {
    context.dependentUpdates = []
  }
  return context.dependentUpdates
}

export function clearDependentUpdatesContext(context: any): void {
  delete context.dependentUpdates
}

/*************************************************************************/
/*  OPERATION MERGING UTILITIES
/*************************************************************************/

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function mergeOperations(operations: any[]): any[] {
  const operationMap = new Map<string, any>()

  for (const operation of operations) {
    const key = `${operation.operation}-${operation.entityId}`

    if (operationMap.has(key)) {
      // Merge additional data for same operation
      const existing = operationMap.get(key)!
      existing.additionalData = mergeAdditionalData(
        existing.additionalData,
        operation.additionalData
      )
    } else {
      operationMap.set(key, operation)
    }
  }

  return Array.from(operationMap.values())
}

function mergeAdditionalData(existing: any, incoming: any): any {
  if (!existing && !incoming) return undefined
  if (!existing) return incoming
  if (!incoming) return existing

  return {
    ...existing,
    ...incoming,
    // Merge arrays
    affectedCollections: [
      ...(existing.affectedCollections || []),
      ...(incoming.affectedCollections || []),
    ].filter((v, i, a) => a.indexOf(v) === i), // Dedupe

    templateChanges: [
      ...(existing.templateChanges || []),
      ...(incoming.templateChanges || []),
    ].filter((v, i, a) => a.findIndex(x => x.collection === v.collection) === i), // Dedupe by collection
  }
}

/*************************************************************************/
/*  BATCHED JOB QUEUE MANAGEMENT
/*************************************************************************/

export async function queueDependentUpdatesJob(
  dependentUpdates: any[],
  payload: any
): Promise<void> {
  if (dependentUpdates.length === 0) {
    return
  }

  // Merge overlapping operations
  const mergedOps = mergeOperations(dependentUpdates)

  // Create single job with all operations
  const job = await payload.jobs.queue({
    task: "dependent-uri-updates",
    input: {
      operations: mergedOps,
      requestId: generateRequestId(),
      batchedAt: new Date().toISOString(),
    },
  })

  const result = await payload.jobs.runByID({ id: job.id! })

  payload.logger.info(
    `Successfully processed batched dependent updates: ${mergedOps.length} operations, request ID: ${job.input.requestId}`
  )

  return result
}
