"use client"

import { Sparkles } from "lucide-react"

import { useWorkspaceOptional } from "@/admin/components/workspace/workspace-provider"
import { useAIContext } from "@/admin/payload/components/providers/ai-provider-client"

export function WorkspaceToggle() {
  const { isEnabled, status } = useAIContext()
  const workspace = useWorkspaceOptional()

  if (!workspace || !isEnabled || status !== "active") {
    return null
  }

  const { isActive, toggleWorkspace, isAvailable } = workspace

  if (!isAvailable) {
    return null
  }

  return (
    <button
      aria-pressed={isActive}
      className={`admin-bar__workspace-button${isActive ? " admin-bar__workspace-button--active" : ""}`}
      onClick={toggleWorkspace}
      type="button"
    >
      <Sparkles aria-hidden className="admin-bar__workspace-button-icon" />
      {isActive ? "Exit AI Workspace" : "AI Workspace"}
    </button>
  )
}
