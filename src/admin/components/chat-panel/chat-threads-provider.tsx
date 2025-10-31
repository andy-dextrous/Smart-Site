"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@payloadcms/ui"
import { usePathname } from "next/navigation"
import type { FileUIPart, UIMessage } from "ai"
import { createThread, listThreadMessages, listThreads, deleteThread as apiDeleteThread, type Thread } from "@/admin/lib/ai/threads"
import { CHAT_CACHE_KEY } from "@/admin/components/chat-panel/chat-storage"
import type { SmartSiteClientContext } from "@/admin/lib/ai/client-context"
import { uploadChatAttachments } from "@/admin/ai/upload-attachments"
import { toast } from "sonner"

/*************************************************************************/
/*  CHAT THREADS PROVIDER - LOCAL TO CHAT PANEL
/*************************************************************************/

export type ThreadStatus = "idle" | "loading" | "streaming" | "submitted" | "error"

/**
 * Messages state shape
 */
type MessagesState = {
  items: UIMessage[]
  status: ThreadStatus
  version: number
  updatedAt?: number
}

type MessagesByThread = Record<string, MessagesState>

type OutgoingFilePart = FileUIPart & { file?: File }

type RuntimeApi = {
  sendMessage: (params: { text: string; files?: OutgoingFilePart[]; metadata?: Record<string, unknown> }) => void
  regenerate: () => void
  addToolResult?: (params: { tool: string; toolCallId: string; output: any }) => void
  stop?: () => void
}

interface CachedChatState {
  version: number
  threads: Thread[]
  openTabs: string[]
  activeThreadId?: string
  messagesByThreadId: MessagesByThread
}

interface ChatThreadsContextValue {
  threads: Thread[]
  openTabs: string[]
  activeThreadId?: string
  messages: UIMessage[]
  status: ThreadStatus
  getThreadMessages: (threadId?: string) => UIMessage[]
  getThreadStatus: (threadId?: string) => ThreadStatus
  getDisplayTitle: (t?: Thread) => string
  refreshThreads: () => Promise<void>
  refreshMessages: (threadId: string, opts?: { force?: boolean }) => Promise<void>
  switchThread: (threadId: string) => Promise<void>
  onNewThread: () => Promise<void>
  closeTab: (threadId: string) => Promise<void>
  deleteThread: (threadId: string) => Promise<void>
  sendMessage: (params: { text: string; files?: FileUIPart[] }) => void
  regenerate: () => void
  stopStreaming: () => void
  registerRuntime: (api: RuntimeApi | null) => void
  setThreadMessages: (params: { threadId: string; items: UIMessage[]; status?: ThreadStatus; mode?: "hydrate" | "replace" }) => void
  getClientContext: () => SmartSiteClientContext
  recordSelection: (selection: SmartSiteClientContext["selection"]) => void
}

/**
 * Constants
 */
const LAST_THREAD_KEY = "smart-site-last-thread"
const OPEN_TABS_KEY = "smart-site-open-tabs"
const TABS_CAP = 8
const CHAT_CACHE_VERSION = 1

const ChatThreadsContext = createContext<ChatThreadsContextValue | undefined>(undefined)

function debugLog(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[chat-threads]", ...args)
  }
}

interface ChatThreadsProviderProps {
  children: React.ReactNode
  isOpen: boolean
  scope: "admin" | "frontend"
}

type PayloadAdminUser = {
  id?: string
  _id?: string
  email?: string
  name?: string
  roles?: string[] | string
  [key: string]: unknown
}

function deriveUploaderId(user?: PayloadAdminUser | null): string | undefined {
  if (!user) return undefined
  if (typeof user.id === "string" && user.id) return user.id
  if (typeof user._id === "string" && user._id) return user._id
  return undefined
}

