import type { HTMLAttributes } from "react"
import { SparklesIcon, User as UserIcon } from "lucide-react"
import Image from "next/image"
import { cn } from "@/admin/utilities/ui"
import type { UIMessage } from "ai"

export const messageStyles = /* css */ `
.chat-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-message__row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.chat-message__row--user {
  justify-content: flex-end;
}

.chat-message--align-middle .chat-message__row {
  align-items: center;
}

.chat-message__content {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  max-width: min(600px, calc(100vw - 160px));
}

.chat-message__bubble {
  background: var(--chat-bubble-assistant-bg);
  color: var(--chat-bubble-assistant-text);
  border-radius: 18px;
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.45;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.chat-message--user .chat-message__bubble {
  background: var(--chat-bubble-user-bg);
  color: var(--chat-bubble-user-text);
  border-radius: 18px 18px 6px 18px;
}

.chat-message__assistant-icon {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(79, 55, 251, 0.2), rgba(79, 55, 251, 0.05));
  border: 1px solid rgba(79, 55, 251, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-root[data-theme="dark"] .chat-message__assistant-icon,
[data-chat-panel-root][data-theme="dark"] .chat-message__assistant-icon {
  background: linear-gradient(135deg, rgba(131, 115, 252, 0.25), rgba(131, 115, 252, 0.1));
  border-color: rgba(131, 115, 252, 0.16);
}

.chat-message__assistant-icon-mark {
  width: 16px;
  height: 16px;
  color: var(--chat-color-accent);
}

.chat-typing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chat-typing__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--chat-color-text-muted);
  animation: chat-typing-pulse 0.7s ease-in-out infinite alternate;
}

.chat-typing__dot:nth-child(2) {
  animation-delay: 0.18s;
}

.chat-typing__dot:nth-child(3) {
  animation-delay: 0.36s;
}

.chat-message__avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(67, 67, 73, 0.12), rgba(67, 67, 73, 0.04));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.chat-message__avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-message__avatar--fallback {
  color: var(--chat-color-text-secondary);
}

.chat-message__avatar-icon {
  width: 16px;
  height: 16px;
}
`

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"]
  userAvatarSrc?: string
  userName?: string
  alignMiddle?: boolean
}

export function Message({
  className,
  from,
  userAvatarSrc,
  userName,
  alignMiddle,
  children,
  ...props
}: MessageProps) {
  if (from === "user") {
    return (
      <div className={cn("chat-message chat-message--user", className)} {...props}>
        <div className="chat-message__row chat-message__row--user">
          <div className="chat-message__content">{children}</div>
          <MessageAvatar
            aria-hidden={!userName}
            name={userName}
            src={userAvatarSrc || ""}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "chat-message chat-message--assistant",
        alignMiddle && "chat-message--align-middle",
        className
      )}
      {...props}
    >
      <div className="chat-message__row">
        <div className="chat-message__assistant-icon">
          <SparklesIcon className="chat-message__assistant-icon-mark" />
        </div>
        <div className="chat-message__content">{children}</div>
      </div>
    </div>
  )
}

export type MessageContentProps = HTMLAttributes<HTMLDivElement>

export function MessageContent({ className, children, ...props }: MessageContentProps) {
  return (
    <div className={cn("chat-message__bubble", className)} {...props}>
      {children}
    </div>
  )
}

export type MessageAvatarProps = HTMLAttributes<HTMLDivElement> & {
  src: string
  name?: string
}

export function MessageAvatar({ src, name, className, ...props }: MessageAvatarProps) {
  if (src) {
    return (
      <div className={cn("chat-message__avatar", className)} {...props}>
        <Image
          alt={name || ""}
          className="chat-message__avatar-image"
          fill
          sizes="40px"
          src={src}
        />
      </div>
    )
  }

  return (
    <div
      className={cn("chat-message__avatar chat-message__avatar--fallback", className)}
      {...props}
    >
      <UserIcon aria-hidden className="chat-message__avatar-icon" />
    </div>
  )
}
