"use client"

import { getSmartSiteConfig } from "@/admin/config"
import React, { createContext, useCallback, useContext, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"

/*************************************************************************/
/*  AI PROVIDER - CONSOLIDATED AI FUNCTIONALITY
/*************************************************************************/

interface AIContextType {
  isEnabled: boolean
  isChatOpen: boolean
  toggleChat: () => void
  closeChat: () => void
  openChat: () => void
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const enabled = getSmartSiteConfig().features.ai.enabled

  const toggleChat = useCallback(() => {
    if (!enabled) return // Prevent toggling when disabled
    setIsChatOpen(prev => !prev)
  }, [enabled])

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
  }, [])

  const openChat = useCallback(() => {
    if (!enabled) return // Prevent opening when disabled
    setIsChatOpen(true)
  }, [enabled])

  // Only register hotkeys when AI is enabled
  useHotkeys("meta+l", toggleChat, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
    enabled: enabled, // Disable hotkey when AI is disabled
  })

  const contextValue: AIContextType = {
    isEnabled: enabled,
    isChatOpen,
    toggleChat,
    closeChat,
    openChat,
  }

  return (
    <AIContext.Provider value={contextValue}>
      <div id="smart-site-admin" className="flex h-full w-full flex-col">
        {children}
      </div>
    </AIContext.Provider>
  )
}

/*************************************************************************/
/*  AI CONTEXT HOOK
/*************************************************************************/

export function useAIContext() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error("useAIContext must be used within an AIProvider")
  }
  return context
}
