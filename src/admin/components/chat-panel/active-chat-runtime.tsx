"use client"

import { useEffect, useMemo, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { getOnToolCallHandler } from "@/admin/ai/on-tool-call"
import { useChatThreadsContext } from "./chat-threads-provider"

/*************************************************************************/
/*  ACTIVE CHAT RUNTIME - BINDS AI SDK TO ACTIVE THREAD
/*************************************************************************/

export function ActiveChatRuntime() {
  /**
   * Runtime context
   */
  const {
    activeThreadId,
    messages,
    setThreadMessages,
    registerRuntime,
    refreshThreads,
    getClientContext,
    recordSelection,
  } =
    useChatThreadsContext()

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        prepareSendMessagesRequest: async ({ body, id, messages, trigger, messageId }) => {
          const base = body || {}
          return {
            body: {
              ...base,
              id,
              messages,
              trigger,
              messageId,
              clientContext: getClientContext(),
            },
          }
        },
      }),
    [getClientContext]
  )

  /**
   * AI SDK chat hook
   */
  const { messages: chatMessages, status, setMessages, addToolResult, sendMessage, regenerate, stop } = useChat({
    transport,
    id: activeThreadId,
    onToolCall: async ({ toolCall }) => {
      const handler = getOnToolCallHandler(
        params => addToolResultRef.current?.(params),
        selection => recordSelection(selection)
      )
      await handler({ toolCall } as any)
    },
    onFinish: async () => {
      scheduleThreadsRefresh()
    },
  })

  /**
   * Refs
   */
  const addToolResultRef = useRef<typeof addToolResult | null>(null)
  const lastHydratedThreadRef = useRef<string | undefined>(undefined)
  const refreshTimerRef = useRef<any>(null)
  const lastRefreshAtRef = useRef<number>(0)
  const hadStreamingRef = useRef<boolean>(false)
  const lastFinishedThreadRef = useRef<string | undefined>(undefined)

  /**
   * Helpers
   */
  function scheduleThreadsRefresh() {
    if (!hadStreamingRef.current) return
    const now = Date.now()
    if (lastFinishedThreadRef.current === activeThreadId && now - lastRefreshAtRef.current < 2000) return
    hadStreamingRef.current = false
    lastFinishedThreadRef.current = activeThreadId
    lastRefreshAtRef.current = now
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => {
      refreshThreads().catch(() => {})
    }, 500)
  }

  /**
   * Effects
   */
  useEffect(() => {
    addToolResultRef.current = addToolResult
  }, [addToolResult])

  useEffect(() => {
    if (!activeThreadId) return
    const hasProviderMessages = Array.isArray(messages) && messages.length > 0
    const runtimeEmpty = !Array.isArray(chatMessages) || chatMessages.length === 0
    const notHydratedForThread = lastHydratedThreadRef.current !== activeThreadId
    if (hasProviderMessages && (notHydratedForThread || runtimeEmpty)) {
      setMessages(messages)
      lastHydratedThreadRef.current = activeThreadId
    }
  }, [activeThreadId, messages, chatMessages, setMessages])

  useEffect(() => {
    if (!activeThreadId) return
    // Skip replacing provider state with empty runtime list (pre-hydration)
    if (!Array.isArray(chatMessages) || chatMessages.length === 0) return
    const mapped = mapStatus(status)
    setThreadMessages({ threadId: activeThreadId, items: chatMessages, status: mapped, mode: "replace" })
  }, [chatMessages, status, activeThreadId])

  useEffect(() => {
    if (status === "streaming") hadStreamingRef.current = true
  }, [status])

  useEffect(() => {
    registerRuntime({ sendMessage, regenerate, addToolResult: (p) => addToolResult(p), stop })
    return () => registerRuntime(null)
  }, [registerRuntime, sendMessage, regenerate, addToolResult, stop])

  return null
}

/**
 * Status mapping
 */
function mapStatus(status: string) {
  switch (status) {
    case "streaming":
      return "streaming"
    case "submitted":
      return "submitted"
    case "ready":
    case "idle":
      return "idle"
    default:
      return status as any
  }
}
