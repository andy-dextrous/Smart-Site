"use client"

import { useAIContext } from "../../payload/components/providers/ai-provider"
import { ChatPanelCore } from "@/admin/components/chat-panel/chat-panel-core"

/*************************************************************************/
/*  CHAT PANEL (ADMIN WRAPPER)
/*************************************************************************/

export function ChatPanel() {
  const { isChatOpen, closeChat } = useAIContext()
  return <ChatPanelCore isOpen={isChatOpen} onClose={closeChat} />
}

