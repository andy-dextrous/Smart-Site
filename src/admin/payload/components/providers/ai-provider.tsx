/*************************************************************************/
/*  SMART SITE AI PROVIDER (SERVER WRAPPER)
/*************************************************************************/

import type { ReactNode } from "react"
import { getAIBackendStatus } from "@/admin/lib/ai/status"
import { AIProviderClient, useAIContext } from "./ai-provider-client"

interface AIProviderProps {
  children: ReactNode
}

export async function AIProvider({ children }: AIProviderProps) {
  const status = await getAIBackendStatus()
  return <AIProviderClient enabled={status.enabled} reason={status.reason}>{children}</AIProviderClient>
}

export { useAIContext }
