/*************************************************************************/
/*  PAYLOAD ID UTILITIES
/*
/*  Simple utility functions for handling Payload CMS IDs across different databases.
/*  MongoDB uses string ObjectIds, PostgreSQL uses integer IDs.
/*  These utilities provide consistent ID handling without overengineering.
/*************************************************************************/

/**
 * Format an ID for storage in text fields (like documentId in URI index)
 * Always returns a string for consistent text storage
 */
export function formatIdForText(id: string | number): string {
  return String(id)
}

/**
 * Format an ID for relationship fields
 * Returns the ID as-is since Payload handles the conversion automatically
 */
export function formatIdForRelationship(id: string | number): string | number {
  return id
}

/**
 * Check if we're using PostgreSQL (vs MongoDB)
 * Uses environment variables for simple detection
 */
export function isPostgreSQL(): boolean {
  return process.env.DATABASE_PROVIDER !== "mongoose"
}

/**
 * Extract ID from a document object safely
 * Handles both MongoDB (_id) and PostgreSQL (id) formats
 */
export function extractDocumentId(doc: any): string | number {
  return doc?.id || doc?._id || doc
}

/**
 * Extract multiple IDs from document array safely
 */
export function extractDocumentIds(docs: any[]): (string | number)[] {
  return docs.map(extractDocumentId)
}
