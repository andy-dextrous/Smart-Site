"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import type { ComponentProps } from "react"
import { BookIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "@/admin/utilities/ui"

export const sourcesStyles = /* css */ `
.chat-sources {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--chat-color-text-secondary);
  font-size: 12px;
}

.chat-sources__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--chat-color-accent);
  font-weight: 500;
}

.chat-sources__chevron {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

[data-state="open"] > .chat-sources__chevron {
  transform: rotate(180deg);
}

.chat-sources__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 4px;
}

.chat-source {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--chat-color-text-secondary);
}

.chat-source:hover {
  color: var(--chat-color-accent);
}

.chat-source__icon {
  width: 14px;
  height: 14px;
}
`

export type SourcesProps = ComponentProps<typeof CollapsiblePrimitive.Root>

export function Sources({ className, ...props }: SourcesProps) {
  return <CollapsiblePrimitive.Root className={cn("chat-sources", className)} {...props} />
}

export type SourcesTriggerProps = ComponentProps<typeof CollapsiblePrimitive.Trigger> & {
  count: number
}

export function SourcesTrigger({ className, count, children, ...props }: SourcesTriggerProps) {
  return (
    <CollapsiblePrimitive.Trigger className={cn("chat-sources__trigger", className)} {...props}>
      {children ?? (
        <>
          <span className="chat-sources__label">Used {count} sources</span>
          <ChevronDownIcon aria-hidden className="chat-sources__chevron" />
        </>
      )}
    </CollapsiblePrimitive.Trigger>
  )
}

export type SourcesContentProps = ComponentProps<typeof CollapsiblePrimitive.Content>

export function SourcesContent({ className, ...props }: SourcesContentProps) {
  return (
    <CollapsiblePrimitive.Content className={cn("chat-sources__content", className)} {...props} />
  )
}

export type SourceProps = ComponentProps<"a">

export function Source({ href, title, children, ...props }: SourceProps) {
  return (
    <a className="chat-source" href={href} rel="noreferrer" target="_blank" {...props}>
      {children ?? (
        <>
          <BookIcon aria-hidden className="chat-source__icon" />
          <span className="chat-source__label">{title}</span>
        </>
      )}
    </a>
  )
}
