"use client"

import { useEffect } from "react"

import { useAIContext } from "../../payload/components/providers/ai-provider"
import { ChatPanelCore } from "@/admin/components/chat-panel/chat-panel-core"
import { injectChatStyles } from "@/admin/components/chat-panel/chat-styles"

/*************************************************************************/
/*  CHAT PANEL (ADMIN WRAPPER)
/*************************************************************************/

export function ChatPanel() {
  const { isChatOpen, closeChat } = useAIContext()
  useEffect(() => {
    if (typeof document === "undefined") return
    injectChatStyles(document)
  }, [])
  return <ChatPanelCore isOpen={isChatOpen} onClose={closeChat} />
}
