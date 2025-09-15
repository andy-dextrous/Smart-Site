"use client"

import { useEffect } from "react"
import { ChatThreadsProvider, useChatThreadsContext } from "@/admin/components/chat-panel/chat-threads-provider"
import { ActiveChatRuntime } from "@/admin/components/chat-panel/active-chat-runtime"
import { ChatResize } from "@/admin/components/chat-panel/chat-resize"
import { ChatHeaderTabs } from "@/admin/components/chat-panel/chat-header-tabs"
import { ChatMessages } from "@/admin/components/chat-panel/chat-messages"
import { ChatInput } from "@/admin/components/chat-panel/chat-input"
import { Tabs, TabsContent } from "@/admin/components/ui/tabs"

/*************************************************************************/
/*  CHAT PANEL CORE - PROVIDER-SCOPED, SURFACE-AGNOSTIC
/*************************************************************************/

/**
 * Component props
 */
interface ChatPanelCoreProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatPanelCore({ isOpen, onClose }: ChatPanelCoreProps) {
  return (
    <ChatThreadsProvider isOpen={isOpen}>
      <ActiveChatRuntime />
      {isOpen && <ChatPanelInner onClose={onClose} />}
    </ChatThreadsProvider>
  )
}

function ChatPanelInner({ onClose }: { onClose: () => void }) {
  const {
    threads,
    openTabs,
    activeThreadId,
    getThreadMessages,
    getThreadStatus,
    getDisplayTitle,
    switchThread,
    onNewThread,
    closeTab,
    deleteThread,
    sendMessage,
    regenerate,
  } = useChatThreadsContext()

  useEffect(() => {
    const active = threads.find(t => t.id === activeThreadId)
    const title = `${getDisplayTitle(active)} - Smart Site`
    if (typeof document !== "undefined") {
      document.title = title
    }
  }, [activeThreadId, threads, getDisplayTitle])

  const currentValue = activeThreadId || openTabs[0]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="animate-in fade-in-0 absolute inset-0 bg-black/50" onClick={onClose} />
      <ChatResize>
        <Tabs value={currentValue} defaultValue={openTabs[0]} onValueChange={switchThread} className="flex h-full flex-col">
          <ChatHeaderTabs
            threads={threads}
            openTabs={openTabs}
            activeThreadId={activeThreadId}
            onSelect={switchThread}
            onCloseTab={closeTab}
            onDeleteThread={deleteThread}
            hasMessages={(id: string) => (getThreadMessages(id) || []).length > 0}
            onNewThread={onNewThread}
            getDisplayTitle={getDisplayTitle}
            onClosePanel={onClose}
          />

          {/* Tab panels: each mounts messages+input for its thread; forceMount keeps state */}
          <div className="flex min-h-0 flex-1">
            {openTabs.map(tid => {
              const msgs = getThreadMessages(tid)
              const st = getThreadStatus(tid)
              return (
                <TabsContent key={tid} value={tid} forceMount className="flex min-h-0 flex-1 flex-col">
                  <ChatMessages
                    messages={msgs}
                    status={st}
                    regenerate={regenerate}
                    onQuickSend={text => sendMessage({ text })}
                  />
                  <ChatInput
                    status={st}
                    onSubmit={m => sendMessage({ text: m.text || "Sent with attachments", files: m.files })}
                  />
                </TabsContent>
              )
            })}
          </div>
        </Tabs>
      </ChatResize>
    </div>
  )
}
