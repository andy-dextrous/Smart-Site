import { smartSiteAI } from "./index"

/*************************************************************************/
/*  AI UTILITY FUNCTIONS
/*************************************************************************/

export async function getAIStatus() {
  const agents = smartSiteAI.getAgents()
  const workflows = smartSiteAI.getWorkflows()

  // Detect storage type from Mastra instance
  const storage = smartSiteAI.storage
  let storageType = "unknown"

  if (storage?.constructor?.name === "PostgresStore") {
    storageType = "postgresql"
  } else if (storage?.constructor?.name === "LibSQLStore") {
    storageType = "libsql"
  } else if (storage?.constructor?.name === "MemoryStore") {
    storageType = "memory"
  }

  // Test storage connection
  let storageStatus = "unknown"
  try {
    if (storage && typeof storage.init === "function") {
      await storage.init()
      storageStatus = "connected"
    }
  } catch (error) {
    storageStatus = "error"
    console.error("Storage connection error:", error)
  }

  return {
    status: "ready",
    storage: {
      type: storageType,
      status: storageStatus,
    },
    agents: Object.keys(agents).length,
    workflows: Object.keys(workflows).length,
  }
}
