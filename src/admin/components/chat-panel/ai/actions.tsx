import type { ComponentProps, HTMLAttributes } from "react"
import { cn } from "@/admin/utilities/ui"

export const messageActionsStyles = /* css */ `
.chat-message-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 56px;
}

.chat-message-action {
  width: 28px;
  height: 28px;
  border-radius: var(--chat-radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--chat-color-text-muted);
  transition: background 0.2s ease, color 0.2s ease;
}

.chat-message-action:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--chat-color-text-primary);
}

.chat-root[data-theme="dark"] .chat-message-action,
[data-chat-panel-root][data-theme="dark"] .chat-message-action {
  color: var(--chat-color-text-secondary);
}

.chat-root[data-theme="dark"] .chat-message-action:hover,
[data-chat-panel-root][data-theme="dark"] .chat-message-action:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--chat-color-text-primary);
}
`

export type ActionsProps = HTMLAttributes<HTMLDivElement>

export function Actions({ className, ...props }: ActionsProps) {
  return <div className={cn("chat-message-actions", className)} {...props} />
}

export type ActionProps = ComponentProps<"button"> & {
  tooltip?: string
  label?: string
}

export function Action({
  tooltip,
  label,
  className,
  children,
  type = "button",
  ...props
}: ActionProps) {
  const accessibleLabel = label || tooltip || undefined
  return (
    <button
      className={cn("chat-message-action", className)}
      title={tooltip}
      type={type}
      {...props}
    >
      {children}
      {accessibleLabel && <span className="chat-sr-only">{accessibleLabel}</span>}
    </button>
  )
}
