"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import {
  ChatThreadsProvider,
  useChatThreadsContext,
} from "@/admin/components/chat-panel/chat-threads-provider"
import { ActiveChatRuntime } from "@/admin/components/chat-panel/active-chat-runtime"
import { ChatHeaderTabs } from "@/admin/components/chat-panel/chat-header-tabs"
import { ChatMessages } from "@/admin/components/chat-panel/chat-messages"
import { ChatInput } from "@/admin/components/chat-panel/chat-input"
import { injectChatStyles } from "@/admin/components/chat-panel/chat-styles"

interface WorkspaceSidebarProps {
  scope: "admin" | "frontend"
  onClose: () => void
}

export function WorkspaceSidebar({ scope, onClose }: WorkspaceSidebarProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null)

  const attachHost = useCallback((node: HTMLDivElement | null) => {
    hostRef.current = node
    if (!node) {
      setPortalTarget(null)
      return
    }

    const shadow = node.shadowRoot ?? node.attachShadow({ mode: "open" })
    injectChatStyles(shadow)

    let root = shadow.getElementById("workspace-sidebar-root") as HTMLDivElement | null
    if (!root) {
      root = document.createElement("div")
      root.id = "workspace-sidebar-root"
      shadow.appendChild(root)
    }

    root.className = "workspace-chat-root"
    root.setAttribute("data-chat-panel-root", "")
    root.setAttribute("data-theme", "dark")

    setPortalTarget(current => (current === root ? current : root))
  }, [])

  return (
    <div ref={attachHost} className="workspace-shell__sidebar-host">
      {portalTarget
        ? createPortal(
            <ChatThreadsProvider isOpen scope={scope}>
              <ActiveChatRuntime />
              <WorkspaceSidebarContent onClose={onClose} />
            </ChatThreadsProvider>,
            portalTarget
          )
        : null}
    </div>
  )
}

function WorkspaceSidebarContent({ onClose }: { onClose: () => void }) {
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

  const hasTabs = openTabs.length > 0
  const currentValue = hasTabs ? activeThreadId || openTabs[0] : undefined
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [focusSignal, setFocusSignal] = useState(1)
  const tabsValue = currentValue
  const handleFocusTick = useCallback(() => {
    setFocusSignal(previous => previous + 1)
  }, [])

  useEffect(() => {
    if (!panelRef.current) {
      return
    }
    panelRef.current.setAttribute("data-theme", "dark")
  }, [])

  return (
    <div ref={panelRef} className="workspace-chat-surface">
      {!hasTabs ? (
        <div className="workspace-chat-empty">Preparing your copilot…</div>
      ) : (
        <TabsPrimitive.Root
          className="chat-panel chat-panel--workspace"
          value={tabsValue}
          defaultValue={openTabs[0]}
          onValueChange={value => {
            if (value) {
              switchThread(value)
              handleFocusTick()
            }
          }}
        >
          <ChatHeaderTabs
            threads={threads}
            openTabs={openTabs}
            activeThreadId={activeThreadId}
            onSelect={switchThread}
            onCloseTab={closeTab}
            onDeleteThread={deleteThread}
            hasMessages={(id: string) => (getThreadMessages(id) || []).length > 0}
            onNewThread={async () => {
              await onNewThread()
              handleFocusTick()
            }}
            getDisplayTitle={getDisplayTitle}
            onClosePanel={onClose}
          />
          <div className="chat-panel__body">
            {openTabs.map(threadId => {
              const messages = getThreadMessages(threadId)
              const state = getThreadStatus(threadId)
              const isThreadActive = threadId === tabsValue
              return (
                <TabsPrimitive.Content
                  key={threadId}
                  className="chat-panel__content"
                  value={threadId}
                  forceMount
                >
                  <div className="chat-panel__scroll-region">
                    <ChatMessages
                      messages={messages}
                      status={state}
                      regenerate={regenerate}
                      onQuickSend={text => sendMessage({ text })}
                      focusSignal={focusSignal}
                      isActive={isThreadActive}
                    />
                  </div>
                  <ChatInput
                    focusSignal={focusSignal}
                    isActive={isThreadActive}
                    status={state}
                    onSubmit={payload =>
                      sendMessage({
                        text: payload.text || "Sent with attachments",
                        files: payload.files,
                      })
                    }
                  />
                </TabsPrimitive.Content>
              )
            })}
          </div>
        </TabsPrimitive.Root>
      )}
    </div>
  )
}
