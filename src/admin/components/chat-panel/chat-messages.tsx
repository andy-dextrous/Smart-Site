"use client"

import { Fragment } from "react"
import { useAuth } from "@payloadcms/ui"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/admin/components/ai-elements/conversation"
import { Message, MessageContent } from "@/admin/components/ai-elements/message"
import { Response } from "@/admin/components/ai-elements/response"
import { Actions, Action } from "@/admin/components/ai-elements/actions"
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/admin/components/ai-elements/sources"
// Reasoning UI intentionally removed per UX request
// Custom typing indicator replaces default Loader
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/admin/components/ai-elements/tool"
import { RefreshCcwIcon, CopyIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/admin/components/ui/button"
import type { ToolUIPart } from "ai"
// Task UI not used for tools; keep default Tool presentation

/**
 * Component props
 */
interface ChatMessagesProps {
  messages: any[]
  status: string
  regenerate: () => void
  onQuickSend: (text: string) => void
}

/**
 * Messages list with welcome state, sources, reasoning and tools
 */
export function ChatMessages({
  messages,
  status,
  regenerate,
  onQuickSend,
}: ChatMessagesProps) {
  /**
   * Current user (for avatar)
   */
  const { user } = useAuth()
  const userAvatarSrc = (user as any)?.avatar?.url as string | undefined
  const userName = (user as any)?.name || (user as any)?.email || ""

  // Only show typing bubble until the first assistant tokens arrive
  const lastAssistant = [...(messages || [])].reverse().find(m => m.role === "assistant")
  const assistantOutputStarted = Boolean(
    lastAssistant &&
      messages?.at(-1)?.id === lastAssistant.id &&
      (lastAssistant.parts || []).some(
        (p: any) => p.type === "text" && typeof p.text === "string" && p.text.length > 0
      )
  )
  const showTyping =
    status === "submitted" || (status === "streaming" && !assistantOutputStarted)

  /**
   *  Render the chat messages
   */

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation className="flex min-h-0 flex-1 overflow-hidden">
        <ConversationContent className="flex min-h-full flex-col gap-4 px-8 pt-8">
          {/*
           * Welcome state
           */}
          {messages.length === 0 && (
            <div className="flex h-full min-h-full w-full flex-1 flex-col items-center justify-center">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="from-admin-accent/20 to-admin-accent/5 border-admin-accent/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-gradient-to-br">
                  <SparklesIcon className="text-admin-accent h-8 w-8" />
                </div>
                <h2 className="text-admin-900 dark:text-admin-50 m-0 mb-2 text-2xl font-semibold">
                  Smart Site Assistant
                </h2>
                <p className="text-admin-600 dark:text-admin-400 m-0 max-w-80 text-base leading-7">
                  I can help you build and manage your website sections, configure CMS
                  fields, optimize content, and guide you through the platforms features.
                </p>
              </div>
              <div className="flex w-full flex-wrap justify-center gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => onQuickSend("How do I add a new page?")}
                >
                  Add a new page
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => onQuickSend("What can you help me with?")}
                >
                  Create A Blog Post
                </Button>
              </div>
            </div>
          )}

          {/*
           * Messages
           */}
          {messages.map((message: any) => (
            <div key={message.id} className="flex w-full flex-col gap-2">
              {message.parts.some((part: any) => part.type === "source-url") && (
                <Sources>
                  <SourcesTrigger
                    count={
                      message.parts.filter((part: any) => part.type === "source-url")
                        .length
                    }
                  />
                  {message.parts
                    .filter((part: any) => part.type === "source-url")
                    .map((part: any, i: number) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                </Sources>
              )}

              {/**
               * Render parts: text | reasoning | tool-*
               */}
              {message.parts.map((part: any, i: number) => {
                switch (part.type) {
                  case "text":
                    return (
                      <Fragment key={`${message.id}-${i}`}>
                        <Message
                          from={message.role}
                          userAvatarSrc={
                            message.role === "user" ? userAvatarSrc : undefined
                          }
                          userName={message.role === "user" ? userName : undefined}
                        >
                          <MessageContent>
                            <Response>{part.text}</Response>
                          </MessageContent>
                        </Message>
                        {message.role === "assistant" && i === messages.length - 1 && (
                          <Actions className="mt-2">
                            <Action onClick={() => regenerate()} label="Retry">
                              <RefreshCcwIcon className="h-3.5 w-3.5" />
                            </Action>
                            <Action
                              onClick={() => navigator.clipboard.writeText(part.text)}
                              label="Copy"
                            >
                              <CopyIcon className="h-3.5 w-3.5" />
                            </Action>
                          </Actions>
                        )}
                      </Fragment>
                    )
                  case "reasoning":
                    return null
                  default:
                    if (part.type?.startsWith("tool-")) {
                      const toolPart = part as ToolUIPart
                      return (
                        <Tool key={`${message.id}-${i}`} defaultOpen={false}>
                          <ToolHeader type={toolPart.type} state={toolPart.state} />
                          <ToolContent>
                            <ToolInput input={toolPart.input} />
                            <ToolOutput
                              output={toolPart.output}
                              errorText={toolPart.errorText}
                            />
                          </ToolContent>
                        </Tool>
                      )
                    }
                    return null
                }
              })}
            </div>
          ))}

          {showTyping && <TypingIndicator />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  )
}

/**
 * Assistant typing indicator (three bouncing dots)
 */
function TypingIndicator() {
  return (
    <Message from="assistant" alignMiddle>
      <MessageContent>
        <div className="ti-wrap">
          <span className="ti-dot" />
          <span className="ti-dot" />
          <span className="ti-dot" />
        </div>
      </MessageContent>
    </Message>
  )
}