export function ChatThreadsProvider({ children, isOpen, scope }: ChatThreadsProviderProps) {
  const wasOpenRef = useRef<boolean | null>(null)
  /**
   * Local state
   */
  const [threads, setThreads] = useState<Thread[]>([])
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(undefined)
  const [messagesByThreadId, setMessagesByThreadId] = useState<MessagesByThread>({})

  /**
   * Refs and tokens
   */
  const runtimeRef = useRef<RuntimeApi | null>(null)
  const loadTokensRef = useRef<Record<string, number>>({})
  const threadsRefreshTokenRef = useRef(0)
  const initializedRef = useRef(false)
  const threadsSummaryRef = useRef<string>("")
  const messagesFreshAtRef = useRef<Record<string, number>>({})
  const messagesStateRef = useRef<MessagesByThread>({})
  const cachedStateRef = useRef<CachedChatState | null>(null)
  const selectionRef = useRef<SmartSiteClientContext["selection"]>(null)

  const { user } = useAuth<PayloadAdminUser>()
  const pathname = usePathname()

  /**
   * TTL and fingerprints
   */
  const THREADS_TTL = 10000
  const MESSAGES_TTL = 8000

  /**
   * Summarizers and fingerprints
   */
  function summarizeThreads(list: Thread[]): string {
    try {
      return list.map(t => `${t.id}:${t.title || ""}`).join("|")
    } catch {
      return String(list.length || 0)
    }
  }

  // No message fingerprinting; we rely on keep-alive provider to avoid churn

  /**
   * Titles and derived selectors
   */
  function getDisplayTitle(t?: Thread): string {
    if (!t) return "New Chat"
    const raw = (t.title || "").trim()
    const isDefault = raw.toLowerCase().startsWith("new chat") || raw.toLowerCase().startsWith("new thread")
    if (!raw || isDefault) return "New Chat"
    return raw
  }

  const getActiveMessages = useMemo<UIMessage[]>(() => {
    const key = activeThreadId || ""
    return messagesByThreadId[key]?.items ?? []
  }, [messagesByThreadId, activeThreadId])

  const getActiveStatus: ThreadStatus = useMemo(() => {
    const key = activeThreadId || ""
    return messagesByThreadId[key]?.status || "idle"
  }, [messagesByThreadId, activeThreadId])

  /**
   * Per-thread selectors (for TabsContent rendering)
   */
  const getThreadMessages = useCallback(
    (threadId?: string) => {
      if (!threadId) return [] as UIMessage[]
      return messagesByThreadId[threadId]?.items ?? []
    },
    [messagesByThreadId]
  )

  const getThreadStatus = useCallback(
    (threadId?: string) => (threadId ? messagesByThreadId[threadId]?.status || "idle" : "idle"),
    [messagesByThreadId]
  )

  const readSelectionFromDom = useCallback((): SmartSiteClientContext["selection"] => {
    if (typeof window === "undefined") return null
    const route = window.location.pathname || ""
    const parts = route.split("/").filter(Boolean)
    const collectionsIndex = parts.findIndex(part => part === "collections")
    let collection: string | undefined
    let documentId: string | undefined
    if (collectionsIndex >= 0) {
      collection = parts[collectionsIndex + 1]
      documentId = parts[collectionsIndex + 2]
    }
    const active = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null
    const fieldPath = active?.getAttribute?.("name") || active?.id || undefined
    if (!collection && !documentId && !fieldPath) {
      return null
    }
    return { collection, documentId, fieldPath }
  }, [])

  const getClientContext = useCallback((): SmartSiteClientContext => {
    const now = Date.now()
    const rolesRaw = user?.roles
    const normalizedRoles = Array.isArray(rolesRaw)
      ? rolesRaw.filter((role): role is string => typeof role === "string")
      : typeof rolesRaw === "string"
        ? [rolesRaw]
        : undefined

    const normalizedUser = user
      ? {
          id:
            typeof user.id === "string"
              ? user.id
              : typeof user._id === "string"
                ? user._id
                : undefined,
          displayName:
            typeof user.name === "string"
              ? user.name
              : typeof user.email === "string"
                ? user.email
                : undefined,
          email: typeof user.email === "string" ? user.email : undefined,
          roles: normalizedRoles,
        }
      : undefined

    const selection = selectionRef.current ?? readSelectionFromDom()
    if (!selectionRef.current && selection) {
      selectionRef.current = selection
    }

    return {
      user: normalizedUser ?? null,
      surface: {
        scope,
        pathname: pathname ?? undefined,
      },
      selection: selection ?? null,
      thread: activeThreadId ? { id: activeThreadId } : null,
      request: {
        id: `req-${now}-${Math.random().toString(36).slice(2, 10)}`,
        timestamp: now,
      },
    }
  }, [user, scope, pathname, activeThreadId, readSelectionFromDom])

  const recordSelection = useCallback((selection: SmartSiteClientContext["selection"]) => {
    if (!selection) {
      selectionRef.current = null
      return
    }
    const hasValue = Boolean(selection.collection || selection.documentId || selection.fieldPath)
    selectionRef.current = hasValue ? selection : null
  }, [])

  useEffect(() => {
    recordSelection(null)
  }, [pathname, recordSelection])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    if (process.env.NODE_ENV !== "production") {
      console.log("[chat-threads] current messages", getActiveMessages)
    }
  }, [isOpen, getActiveMessages])

  /**
   * Persistence helpers
   */
  const persistTabs = useCallback((tabs: string[]) => {
    try {
      localStorage.setItem(OPEN_TABS_KEY, JSON.stringify(tabs))
    } catch (error) {
      debugLog("Persist tabs failed", { error, tabs })
    }
  }, [])

  const persistActive = useCallback((id?: string) => {
    try {
      if (!id) return
      localStorage.setItem(LAST_THREAD_KEY, id)
    } catch (error) {
      debugLog("Persist active thread failed", { error, id })
    }
  }, [])

  /**
   * Fetch: threads
   */
  const refreshThreads = useCallback(async () => {
    const token = ++threadsRefreshTokenRef.current
    const list = await listThreads().catch(error => {
      debugLog("listThreads failed", error)
      return []
    })
    if (token !== threadsRefreshTokenRef.current) return
    const summary = summarizeThreads(list)
    if (summary === threadsSummaryRef.current) return
    threadsSummaryRef.current = summary
    setThreads(list)
  }, [])

  const refreshMessages = useCallback(
    async (threadId: string, opts: { force?: boolean } = {}) => {
      const token = (loadTokensRef.current[threadId] || 0) + 1
      loadTokensRef.current[threadId] = token

      const now = Date.now()
      const lastFresh = messagesFreshAtRef.current[threadId] || 0
      const prevState = messagesStateRef.current[threadId]
      const hasCache = Boolean(prevState?.items?.length)

      if (!opts.force && now - lastFresh < MESSAGES_TTL) {
        return
      }

      const msgs = await listThreadMessages(threadId, 50)
        .then(messages => messages.map(normalizeStoredMessage))
        .catch(error => {
          debugLog("listThreadMessages failed", { threadId, error })
          return []
        })
      if (token !== loadTokensRef.current[threadId]) return

      messagesFreshAtRef.current[threadId] = Date.now()

      const isActive = threadId === activeThreadId
      const isStreaming = prevState?.status === "streaming"
      if (isActive && isStreaming) return

      const snapshot = buildToolInvocationSnapshot(prevState?.items)
      const enriched = msgs.map(message => enrichMessageWithSnapshots(message, snapshot))

      setMessagesByThreadId(prev => ({
        ...prev,
        [threadId]: {
          items: enriched,
          status: prev[threadId]?.status || "idle",
          version: (prev[threadId]?.version || 0) + 1,
          updatedAt: Date.now(),
        },
      }))
    },
    [activeThreadId]
  )

  /**
   * Navigation: switch/open/close threads
   */
  const switchThread = useCallback(
    async (threadId: string) => {
      setActiveThreadId(threadId)
      setOpenTabs(prev => {
        const next = Array.from(new Set([...(prev || []), threadId])).slice(-TABS_CAP)
        persistTabs(next)
        return next
      })
      persistActive(threadId)
      // Fetch in background to avoid blocking UI; cached state shows immediately.
      refreshMessages(threadId).catch(error => {
        debugLog("refreshMessages async update failed", { threadId, error })
      })
    },
    [refreshMessages, persistActive, persistTabs]
  )

  const onNewThread = useCallback(async () => {
    const created = await createThread().catch(error => {
      debugLog("createThread failed", error)
      return null
    })
    if (created?.id) {
      await switchThread(created.id)
      await refreshThreads()
    }
  }, [switchThread, refreshThreads])

  const closeTab = useCallback(
    async (threadId: string) => {
      const current = openTabs
      const isLast = current.length <= 1
      const idx = current.indexOf(threadId)
      if (isLast) {
        const created = await createThread().catch(error => {
          debugLog("createThread on final tab failed", error)
          return null
        })
        if (created?.id) {
          setOpenTabs([created.id])
          persistTabs([created.id])
          await switchThread(created.id)
          await refreshThreads()
        }
        return
      }
      const remaining = current.filter(id => id !== threadId)
      setOpenTabs(remaining)
      persistTabs(remaining)
      if (activeThreadId === threadId) {
        const nextId = idx > 0 ? remaining[idx - 1] : remaining[0]
        if (nextId) await switchThread(nextId)
      }
    },
    [openTabs, activeThreadId, switchThread, refreshThreads, persistTabs]
  )

  /**
   * Delete a thread (and close its tab)
   */
  const deleteThread = useCallback(
    async (threadId: string) => {
      await apiDeleteThread(threadId).catch(error => {
        debugLog("deleteThread failed", { threadId, error })
        return false
      })
      setThreads(prev => prev.filter(t => t.id !== threadId))
      setMessagesByThreadId(prev => {
        const { [threadId]: _discard, ...rest } = prev
        return rest
      })
      const current = openTabs
      const remaining = current.filter(id => id !== threadId)
      setOpenTabs(remaining)
      persistTabs(remaining)
      if (activeThreadId === threadId) {
        const idx = current.indexOf(threadId)
        const nextId = remaining[idx - 1] || remaining[0]
        if (nextId) await switchThread(nextId)
        else {
          const created = await createThread().catch(error => {
            debugLog("createThread after delete failed", error)
            return null
          })
          if (created?.id) {
            setOpenTabs([created.id])
            persistTabs([created.id])
            await switchThread(created.id)
          }
        }
      }
      await refreshThreads()
    },
    [openTabs, activeThreadId, switchThread, refreshThreads, persistTabs]
  )

  /**
   * Runtime bridge
   */
  const sendMessage = useCallback(
    (params: { text: string; files?: OutgoingFilePart[] }) => {
      const runtime = runtimeRef.current
      if (!runtime) return

      const threadId = activeThreadId
      const uploaderId = deriveUploaderId(user)

      ;(async () => {
        try {
          let preparedFiles: OutgoingFilePart[] = params.files ? [...params.files] : []
          let metadata: { attachments: { id: string; type: string }[] } | undefined

          if (threadId && preparedFiles.length) {
            const uploadable = preparedFiles.filter(
              (part): part is OutgoingFilePart & { file: File } => part?.file instanceof File
            )

            if (uploadable.length) {
              const results = await uploadChatAttachments({
                threadId,
                files: uploadable.map(part => part.file),
                uploaderId,
              })

              metadata = {
                attachments: results.map(result => ({ id: result.id, type: result.type })),
              }

              let resultIndex = 0
              preparedFiles = preparedFiles.map(part => {
                const { file, ...rest } = part ?? ({} as OutgoingFilePart)
                const upload = file ? results[resultIndex++] : undefined
                if (upload?.clientPreview?.url) {
                  return {
                    ...rest,
                    url: upload.clientPreview.url,
                    mediaType: upload.clientPreview.mediaType,
                    filename: upload.clientPreview.filename ?? rest.filename,
                  }
                }
                return rest
              })
            }
          }

          if (!metadata && preparedFiles.length) {
            preparedFiles = preparedFiles.map(part => {
              const { file, ...rest } = part ?? ({} as OutgoingFilePart)
              return rest
            })
          }

          runtime.sendMessage({
            text: params.text,
            files: preparedFiles.map(part => {
              const { file, ...rest } = part ?? ({} as OutgoingFilePart)
              return rest
            }),
            metadata,
          })
        } catch (error) {
          console.error("[chat-threads] sendMessage error", error)
          const message = error instanceof Error ? error.message : "Failed to send message"
          toast.error(message)
        }
      })()
    },
    [activeThreadId, user]
  )

  const regenerate = useCallback(() => {
    runtimeRef.current?.regenerate()
  }, [])

  const stopStreaming = useCallback(() => {
    const runtime = runtimeRef.current
    runtime?.stop?.()
    const threadId = activeThreadId
    if (!threadId) return

    setMessagesByThreadId(prev => {
      const current = prev[threadId]
      if (!current) {
        return prev
      }

      if (current.status !== "streaming" && current.status !== "submitted") {
        return prev
      }

      return {
        ...prev,
        [threadId]: {
          ...current,
          status: "idle",
          version: (current.version || 0) + 1,
          updatedAt: Date.now(),
        },
      }
    })
  }, [activeThreadId])

  const registerRuntime = useCallback((api: RuntimeApi | null) => {
    runtimeRef.current = api
  }, [])

  const setThreadMessages = useCallback(
    ({ threadId, items, status, mode = "replace" }: { threadId: string; items: UIMessage[]; status?: ThreadStatus; mode?: "hydrate" | "replace" }) => {
      setMessagesByThreadId(prev => {
        const current = prev[threadId]
        const keepExisting = mode === "hydrate" && current?.items?.length
        const nextItems = keepExisting ? current!.items : items
        const nextStatus = status || current?.status || "idle"
        return {
          ...prev,
          [threadId]: {
            items: nextItems,
            status: nextStatus,
            version: (current?.version || 0) + 1,
            updatedAt: Date.now(),
          },
        }
      })
    },
    []
  )

  /**
   * Initialization
   */
  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isOpen
    if (!isOpen || initializedRef.current) {
      return
    }
    ;(async () => {
      const cached = cachedStateRef.current
      let list = Array.isArray(cached?.threads) ? cached!.threads : []
      if (!list.length) {
        list = await listThreads().catch(error => {
          debugLog("listThreads hydrate fallback failed", error)
          return []
        })
      }
      setThreads(list)

      let lastId: string | undefined = cached?.activeThreadId
      if (!lastId) {
        try {
          lastId = localStorage.getItem(LAST_THREAD_KEY) || undefined
        } catch {}
      }

      const storedTabs = (() => {
        if (Array.isArray(cached?.openTabs) && cached!.openTabs.length) {
          return cached!.openTabs.slice(-TABS_CAP)
        }
        try {
          const raw = localStorage.getItem(OPEN_TABS_KEY)
          if (!raw) return []
          const arr = JSON.parse(raw)
          if (Array.isArray(arr)) return arr.slice(-TABS_CAP)
          return []
        } catch (error) {
          debugLog("Restore stored tabs failed", { error })
          return []
        }
      })()

      const exists = lastId && list.some(t => t.id === lastId)

      if (list.length === 0) {
        const created = await createThread().catch(() => null)
        if (created?.id) {
          setOpenTabs(prev => Array.from(new Set([...(storedTabs || []), created.id])).slice(-TABS_CAP))
          setActiveThreadId(created.id)
          persistActive(created.id)
          await refreshMessages(created.id).catch(error => {
            debugLog("refreshMessages on initial create failed", { threadId: created.id, error })
          })
          await refreshThreads().catch(error => {
            debugLog("refreshThreads after initial create failed", error)
          })
        }
      } else {
        const targetId = exists ? (lastId as string) : list[0].id
        const tabs = (storedTabs.length ? storedTabs : [targetId]).slice(-TABS_CAP)
        setOpenTabs(Array.from(new Set([...(tabs || []), targetId])).slice(-TABS_CAP))
        setActiveThreadId(targetId)
        persistActive(targetId)
        refreshMessages(targetId, { force: true }).catch(error => {
          debugLog("refreshMessages on hydrate target failed", { threadId: targetId, error })
        })
        refreshThreads().catch(error => {
          debugLog("refreshThreads during hydrate failed", error)
        })
      }
      initializedRef.current = true
    })()
  }, [isOpen, persistActive, refreshMessages, refreshThreads])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.sessionStorage.getItem(CHAT_CACHE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!parsed || parsed.version !== CHAT_CACHE_VERSION) return
      cachedStateRef.current = parsed

      if (Array.isArray(parsed.threads) && parsed.threads.length) {
        setThreads(parsed.threads)
      }
      if (Array.isArray(parsed.openTabs) && parsed.openTabs.length) {
        setOpenTabs(parsed.openTabs.slice(-TABS_CAP))
      }
      if (typeof parsed.activeThreadId === "string") {
        setActiveThreadId(parsed.activeThreadId)
      }
      if (parsed.messagesByThreadId && typeof parsed.messagesByThreadId === "object") {
        setMessagesByThreadId(parsed.messagesByThreadId as MessagesByThread)
        messagesStateRef.current = parsed.messagesByThreadId as MessagesByThread
      }
    } catch (error) {
      debugLog("Restore session cache failed", { error })
    }
  }, [])

  useEffect(() => {
    messagesStateRef.current = messagesByThreadId
  }, [messagesByThreadId])

  useEffect(() => {
    if (typeof window === "undefined") return
    const timeout = window.setTimeout(() => {
      try {
        const serialized: CachedChatState = {
          version: CHAT_CACHE_VERSION,
          threads,
          openTabs,
          activeThreadId,
          messagesByThreadId: Object.fromEntries(
            Object.entries(messagesByThreadId || {}).map(([id, state]) => {
              const items = Array.isArray(state?.items) ? state.items.slice(-50) : []
              return [
                id,
                {
                  items,
                  status: state?.status || "idle",
                  version: state?.version || 0,
                  updatedAt: state?.updatedAt,
                },
              ]
            })
          ) as MessagesByThread,
        }
        window.sessionStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(serialized))
      } catch (error) {
        debugLog("Write chat session cache failed", { error })
      }
    }, 100)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [threads, openTabs, activeThreadId, messagesByThreadId])

  /**
   * Persist active thread id
   */
  useEffect(() => {
    if (!activeThreadId) return
    try {
      localStorage.setItem(LAST_THREAD_KEY, activeThreadId)
    } catch (error) {
      debugLog("Persist active thread effect failed", { error, activeThreadId })
    }
  }, [activeThreadId])

  /**
   * Context value
   */
  const value: ChatThreadsContextValue = {
    threads,
    openTabs,
    activeThreadId,
    messages: getActiveMessages,
    status: getActiveStatus,
    getThreadMessages,
    getThreadStatus,
    getDisplayTitle,
    refreshThreads,
    refreshMessages,
    switchThread,
    onNewThread,
    closeTab,
    deleteThread,
    sendMessage,
    regenerate,
    stopStreaming,
    registerRuntime,
    setThreadMessages,
    getClientContext,
    recordSelection,
  }

  return <ChatThreadsContext.Provider value={value}>{children}</ChatThreadsContext.Provider>
}

