"use client"

import { Fragment, useEffect, useRef } from "react"
import { useAuth } from "@payloadcms/ui"
import { Conversation, ConversationContent, ConversationScrollButton } from "@/admin/components/chat-panel/ai/conversation"
import { Message, MessageContent } from "@/admin/components/chat-panel/ai/message"
import { Response } from "@/admin/components/chat-panel/ai/response"
import { Actions, Action } from "@/admin/components/chat-panel/ai/actions"
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/admin/components/chat-panel/ai/sources"
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/admin/components/chat-panel/ai/tool"
import { RefreshCcwIcon, CopyIcon, SparklesIcon } from "lucide-react"
import type { ToolUIPart, UIMessage } from "ai"
import { useStickToBottomContext } from "use-stick-to-bottom"
import type { ThreadStatus } from "./chat-threads-provider"

interface ChatMessagesProps {
  messages: UIMessage[]
  status: ThreadStatus
  regenerate: () => void
  onQuickSend: (text: string) => void
  focusSignal: number
  isActive: boolean
}

export function ChatMessages({ messages, status, regenerate, onQuickSend, focusSignal, isActive }: ChatMessagesProps) {
  const { user } = useAuth()
  const userAvatarSrc = (user as any)?.avatar?.url as string | undefined
  const userName = (user as any)?.name || (user as any)?.email || ""

  const lastAssistant = [...(messages || [])].reverse().find(message => message.role === "assistant")
  const assistantOutputStarted = Boolean(
    lastAssistant &&
      messages?.at(-1)?.id === lastAssistant.id &&
      ((lastAssistant.parts || []) as Array<{ type: string; text?: string }>).some(
        part => part.type === "text" && typeof part.text === "string" && part.text.length > 0
      )
  )
  const showTyping = status === "submitted" || (status === "streaming" && !assistantOutputStarted)

  return (
    <div className="chat-messages">
      <Conversation className="chat-messages__conversation">
        <ConversationContent className="chat-messages__content">
          {messages.length === 0 && <WelcomeState onQuickSend={onQuickSend} />}

          {messages.map(message => {
            const parts = (message.parts || []) as Array<{ type: string; [key: string]: unknown }>
            return (
              <div key={message.id} className="chat-message-block">
                {parts.some(part => part.type === "source-url") && (
                  <Sources>
                    <SourcesTrigger
                      count={parts.filter(part => part.type === "source-url").length}
                    />
                    {parts
                    .filter(part => part.type === "source-url")
                    .map((part, index) => (
                      <SourcesContent key={`${message.id}-${index}`}>
                        <Source href={String(part.url)} title={String(part.url)} />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}

                {parts.map((part, index) => {
                  switch (part.type) {
                    case "text": {
                      const textContent = typeof part.text === "string" ? part.text : String(part.text ?? "")
                      return (
                        <Fragment key={`${message.id}-${index}`}>
                          <Message
                            from={message.role}
                            userAvatarSrc={message.role === "user" ? userAvatarSrc : undefined}
                            userName={message.role === "user" ? userName : undefined}
                          >
                            <MessageContent>
                              <Response>{textContent}</Response>
                            </MessageContent>
                          </Message>
                          {message.role === "assistant" && index === parts.length - 1 && (
                            <Actions>
                              <Action onClick={() => regenerate()} tooltip="Retry">
                                <RefreshCcwIcon className="chat-icon" />
                              </Action>
                              <Action
                                onClick={() => navigator.clipboard.writeText(textContent)}
                                tooltip="Copy"
                              >
                                <CopyIcon className="chat-icon" />
                              </Action>
                            </Actions>
                          )}
                        </Fragment>
                      )
                    }
                    case "reasoning":
                      return null
                    default:
                      if (part.type?.startsWith("tool-")) {
                        const toolPart = part as ToolUIPart
                        return (
                          <Tool key={`${message.id}-${index}`} defaultOpen={false}>
                            <ToolHeader toolType={toolPart.type} state={toolPart.state} />
                            <ToolContent>
                              <ToolInput input={toolPart.input} />
                              <ToolOutput output={toolPart.output} errorText={toolPart.errorText} />
                            </ToolContent>
                          </Tool>
                        )
                      }
                      return null
                  }
                })}
              </div>
            )
          })}

          {showTyping && <TypingIndicator />}
        </ConversationContent>
        <ConversationAutoStick
          focusSignal={focusSignal}
          isActive={isActive}
          status={status}
          messages={messages}
        />
        <ConversationScrollButton />
      </Conversation>
    </div>
  )
}

function WelcomeState({ onQuickSend }: { onQuickSend: (text: string) => void }) {
  return (
    <div className="chat-welcome">
      <div className="chat-welcome__hero">
        <div className="chat-welcome__badge">
          <SparklesIcon className="chat-welcome__badge-icon" />
        </div>
        <h2 className="chat-welcome__title">Smart Site Assistant</h2>
        <p className="chat-welcome__description">
          I can help you build and manage website sections, configure CMS fields, optimise content, and guide you through the
          platform.
        </p>
      </div>
      <div className="chat-welcome__actions">
        <button className="chat-quick-action" onClick={() => onQuickSend("How do I add a new page?")} type="button">
          Add a new page
        </button>
        <button className="chat-quick-action" onClick={() => onQuickSend("What can you help me with?")} type="button">
          Create a blog post
        </button>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <Message from="assistant" alignMiddle>
      <MessageContent>
        <div className="chat-typing">
          <span className="chat-typing__dot" />
          <span className="chat-typing__dot" />
          <span className="chat-typing__dot" />
        </div>
      </MessageContent>
    </Message>
  )
}

type ConversationAutoStickProps = {
  focusSignal: number
  isActive: boolean
  status: ThreadStatus
  messages: UIMessage[]
}

function ConversationAutoStick({ focusSignal, isActive, status, messages }: ConversationAutoStickProps) {
  const { scrollToBottom, isAtBottom } = useStickToBottomContext()
  const lastSignature = messages.at(-1)?.id ?? "none"
  const lastFocusRef = useRef(focusSignal)

  useEffect(() => {
    if (!isActive) {
      return
    }
    const focusChanged = lastFocusRef.current !== focusSignal
    lastFocusRef.current = focusSignal
    if (focusChanged && status === "idle" && messages.length > 0) {
      return
    }
    if (!focusChanged && !isAtBottom) {
      return
    }
    const frame = requestAnimationFrame(() => {
      scrollToBottom({
        animation: status === "streaming" ? "smooth" : "instant",
        wait: 0,
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [focusSignal, isActive, isAtBottom, lastSignature, messages.length, scrollToBottom, status])

  return null
}
