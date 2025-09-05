"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { getMastraClient, isAIEnabled } from "@/admin/ai/mastra-client"
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

  const getAgent = useCallback(
    (agentId: string) => {
      if (!enabled || !client) {
        return null
      }
      return client.getAgent(agentId)
    },
    [client, enabled]
  )

  // Only register hotkeys when AI is enabled
  useHotkeys("meta+l", toggleChat, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
    enabled: enabled, // Disable hotkey when AI is disabled
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
