"use client"

import { cn } from "@/admin/utilities/ui"
import { type ComponentProps, memo } from "react"
import { Streamdown } from "streamdown"

export const responseStyles = /* css */ `
.chat-markdown {
  display: block;
  font-size: 15px;
  line-height: 1.55;
  color: inherit;
}

.chat-markdown p {
  margin: 0 0 12px;
}

.chat-markdown ul,
.chat-markdown ol {
  margin: 0 0 12px;
  padding-left: 20px;
}

.chat-markdown code {
  font-family: monospace;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
}

.chat-root[data-theme="dark"] .chat-markdown code,
[data-chat-panel-root][data-theme="dark"] .chat-markdown code {
  background: rgba(255, 255, 255, 0.08);
}
`

type ResponseProps = ComponentProps<typeof Streamdown>

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown className={cn("chat-markdown", className)} {...props} />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
)

Response.displayName = "Response"
