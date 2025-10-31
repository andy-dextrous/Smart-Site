"use client"

import * as TabsPrimitive from "@radix-ui/react-tabs"
import { PlusIcon, XIcon } from "lucide-react"
import { cn } from "@/admin/utilities/ui"
import type { Thread } from "@/admin/lib/ai/threads"

export const chatHeaderStyles = /* css */ `
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--chat-color-border);
  background: var(--chat-color-layer-1);
}

.chat-tabs__list {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.chat-tabs__list::-webkit-scrollbar {
  display: none;
}

.chat-tabs__item {
  position: relative;
  display: inline-flex;
}

.chat-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  padding-right: 36px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--chat-color-text-muted);
  transition: background 0.2s ease, color 0.2s ease;
  white-space: nowrap;
  position: relative;
}

.chat-tabs__tab[data-active="true"] {
  background: var(--chat-color-layer-2);
  color: var(--chat-color-text-primary);
}

.chat-tabs__tab-label {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-tabs__tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  color: var(--chat-color-text-muted);
  background: rgba(0, 0, 0, 0.02);
  transition: background 0.2s ease, color 0.2s ease;
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
}

.chat-tabs__tab-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--chat-color-text-primary);
}

.chat-root[data-theme="dark"] .chat-tabs__tab-close,
[data-chat-panel-root][data-theme="dark"] .chat-tabs__tab-close {
  color: var(--chat-color-text-secondary);
  background: rgba(255, 255, 255, 0.03);
}

.chat-root[data-theme="dark"] .chat-tabs__tab-close:hover,
[data-chat-panel-root][data-theme="dark"] .chat-tabs__tab-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--chat-color-text-primary);
}

.chat-tabs__tab-close-icon {
  width: 12px;
  height: 12px;
}

.chat-header__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-header__new,
.chat-header__close {
  width: 40px;
  height: 40px;
}

.chat-header__close-icon {
  width: 18px;
  height: 18px;
}
`

interface ChatHeaderTabsProps {
  threads: Thread[]
  openTabs: string[]
  activeThreadId?: string
  onSelect: (id: string) => void
  onCloseTab: (id: string) => void
  onDeleteThread?: (id: string) => void
  hasMessages?: (id: string) => boolean
  onNewThread: () => void
  getDisplayTitle: (t?: Thread) => string
  onClosePanel: () => void
}

export function ChatHeaderTabs({
  threads,
  openTabs,
  activeThreadId,
  onSelect,
  onCloseTab,
  onDeleteThread,
  hasMessages,
  onNewThread,
  getDisplayTitle,
  onClosePanel,
}: ChatHeaderTabsProps) {
  const handleClose = (threadId: string, confirm: boolean) => {
    if (confirm) {
      const ok = typeof window === "undefined" || window.confirm("Delete this chat thread? This cannot be undone.")
      if (!ok) {
        return
      }
      if (onDeleteThread) {
        onDeleteThread(threadId)
        return
      }
    }
    onCloseTab(threadId)
  }

  return (
    <div className="chat-header">
      <TabsPrimitive.List className="chat-tabs__list">
        {openTabs.map(threadId => {
          const thread = threads.find(item => item.id === threadId)
          const title = getDisplayTitle(thread)
          const confirmClose = hasMessages ? hasMessages(threadId) : true
          const closeLabel = confirmClose ? "Delete thread" : "Close thread"
          return (
            <div className="chat-tabs__item" key={threadId}>
              <TabsPrimitive.Trigger
                className={cn("chat-tabs__tab")}
                data-active={activeThreadId === threadId}
                value={threadId}
                onClick={() => onSelect(threadId)}
              >
                <span className="chat-tabs__tab-label">{title}</span>
              </TabsPrimitive.Trigger>
              <button
                aria-label={closeLabel}
                className="chat-tabs__tab-close"
                onClick={event => {
                  event.preventDefault()
                  event.stopPropagation()
                  handleClose(threadId, confirmClose)
                }}
                type="button"
              >
                <XIcon aria-hidden className="chat-tabs__tab-close-icon" />
                <span className="chat-sr-only">{closeLabel}</span>
              </button>
            </div>
          )
        })}
      </TabsPrimitive.List>
      <div className="chat-header__actions">
        <button className="chat-button-icon chat-header__new" onClick={onNewThread} type="button">
          <PlusIcon aria-hidden className="chat-icon" />
          <span className="chat-sr-only">Start a new chat</span>
        </button>
        <button className="chat-button-icon chat-header__close" onClick={onClosePanel} type="button">
          <XIcon aria-hidden className="chat-header__close-icon" />
          <span className="chat-sr-only">Close chat</span>
        </button>
      </div>
    </div>
  )
}
