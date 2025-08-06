import { MastraClient } from "@mastra/client-js"
import smartSiteConfig from "@/smartsite.config"

/*************************************************************************/
/*  MASTRA CLIENT - CONNECTS TO REMOTE AI SERVER
/*************************************************************************/

let mastraClient: MastraClient | null = null

export function getMastraClient(): MastraClient | null {
  const { ai } = smartSiteConfig.settings

  // If AI is disabled, return null
  if (!ai || (typeof ai === "object" && !ai.enabled)) {
    return null
  }

  // If client is already initialized, return it
  if (mastraClient) {
    return mastraClient
  }

  // Get server URL from config or use default
  let serverUrl = "http://localhost:4112" // Default fallback

  if (typeof ai === "object" && ai.url) {
    serverUrl = ai.url
  }

  // Prepare headers with JWT authentication and site identification
  const headers: Record<string, string> = {}
  
  // Include JWT token if available
  if (process.env.MASTRA_JWT_TOKEN) {
    headers.Authorization = `Bearer ${process.env.MASTRA_JWT_TOKEN}`
  }
  
  // Include Site ID for multi-tenant data isolation
  if (process.env.SMART_SITE_ID) {
    headers["X-Site-ID"] = process.env.SMART_SITE_ID
  }

  // Initialize client
  mastraClient = new MastraClient({
    baseUrl: serverUrl,
    headers,
    retries: 3,
    backoffMs: 300,
    maxBackoffMs: 5000,
  })

  return mastraClient
}

/*************************************************************************/
/*  HELPER TO CHECK IF AI IS ENABLED
/*************************************************************************/

export function isAIEnabled(): boolean {
  const { ai } = smartSiteConfig.settings

  if (typeof ai === "boolean") {
    return ai
  }

  if (typeof ai === "object") {
    return ai.enabled !== false
  }

  return false
}

/*************************************************************************/
/*  HELPER TO GET CURRENT AI SERVER URL
/*************************************************************************/

export function getAIServerUrl(): string | null {
  const { ai } = smartSiteConfig.settings

  if (!ai || (typeof ai === "object" && !ai.enabled)) {
    return null
  }

  if (typeof ai === "object" && ai.url) {
    return ai.url
  }

  return "http://localhost:4112"
}

/*************************************************************************/
/*  HELPER TO GET SITE ID FOR MULTI-TENANCY
/*************************************************************************/

export function getSiteId(): string {
  // Return site ID from environment, or generate a default
  return process.env.SMART_SITE_ID || `site_${process.env.NEXT_PUBLIC_URL?.replace(/https?:\/\//, '').replace(/[^\w]/g, '_') || 'default'}`
}
