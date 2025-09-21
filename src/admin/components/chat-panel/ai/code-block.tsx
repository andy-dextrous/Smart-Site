"use client"

import type { ComponentProps, HTMLAttributes, ReactNode } from "react"
import { createContext, useContext, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/admin/utilities/ui"

export const codeBlockStyles = /* css */ `
.chat-code-block {
  border-radius: var(--chat-radius-sm);
  border: 1px solid var(--chat-color-border);
  background: var(--chat-color-layer-2);
  overflow: hidden;
}

.chat-code-block__viewport {
  position: relative;
}

.chat-code-block__syntax {
  background: transparent !important;
}

.chat-code-block__syntax--dark {
  display: none;
}

.chat-root[data-theme="dark"] .chat-code-block__syntax--light,
[data-chat-panel-root][data-theme="dark"] .chat-code-block__syntax--light {
  display: none;
}

.chat-root[data-theme="dark"] .chat-code-block__syntax--dark,
[data-chat-panel-root][data-theme="dark"] .chat-code-block__syntax--dark {
  display: block;
}

.chat-code-block__code {
  font-family: Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.chat-code-block__actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
}

.chat-code-block__copy {
  width: 28px;
  height: 28px;
  border-radius: var(--chat-radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  color: var(--chat-color-text-inverse);
}

.chat-root[data-theme="dark"] .chat-code-block__copy,
[data-chat-panel-root][data-theme="dark"] .chat-code-block__copy {
  background: rgba(255, 255, 255, 0.16);
  color: var(--chat-color-text-primary);
}

.chat-code-block__copy-icon {
  width: 14px;
  height: 14px;
}
`

type CodeBlockContextType = {
  code: string
}

const CodeBlockContext = createContext<CodeBlockContextType>({ code: "" })

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string
  language: string
  showLineNumbers?: boolean
  children?: ReactNode
}

export function CodeBlock({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) {
  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div className={cn("chat-code-block", className)} {...props}>
        <div className="chat-code-block__viewport">
          <SyntaxHighlighter
            className="chat-code-block__syntax chat-code-block__syntax--light"
            codeTagProps={{ className: "chat-code-block__code" }}
            customStyle={{ margin: 0, padding: "1rem", fontSize: "0.875rem" }}
            language={language}
            lineNumberStyle={{ color: "var(--chat-color-text-muted)", paddingRight: "1rem", minWidth: "2.5rem" }}
            showLineNumbers={showLineNumbers}
            style={oneLight}
          >
            {code}
          </SyntaxHighlighter>
          <SyntaxHighlighter
            className="chat-code-block__syntax chat-code-block__syntax--dark"
            codeTagProps={{ className: "chat-code-block__code" }}
            customStyle={{ margin: 0, padding: "1rem", fontSize: "0.875rem" }}
            language={language}
            lineNumberStyle={{ color: "var(--chat-color-text-muted)", paddingRight: "1rem", minWidth: "2.5rem" }}
            showLineNumbers={showLineNumbers}
            style={oneDark}
          >
            {code}
          </SyntaxHighlighter>
          {children && <div className="chat-code-block__actions">{children}</div>}
        </div>
      </div>
    </CodeBlockContext.Provider>
  )
}

export type CodeBlockCopyButtonProps = ComponentProps<"button"> & {
  onCopy?: () => void
  onError?: (error: Error) => void
  timeout?: number
}

export function CodeBlockCopyButton({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  type = "button",
  ...props
}: CodeBlockCopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false)
  const { code } = useContext(CodeBlockContext)

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"))
      return
    }
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      onCopy?.()
      setTimeout(() => setIsCopied(false), timeout)
    } catch (error) {
      onError?.(error as Error)
    }
  }

  const Icon = isCopied ? CheckIcon : CopyIcon

  return (
    <button
      className={cn("chat-code-block__copy", className)}
      onClick={copyToClipboard}
      type={type}
      {...props}
    >
      {children ?? <Icon className="chat-code-block__copy-icon" />}
      <span className="chat-sr-only">Copy code</span>
    </button>
  )
}
