"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { useHotkeys } from "react-hotkeys-hook"

/*************************************************************************/
/*  AI PROVIDER - CONSOLIDATED AI FUNCTIONALITY
/*************************************************************************/

interface AIContextType {
  // Connection status
  isConnected: boolean

  // Chat panel state
  isChatOpen: boolean
  toggleChat: () => void
  closeChat: () => void
  openChat: () => void

  // Future: agent, tools, memory, etc.
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev)
  }, [])

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
  }, [])

  const openChat = useCallback(() => {
    setIsChatOpen(true)
  }, [])

  useHotkeys("meta+l", toggleChat, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  })

  const contextValue: AIContextType = {
    isConnected: false,
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
