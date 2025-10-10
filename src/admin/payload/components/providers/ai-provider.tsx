/*************************************************************************/
/*  SMART SITE AI PROVIDER (SERVER WRAPPER)
/*************************************************************************/

import type { ReactNode } from "react"
import { getAIBackendStatus } from "@/admin/lib/ai/status"
import { AIProviderClient, useAIContext } from "./ai-provider-client"

interface AIProviderProps {
  children: ReactNode
  withContainer?: boolean
}

export async function AIProvider({ children, withContainer = true }: AIProviderProps) {
  const status = await getAIBackendStatus()
  return (
    <AIProviderClient enabled={status.enabled} reason={status.reason} withContainer={withContainer}>
      {children}
    </AIProviderClient>
  )
}

export { useAIContext }
