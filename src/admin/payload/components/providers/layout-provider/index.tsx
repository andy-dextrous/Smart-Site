"use client"

import { usePathname } from "next/navigation"
import React from "react"
import { ChatPanel } from "../../../../components/chat-panel"
import { AppSidebar } from "./app-sidebar"
import { TopNavigation } from "./top-navigation"
import { useAIContext } from "../ai-provider"
import { Button } from "@/admin/components/ui/button"
import { Sparkles } from "lucide-react"

/*************************************************************************/
/*  AI LAYOUT PROVIDER - CLIENT COMPONENT WITH CHAT STATE
/*************************************************************************/

export function AILayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { toggleChat, isChatOpen, isEnabled } = useAIContext()

  const isLogin = pathname === "/admin/login"

  return !isLogin ? (
    <div className="bg-admin-950 flex h-screen max-h-screen flex-col">
      <TopNavigation />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="bg-admin-900 h-full flex-1 overflow-y-auto">{children}</main>
      </div>
      {/* Only render chat panel if AI is enabled */}
      {isEnabled && <ChatPanel />}
      
      {/* Only show chat button if AI is enabled and chat is closed */}
      {isEnabled && !isChatOpen && (
        <Button
          variant="secondary"
          size="icon-round-lg"
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-40 shadow-lg hover:shadow-xl transition-shadow"
          title="Smart Site Assistant (⌘L)"
        >
          <Sparkles />
        </Button>
      )}
    </div>
  ) : (
    <>{children}</>
  )
}
