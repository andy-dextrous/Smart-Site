"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import { useHotkeys } from "react-hotkeys-hook"
import {
  closeChatPanel,
  initializeChatStore,
  openChatPanel,
  setChatAvailability,
  toggleChatOpen,
  useChatStore,
} from "@/admin/components/chat-panel/chat-store"
import { isAuthBootstrapRoute } from "@/admin/payload/components/providers/provider-routes"
import type { AIWorkspaceState } from "@/admin/lib/ai/status"

interface AIContextType {
  isEnabled: boolean
  statusReason: string | null
  status: AIWorkspaceState | null
  isChatOpen: boolean
  toggleChat: () => void
  closeChat: () => void
  openChat: () => void
}

const AIContext = createContext<AIContextType | undefined>(undefined)

interface AIProviderClientProps {
  children: React.ReactNode
  enabled: boolean
  reason: string | null
  status: AIWorkspaceState
  withContainer?: boolean
}

export function AIProviderClient({ children, enabled, reason, status: workspaceStatus, withContainer = true }: AIProviderClientProps) {
  const pathname = usePathname()
  const bypassProviders = isAuthBootstrapRoute(pathname)

  if (bypassProviders) {
    return <>{children}</>
  }

  return (
    <AIProviderRuntime
      enabled={enabled}
      reason={reason}
      status={workspaceStatus}
      withContainer={withContainer}
    >
      {children}
    </AIProviderRuntime>
  )
}

interface AIProviderRuntimeProps {
  children: React.ReactNode
  enabled: boolean
  reason: string | null
  status: AIWorkspaceState
  withContainer: boolean
}

function AIProviderRuntime({ children, enabled, reason, status: workspaceStatus, withContainer }: AIProviderRuntimeProps) {
  useEffect(() => {
    initializeChatStore()
  }, [])

  useEffect(() => {
    setChatAvailability(enabled, reason, workspaceStatus)
  }, [enabled, reason, workspaceStatus])

  const isChatOpen = useChatStore(state => state.isOpen)
  const isEnabled = useChatStore(state => state.isEnabled)
  const statusReason = useChatStore(state => state.statusReason)
  const status = useChatStore(state => state.status)

  const toggleChat = useCallback(() => {
    if (!isEnabled) return
    toggleChatOpen()
  }, [isEnabled])

  const closeChat = useCallback(() => {
    closeChatPanel()
  }, [])

  const openChat = useCallback(() => {
    if (!isEnabled) return
    openChatPanel()
  }, [isEnabled])

  useHotkeys(
    "meta+l",
    event => {
      event.preventDefault()
      if (!isEnabled) return
      if (typeof window !== "undefined") {
        const global = window as typeof window & {
          __smartSiteWorkspaceToggle?: () => void
        }
        if (global.__smartSiteWorkspaceToggle) {
          global.__smartSiteWorkspaceToggle()
          return
        }
      }
      if (typeof document !== "undefined" && document.documentElement.dataset.workspaceShell === "active") {
        return
      }
      toggleChatOpen()
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      enabled: isEnabled,
      preventDefault: true,
    },
    [isEnabled]
  )

  const contextValue = useMemo<AIContextType>(() => ({
    isEnabled,
    statusReason,
    status,
    isChatOpen,
    toggleChat,
    closeChat,
    openChat,
  }), [isEnabled, statusReason, status, isChatOpen, toggleChat, closeChat, openChat])

  return (
    <AIContext.Provider value={contextValue}>
      {withContainer ? (
        <div id="smart-site-admin" className="flex h-full w-full flex-col">
          {children}
        </div>
      ) : (
        children
      )}
    </AIContext.Provider>
  )
}

export function useAIContext() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error("useAIContext must be used within an AIProvider")
  }
  return context
}