/*************************************************************************/
/*  CHAT THREADS HOOK
/*************************************************************************/

export function useChatThreadsContext() {
  const ctx = useContext(ChatThreadsContext)
  if (!ctx) throw new Error("useChatThreadsContext must be used within ChatThreadsProvider")
  return ctx
}

export function useThreadMessagesBridge(threadId?: string) {
  const { refreshMessages } = useChatThreadsContext()
  useEffect(() => {
    if (!threadId) return
    refreshMessages(threadId).catch(() => {})
  }, [threadId, refreshMessages])
}

/*************************************************************************/
/*  CHAT THREAD HELPERS
/*************************************************************************/

interface ToolInvocationSnapshot {
  result?: unknown
  args?: unknown
  toolName?: unknown
  toolCallId?: unknown
}

function normalizeStoredMessage(message: UIMessage): UIMessage {
  const cloned = { ...message }
  if (Array.isArray(cloned.parts)) {
    cloned.parts = cloned.parts
      .map(part => {
        if (!part || typeof (part as any).type !== "string") {
          return part as UIMessage["parts"][number]
        }
        return restorePartFromData(part as UIMessage["parts"][number])
      })
      .filter(part => {
        const type = typeof (part as any)?.type === "string" ? ((part as any).type as string) : ""
        return type !== "tool-invocation"
      })
  }
  const withInvocations = cloned as UIMessage & {
    toolInvocations?: Array<Record<string, unknown>>
  }
  if ("toolInvocations" in withInvocations) {
    delete withInvocations.toolInvocations
  }
  if (Array.isArray(withInvocations.toolInvocations)) {
    withInvocations.toolInvocations = withInvocations.toolInvocations.map(invocation => {
      const updated = { ...invocation }
      if (typeof updated.state === "string" && updated.state === "streaming") {
        delete updated.state
      }
      return updated
    })
  }
  return withInvocations
}

