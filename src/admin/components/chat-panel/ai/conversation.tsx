"use client"

import type { ComponentProps, HTMLAttributes } from "react"
import { useCallback } from "react"
import { ArrowDownIcon } from "lucide-react"
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom"
import { cn } from "@/admin/utilities/ui"

export const conversationStyles = /* css */ `
.chat-messages {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.chat-messages__conversation {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chat-messages__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 32px 32px;
}

.chat-message-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-scroll-button {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--chat-color-layer-1);
  border: 1px solid var(--chat-color-border);
  color: var(--chat-color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: var(--chat-shadow-sm);
  transition: background 0.2s ease, color 0.2s ease;
}

.chat-scroll-button:hover {
  background: var(--chat-color-layer-2);
  color: var(--chat-color-text-primary);
}

.chat-scroll-button__icon {
  width: 16px;
  height: 16px;
}

.chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
  padding: 48px 16px;
  flex: 1;
  width: 100%;
}

.chat-welcome__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.chat-welcome__badge {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(79, 55, 251, 0.18), rgba(79, 55, 251, 0.05));
  border: 1px solid rgba(79, 55, 251, 0.16);
}

.chat-root[data-theme="dark"] .chat-welcome__badge,
[data-chat-panel-root][data-theme="dark"] .chat-welcome__badge {
  background: linear-gradient(135deg, rgba(131, 115, 252, 0.18), rgba(131, 115, 252, 0.08));
  border-color: rgba(131, 115, 252, 0.24);
}

.chat-welcome__badge-icon {
  width: 30px;
  height: 30px;
  color: var(--chat-color-accent);
}

.chat-welcome__title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--chat-color-text-primary);
}

.chat-welcome__description {
  margin: 0;
  max-width: 360px;
  color: var(--chat-color-text-secondary);
  font-size: 15px;
  line-height: 1.6;
}

.chat-welcome__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.chat-quick-action {
  padding: 10px 16px;
  border-radius: var(--chat-radius-md);
  background: var(--chat-color-layer-2);
  color: var(--chat-color-text-primary);
  border: 1px solid transparent;
  transition: border 0.2s ease, transform 0.2s ease;
}

.chat-quick-action:hover {
  border-color: var(--chat-color-accent);
  transform: translateY(-1px);
}

.chat-root[data-theme="dark"] .chat-quick-action,
[data-chat-panel-root][data-theme="dark"] .chat-quick-action {
  background: rgba(255, 255, 255, 0.05);
  color: var(--chat-color-text-primary);
}

.chat-root[data-theme="dark"] .chat-quick-action:hover,
[data-chat-panel-root][data-theme="dark"] .chat-quick-action:hover {
  border-color: rgba(131, 115, 252, 0.6);
}

.chat-conversation {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chat-conversation > div {
  flex: 1 1 auto;
  width: 100% !important;
  height: 100% !important;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
}

.chat-conversation__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  padding: 48px 24px;
}

.chat-empty__icon {
  color: var(--chat-color-text-secondary);
}

.chat-empty__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--chat-color-text-primary);
}

.chat-empty__description {
  margin: 0;
  color: var(--chat-color-text-secondary);
  font-size: 14px;
}
`

export type ConversationProps = ComponentProps<typeof StickToBottom>

export function Conversation({
  className,
  tabIndex = 0,
  role = "log",
  "aria-label": ariaLabel = "Chat conversation",
  ...props
}: ConversationProps) {
  return (
    <StickToBottom
      className={cn("chat-conversation relative flex-1", className)}
      initial="instant"
      resize="smooth"
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      {...props}
    />
  )
}

export type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>

export function ConversationContent({ className, ...props }: ConversationContentProps) {
  return (
    <StickToBottom.Content
      className={cn("chat-conversation__content", className)}
      {...props}
    />
  )
}

export type ConversationEmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export function ConversationEmptyState({
  className,
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) {
  return (
    <div className={cn("chat-empty", className)} {...props}>
      {children ?? (
        <>
          {icon && <div className="chat-empty__icon">{icon}</div>}
          <div className="chat-empty__copy">
            <h3 className="chat-empty__title">{title}</h3>
            {description && <p className="chat-empty__description">{description}</p>}
          </div>
        </>
      )}
    </div>
  )
}

export type ConversationScrollButtonProps = ComponentProps<"button">

export function ConversationScrollButton({ className, ...props }: ConversationScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom()
  }, [scrollToBottom])

  if (isAtBottom) {
    return null
  }

  return (
    <button
      className={cn("chat-scroll-button", className)}
      onClick={handleScrollToBottom}
      type="button"
      {...props}
    >
      <ArrowDownIcon className="chat-scroll-button__icon" />
      <span className="chat-sr-only">Scroll to newest message</span>
    </button>
  )
}
