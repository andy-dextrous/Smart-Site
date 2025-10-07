"use client"

import { forwardRef, useEffect, useMemo, useRef, useState } from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  ChatThreadsProvider,
  useChatThreadsContext,
} from "@/admin/components/chat-panel/chat-threads-provider"
import { ActiveChatRuntime } from "@/admin/components/chat-panel/active-chat-runtime"
import { ChatResize } from "@/admin/components/chat-panel/chat-resize"
import { ChatHeaderTabs } from "@/admin/components/chat-panel/chat-header-tabs"
import { ChatMessages } from "@/admin/components/chat-panel/chat-messages"
import { ChatInput } from "@/admin/components/chat-panel/chat-input"
import { getDocumentTheme } from "@/admin/components/chat-panel/get-document-theme"
import { cn } from "@/admin/utilities/ui"

interface ChatPanelCoreProps {
  isOpen: boolean
  onClose: () => void
  scope: "admin" | "frontend"
  renderContent?: boolean
}

export const chatOverlayStyles = /* css */ `
.chat-backdrop {
  position: fixed;
  inset: 0;
  background: var(--chat-color-overlay);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.chat-backdrop[data-state="open"] {
  opacity: 1;
}

.chat-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.chat-overlay[data-state="open"] {
  pointer-events: auto;
  opacity: 1;
}
`

export const chatPanelShellStyles = /* css */ `
.chat-panel {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 100%;
  max-height: 100%;
  background: var(--chat-color-layer-0);
  border-radius: var(--chat-radius-lg);
  border: 1px solid var(--chat-color-border);
  box-shadow: var(--chat-shadow-lg);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  transform: translateY(12px);
  opacity: 0;
  transition: transform 0.25s ease, opacity 0.25s ease;
  overflow: hidden;
}

.chat-overlay[data-state="open"] .chat-panel {
  transform: translateY(0);
  opacity: 1;
}

.chat-panel__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: transparent;
  color: var(--chat-color-text-primary);
}

.chat-panel__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
  overflow: hidden !important;
}

.chat-panel__content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  position: relative;
  overflow: hidden !important;
  overscroll-behavior: contain;
}

.chat-panel__content[data-state="inactive"] {
  display: none;
}

.chat-panel__scroll-region {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
`

export function ChatPanelCore({
  isOpen,
  onClose,
  scope,
  renderContent = true,
}: ChatPanelCoreProps) {
  return (
    <ChatThreadsProvider isOpen={isOpen} scope={scope}>
      <ActiveChatRuntime />
      {renderContent ? (
        <DialogPrimitive.Root
          modal
          open={isOpen}
          onOpenChange={open => !open && onClose()}
        >
          <ChatPanelInner isOpen={isOpen} onClose={onClose} />
        </DialogPrimitive.Root>
      ) : null}
    </ChatThreadsProvider>
  )
}

function ChatPanelInner({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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

  const currentValue = activeThreadId || openTabs[0]
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null)
  const [focusSignal, setFocusSignal] = useState(0)
  const lastFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }
    const applyTheme = () => {
      if (!panelRef.current) {
        return false
      }
      panelRef.current.dataset.theme = getDocumentTheme()
      return true
    }
    let frame: number | null = null
    if (!applyTheme()) {
      frame = requestAnimationFrame(() => {
        applyTheme()
        frame = null
      })
    }
    const observer = new MutationObserver(() => {
      applyTheme()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    })
    return () => {
      observer.disconnect()
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
    }
  }, [portalContainer])

  const tabsValue = useMemo(() => currentValue, [currentValue])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setFocusSignal(previous => previous + 1)
  }, [isOpen, tabsValue])

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }
    if (isOpen) {
      lastFocusedElementRef.current = document.activeElement as HTMLElement | null
    } else if (lastFocusedElementRef.current) {
      try {
        lastFocusedElementRef.current.focus({ preventScroll: true })
      } catch {}
      lastFocusedElementRef.current = null
    }
  }, [isOpen])

  return (
    <>
      <div ref={setPortalContainer} style={{ display: "contents" }} />
      {portalContainer ? (
        <DialogPrimitive.Portal container={portalContainer} forceMount>
          <DialogPrimitive.Overlay className="chat-backdrop" forceMount />
          <ChatPanelDialogContent>
            <ChatResize panelRef={panelRef}>
              <TabsPrimitive.Root
                className="chat-panel"
                value={tabsValue}
                defaultValue={openTabs[0]}
                onValueChange={value => {
                  if (value) {
                    switchThread(value)
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
                  onNewThread={onNewThread}
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
            </ChatResize>
          </ChatPanelDialogContent>
        </DialogPrimitive.Portal>
      ) : null}
    </>
  )
}
const ChatPanelDialogContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(function ChatPanelDialogContent({ children, className, ...props }, ref) {
  return (
    <DialogPrimitive.Content
      ref={ref}
      className={cn("chat-overlay", className)}
      onOpenAutoFocus={event => {
        event.preventDefault()
      }}
      {...props}
    >
      <DialogPrimitive.Title className="chat-sr-only">
        Smart Site chat panel
      </DialogPrimitive.Title>
      {children}
    </DialogPrimitive.Content>
  )
})