function restorePartFromData(part: UIMessage["parts"][number]): UIMessage["parts"][number] {
  const record = part as Record<string, unknown>
  const typeValue = typeof record.type === "string" ? (record.type as string) : ""
  if (!typeValue.startsWith("data-")) {
    return part
  }

  const fallbackType = typeValue.replace(/^data-/, "")
  const payload = (record as { data?: unknown }).data

  if (payload && typeof payload === "object") {
    const restored = { ...(payload as Record<string, unknown>) }
    const originalType = typeof restored.originalType === "string" ? (restored.originalType as string) : fallbackType
    delete restored.originalType
    if (!("type" in restored)) {
      (restored as any).type = originalType
    }
    const idValue = typeof (record as any).id === "string" ? ((record as any).id as string) : undefined
    if (idValue && !("id" in restored)) {
      restored.id = idValue
    }
    return restored as UIMessage["parts"][number]
  }

  const fallback = { ...record }
  ;(fallback as any).type = fallbackType
  delete (fallback as any).data
  return fallback as UIMessage["parts"][number]
}

function buildToolInvocationSnapshot(messages: UIMessage[] | undefined) {
  const map = new Map<string, ToolInvocationSnapshot>()
  if (!Array.isArray(messages)) return map
  for (const message of messages) {
    if (Array.isArray(message.parts)) {
      for (const part of message.parts) {
        const callId = (part as any)?.toolInvocation?.toolCallId
        if (typeof callId === "string") {
          map.set(callId, {
            result: (part as any)?.toolInvocation?.result,
            args: (part as any)?.toolInvocation?.args,
            toolName: (part as any)?.toolInvocation?.toolName,
            toolCallId: callId,
          })
        }
      }
    }
    const invocations = (message as any)?.toolInvocations as Array<Record<string, unknown>> | undefined
    if (Array.isArray(invocations)) {
      for (const invocation of invocations) {
        const callId = typeof invocation.toolCallId === "string" ? invocation.toolCallId : undefined
        if (callId && !map.has(callId)) {
          map.set(callId, {
            result: invocation.result,
            args: invocation.args,
            toolName: invocation.toolName,
            toolCallId: callId,
          })
        }
      }
    }
  }
  return map
}

function enrichMessageWithSnapshots(message: UIMessage, snapshot: Map<string, ToolInvocationSnapshot>): UIMessage {
  const enriched: UIMessage & {
    toolInvocations?: Array<Record<string, unknown>>
  } = { ...message }

  if (Array.isArray(enriched.parts)) {
    enriched.parts = enriched.parts.map(part => {
      const callId = (part as any)?.toolInvocation?.toolCallId
      if (typeof callId === "string" && snapshot.has(callId)) {
        const snap = snapshot.get(callId)!
        const mergedInvocation = {
          ...(part as any).toolInvocation,
          ...snap,
        }
        return {
          ...(part as any),
          toolInvocation: mergedInvocation,
        } as UIMessage["parts"][number]
      }
      return part
    })
  }

  const invocations = (enriched.toolInvocations ?? []) as Array<Record<string, unknown>>
  if (Array.isArray(invocations) && invocations.length) {
    enriched.toolInvocations = invocations.map(invocation => {
      const callId = typeof invocation.toolCallId === "string" ? invocation.toolCallId : undefined
      if (callId && snapshot.has(callId)) {
        const snap = snapshot.get(callId)!
        return { ...invocation, ...snap }
      }
      return invocation
    })
  }

  return enriched
}
