import { PostgresStore } from "@mastra/pg"
import { PgVector } from "@mastra/pg"

/*************************************************************************/
/*  SHARED DATABASE CONFIGURATION - MASTRA RECOMMENDED PATTERN
/*************************************************************************/

const connectionString = process.env.POSTGRES_URL!

export const postgresStore = new PostgresStore({
  connectionString,
  schemaName: "mastra",
})

export const vectorStore = new PgVector({
  connectionString,
  schemaName: "mastra",
})

/*************************************************************************/
/*  VECTOR STORE INITIALIZATION
/*************************************************************************/

export async function initializeVectorStore() {
  try {
    await vectorStore.createIndex({
      indexName: "document_embeddings",
      dimension: 1536,
      metric: "cosine",
      indexConfig: {
        type: "hnsw",
        hnsw: {
          m: 16,
          efConstruction: 64,
        },
      },
    })

    console.log("✅ Vector store initialized successfully")
  } catch (error) {
    if (error instanceof Error && !error.message.includes("already exists")) {
      console.error("❌ Failed to initialize vector store:", error)
      throw error
    }
    console.log("✅ Vector store index already exists")
  }
}

/*************************************************************************/
/*  VECTOR OPERATIONS
/*************************************************************************/

export async function upsertDocuments(
  documents: Array<{
    id: string
    content: string
    embedding: number[]
    metadata?: Record<string, any>
  }>
) {
  const vectors = documents.map(doc => doc.embedding)
  const metadata = documents.map(doc => ({
    id: doc.id,
    content: doc.content,
    ...doc.metadata,
  }))
  const ids = documents.map(doc => doc.id)

  return await vectorStore.upsert({
    indexName: "document_embeddings",
    vectors,
    metadata,
    ids,
  })
}

export async function searchSimilarDocuments(
  queryEmbedding: number[],
  options: {
    topK?: number
    filter?: Record<string, any>
    minScore?: number
  } = {}
) {
  return await vectorStore.query({
    indexName: "document_embeddings",
    queryVector: queryEmbedding,
    topK: options.topK || 10,
    filter: options.filter,
    minScore: options.minScore || 0.7,
    includeVector: false,
  })
}
