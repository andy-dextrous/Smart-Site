"use client"

import type { ReactNode } from "react"

import { useChatAuthStatus } from "@/admin/components/chat-panel/use-chat-auth-status"
import { useAIContext } from "@/admin/payload/components/providers/ai-provider-client"

import { WorkspaceProvider } from "./workspace-provider"

interface WorkspaceGateProps {
  children: ReactNode
}

export function WorkspaceGate({ children }: WorkspaceGateProps) {
  const { isEnabled, status: workspaceStatus } = useAIContext()
  const { status: authStatus } = useChatAuthStatus(isEnabled)

  const canRenderWorkspace = isEnabled && workspaceStatus === "active" && authStatus === "authenticated"

  if (!canRenderWorkspace) {
    return <>{children}</>
  }

  return <WorkspaceProvider scope="frontend">{children}</WorkspaceProvider>
}
