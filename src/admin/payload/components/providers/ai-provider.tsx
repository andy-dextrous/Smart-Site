"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { getMastraClient, isAIEnabled } from "@/admin/lib/mastra-client"
import type { MastraClient } from "@mastra/client-js"

/*************************************************************************/
/*  AI PROVIDER - CONSOLIDATED AI FUNCTIONALITY
/*************************************************************************/

interface AIContextType {
  // Connection status
  isConnected: boolean
  isEnabled: boolean

  // Mastra client
  client: MastraClient | null
  getAgent: (agentId: string) => any

  // Chat panel state
  isChatOpen: boolean
  toggleChat: () => void
  closeChat: () => void
  openChat: () => void
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Get Mastra client and status
  const client = getMastraClient()
  const enabled = isAIEnabled()

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev)
  }, [])

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
  }, [])

  const openChat = useCallback(() => {
    setIsChatOpen(true)
  }, [])

  const getAgent = useCallback((agentId: string) => {
    if (!enabled || !client) {
      return null
    }
    return client.getAgent(agentId)
  }, [client, enabled])

  useHotkeys("meta+l", toggleChat, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  })

  const contextValue: AIContextType = {
    isConnected: enabled && client !== null,
    isEnabled: enabled,
    client,
    getAgent,
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
