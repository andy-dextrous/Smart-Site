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
import { ChatExperienceMount } from "@/admin/components/chat-panel/chat-experience-mount"
import { isAuthBootstrapRoute } from "@/admin/payload/components/providers/provider-routes"

interface AIContextType {
  isEnabled: boolean
  statusReason: string | null
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
  withContainer?: boolean
}

export function AIProviderClient({ children, enabled, reason, withContainer = true }: AIProviderClientProps) {
  const pathname = usePathname()
  const bypassProviders = isAuthBootstrapRoute(pathname)

  if (bypassProviders) {
    return <>{children}</>
  }

  useEffect(() => {
    initializeChatStore()
  }, [])

  useEffect(() => {
    setChatAvailability(enabled, reason)
  }, [enabled, reason])

  const isChatOpen = useChatStore(state => state.isOpen)
  const isEnabled = useChatStore(state => state.isEnabled)
  const statusReason = useChatStore(state => state.statusReason)

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
    isChatOpen,
    toggleChat,
    closeChat,
    openChat,
  }), [isEnabled, statusReason, isChatOpen, toggleChat, closeChat, openChat])

  return (
    <AIContext.Provider value={contextValue}>
      {withContainer ? (
        <div id="smart-site-admin" className="flex h-full w-full flex-col">
          {children}
        </div>
      ) : (
        children
      )}
      <ChatExperienceMount scope={withContainer ? "admin" : "frontend"} />
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
