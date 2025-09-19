"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"

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
}

export function AIProviderClient({ children, enabled, reason }: AIProviderClientProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const toggleChat = useCallback(() => {
    if (!enabled) return
    setIsChatOpen(prev => !prev)
  }, [enabled])

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
  }, [])

  const openChat = useCallback(() => {
    if (!enabled) return
    setIsChatOpen(true)
  }, [enabled])

  useHotkeys("meta+l", toggleChat, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
    enabled,
  })

  const contextValue = useMemo<AIContextType>(() => ({
    isEnabled: enabled,
    statusReason: reason,
    isChatOpen,
    toggleChat,
    closeChat,
    openChat,
  }), [enabled, reason, isChatOpen, toggleChat, closeChat, openChat])

  return (
    <AIContext.Provider value={contextValue}>
      <div id="smart-site-admin" className="flex h-full w-full flex-col">
        {children}
      </div>
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
