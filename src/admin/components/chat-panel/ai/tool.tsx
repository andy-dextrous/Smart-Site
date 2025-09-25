"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import type { ComponentProps, ComponentPropsWithoutRef, ReactNode } from "react"
import { CheckCircleIcon, ChevronDownIcon, CircleIcon, ClockIcon, WrenchIcon, XCircleIcon } from "lucide-react"
import type { ToolUIPart } from "ai"
import { cn } from "@/admin/utilities/ui"
import { CodeBlock } from "./code-block"

export const toolStyles = /* css */ `
.chat-tool {
  margin-bottom: 2rem;
  border: 1px solid var(--chat-color-border);
  border-radius: var(--chat-radius-md);
  overflow: hidden;
  background: var(--chat-color-layer-0);
}

.chat-tool__header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--chat-color-layer-1);
  color: var(--chat-color-text-primary);
}

.chat-tool__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-tool__meta-icon {
  width: 16px;
  height: 16px;
  color: var(--chat-color-text-secondary);
}

.chat-tool__title {
  font-size: 14px;
  font-weight: 600;
}

.chat-tool__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(127, 132, 155, 0.16);
  color: var(--chat-color-text-primary);
}

.chat-tool__status-icon {
  width: 14px;
  height: 14px;
}

.chat-tool__status-icon--pulse {
  animation: chat-pulse 1s ease-in-out infinite;
}

.chat-tool__status-icon--success {
  color: var(--chat-color-success);
}

.chat-tool__status-icon--danger {
  color: var(--chat-color-danger);
}

.chat-tool__chevron {
  width: 16px;
  height: 16px;
  color: var(--chat-color-text-secondary);
  transition: transform 0.2s ease;
}

[data-state="open"] > .chat-tool__chevron {
  transform: rotate(180deg);
}

.chat-tool__content {
  border-top: 1px solid var(--chat-color-border);
}

.chat-tool__section {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-tool__section-title {
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--chat-color-text-secondary);
}

.chat-tool__result {
  border: 1px solid var(--chat-color-border);
  border-radius: var(--chat-radius-sm);
  background: var(--chat-color-layer-2);
  padding: 12px;
  overflow-x: auto;
}

.chat-tool__result--error {
  border: 1px solid rgba(220, 38, 38, 0.35);
  background: rgba(220, 38, 38, 0.08);
  color: var(--chat-color-danger);
}

.chat-tool__error-text {
  margin-bottom: 8px;
  font-weight: 500;
}

.chat-root[data-theme="dark"] .chat-tool,
[data-chat-panel-root][data-theme="dark"] .chat-tool {
  border-color: var(--chat-color-border);
  background: var(--chat-color-layer-1);
}

.chat-root[data-theme="dark"] .chat-tool__header,
[data-chat-panel-root][data-theme="dark"] .chat-tool__header {
  background: var(--chat-color-layer-1);
  border: 1px solid var(--chat-color-border);
}

.chat-root[data-theme="dark"] .chat-tool__content,
[data-chat-panel-root][data-theme="dark"] .chat-tool__content {
  border-top-color: var(--chat-color-border);
}

.chat-root[data-theme="dark"] .chat-tool__result,
[data-chat-panel-root][data-theme="dark"] .chat-tool__result {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--chat-color-border);
}

.chat-root[data-theme="dark"] .chat-tool__status,
[data-chat-panel-root][data-theme="dark"] .chat-tool__status {
  background: rgba(255, 255, 255, 0.08);
  color: var(--chat-color-text-primary);
}
`

export type ToolProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>

export function Tool({ className, ...props }: ToolProps) {
  return <CollapsiblePrimitive.Root className={cn("chat-tool", className)} {...props} />
}

export type ToolHeaderProps = Omit<ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>, "type"> & {
  toolType: ToolUIPart["type"]
  state: ToolUIPart["state"]
}

export function ToolHeader({ className, toolType, state, children, ...props }: ToolHeaderProps) {
  return (
    <CollapsiblePrimitive.Trigger
      className={cn("chat-tool__header", className)}
      type="button"
      {...props}
    >
      <div className="chat-tool__meta">
        <WrenchIcon aria-hidden className="chat-tool__meta-icon" />
        <span className="chat-tool__title">{formatToolName(toolType)}</span>
        <ToolStatusBadge state={state} />
      </div>
      <ChevronDownIcon aria-hidden className="chat-tool__chevron" />
      {children}
    </CollapsiblePrimitive.Trigger>
  )
}

function formatToolName(toolType: ToolUIPart["type"]) {
  return toolType.replace("tool-", "").replace(/_/g, " ")
}

function ToolStatusBadge({ state }: { state: ToolUIPart["state"] }) {
  const map = {
    "input-streaming": { label: "Pending", icon: <CircleIcon className="chat-tool__status-icon" /> },
    "input-available": {
      label: "Running",
      icon: <ClockIcon className="chat-tool__status-icon chat-tool__status-icon--pulse" />,
    },
    "output-available": {
      label: "Completed",
      icon: <CheckCircleIcon className="chat-tool__status-icon chat-tool__status-icon--success" />,
    },
    "output-error": {
      label: "Error",
      icon: <XCircleIcon className="chat-tool__status-icon chat-tool__status-icon--danger" />,
    },
  } as const
  const status = map[state] ?? {
    label: formatStatusLabel(state),
    icon: <CircleIcon className="chat-tool__status-icon" />,
  }
  const variant = state ?? "unknown"
  return (
    <span className={cn("chat-tool__status", `chat-tool__status--${variant}`)}>
      {status.icon}
      {status.label}
    </span>
  )
}

function formatStatusLabel(value: ToolUIPart["state"]) {
  if (!value) {
    return "Unknown"
  }
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, function formatCharacter(match) {
      return match.toUpperCase()
    })
}

export type ToolContentProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>

export function ToolContent({ className, ...props }: ToolContentProps) {
  return <CollapsiblePrimitive.Content className={cn("chat-tool__content", className)} {...props} />
}

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolUIPart["input"]
}

export function ToolInput({ className, input, ...props }: ToolInputProps) {
  return (
    <div className={cn("chat-tool__section", className)} {...props}>
      <h4 className="chat-tool__section-title">Parameters</h4>
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  )
}

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ToolUIPart["output"]
  errorText: ToolUIPart["errorText"]
}

export function ToolOutput({ className, output, errorText, ...props }: ToolOutputProps) {
  if (!(output || errorText)) {
    return null
  }

  let resolved: ReactNode = null
  if (typeof output === "string") {
    resolved = <CodeBlock code={output} language="json" />
  } else if (output && typeof output === "object") {
    resolved = <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />
  } else if (output !== undefined && output !== null) {
    resolved = <CodeBlock code={String(output)} language="json" />
  }

  return (
    <div className={cn("chat-tool__section", className)} {...props}>
      <h4 className="chat-tool__section-title">{errorText ? "Error" : "Result"}</h4>
      <div className={cn("chat-tool__result", errorText && "chat-tool__result--error")}>
        {errorText && <div className="chat-tool__error-text">{errorText}</div>}
        {resolved}
      </div>
    </div>
  )
}
