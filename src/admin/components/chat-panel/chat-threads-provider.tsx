"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createThread, listThreadMessages, listThreads, deleteThread as apiDeleteThread, type Thread } from "@/admin/lib/ai/threads"

/*************************************************************************/
/*  CHAT THREADS PROVIDER - LOCAL TO CHAT PANEL
/*************************************************************************/

type ThreadStatus = "idle" | "loading" | "streaming" | "submitted" | "error"

/**
 * Messages state shape
 */
type MessagesState = {
  items: any[]
  status: ThreadStatus
  version: number
  updatedAt?: number
}

type MessagesByThread = Record<string, MessagesState>

type RuntimeApi = {
  sendMessage: (params: { text: string; files?: any[] }) => void
  regenerate: () => void
  addToolResult?: (params: { tool: string; toolCallId: string; output: any }) => void
}

interface ChatThreadsContextValue {
  threads: Thread[]
  openTabs: string[]
  activeThreadId?: string
  messages: any[]
  status: ThreadStatus
  getThreadMessages: (threadId?: string) => any[]
  getThreadStatus: (threadId?: string) => ThreadStatus
  getDisplayTitle: (t?: Thread) => string
  refreshThreads: () => Promise<void>
  refreshMessages: (threadId: string, opts?: { force?: boolean }) => Promise<void>
  switchThread: (threadId: string) => Promise<void>
  onNewThread: () => Promise<void>
  closeTab: (threadId: string) => Promise<void>
  deleteThread: (threadId: string) => Promise<void>
  sendMessage: (params: { text: string; files?: any[] }) => void
  regenerate: () => void
  registerRuntime: (api: RuntimeApi | null) => void
  setThreadMessages: (params: { threadId: string; items: any[]; status?: ThreadStatus; mode?: "hydrate" | "replace" }) => void
}

/**
 * Constants
 */
const LAST_THREAD_KEY = "smart-site-last-thread"
const OPEN_TABS_KEY = "smart-site-open-tabs"
const TABS_CAP = 8

const ChatThreadsContext = createContext<ChatThreadsContextValue | undefined>(undefined)

export function ChatThreadsProvider({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) {
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

  const getActiveMessages = useMemo(() => {
    return messagesByThreadId[activeThreadId || ""]?.items || []
  }, [messagesByThreadId, activeThreadId])

  const getActiveStatus: ThreadStatus = useMemo(() => {
    return messagesByThreadId[activeThreadId || ""]?.status || "idle"
  }, [messagesByThreadId, activeThreadId])

  /**
   * Per-thread selectors (for TabsContent rendering)
   */
  const getThreadMessages = useCallback(
    (threadId?: string) => (threadId ? messagesByThreadId[threadId]?.items || [] : []),
    [messagesByThreadId]
  )

  const getThreadStatus = useCallback(
    (threadId?: string) => (threadId ? messagesByThreadId[threadId]?.status || "idle" : "idle"),
    [messagesByThreadId]
  )

  /**
   * Persistence helpers
   */
  const persistTabs = useCallback((tabs: string[]) => {
    try {
      localStorage.setItem(OPEN_TABS_KEY, JSON.stringify(tabs))
    } catch {}
  }, [])

  const persistActive = useCallback((id?: string) => {
    try {
      if (!id) return
      localStorage.setItem(LAST_THREAD_KEY, id)
    } catch {}
  }, [])

  /**
   * Fetch: threads
   */
  const refreshThreads = useCallback(async () => {
    const token = ++threadsRefreshTokenRef.current
    const list = await listThreads().catch(() => [])
    if (token !== threadsRefreshTokenRef.current) return
    const summary = summarizeThreads(list)
    if (summary === threadsSummaryRef.current) return
    threadsSummaryRef.current = summary
    setThreads(list)
  }, [])

  /**
   * Fetch: messages with TTL + fingerprint guard
   */
  const refreshMessages = useCallback(
    async (threadId: string, opts: { force?: boolean } = {}) => {
      const token = (loadTokensRef.current[threadId] || 0) + 1
      loadTokensRef.current[threadId] = token

      const now = Date.now()
      const lastFresh = messagesFreshAtRef.current[threadId] || 0
      const prevState = messagesByThreadId[threadId]
      const hasCache = Boolean(prevState?.items?.length)

      if (!opts.force && now - lastFresh < MESSAGES_TTL) {
        return
      }

      if (!hasCache) {
        setMessagesByThreadId(prev => ({
          ...prev,
          [threadId]: {
            items: prev[threadId]?.items || [],
            status: prev[threadId]?.status === "streaming" ? "streaming" : "loading",
            version: (prev[threadId]?.version || 0) + 1,
            updatedAt: prev[threadId]?.updatedAt,
          },
        }))
      }

      const msgs = await listThreadMessages(threadId, 50).catch(() => [])
      if (token !== loadTokensRef.current[threadId]) return

      messagesFreshAtRef.current[threadId] = Date.now()

      const isActive = threadId === activeThreadId
      const isStreaming = prevState?.status === "streaming"
      if (isActive && isStreaming) return

      setMessagesByThreadId(prev => ({
        ...prev,
        [threadId]: {
          items: msgs,
          status: prev[threadId]?.status || "idle",
          version: (prev[threadId]?.version || 0) + 1,
          updatedAt: Date.now(),
        },
      }))
    },
    [messagesByThreadId, activeThreadId]
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
      refreshMessages(threadId).catch(() => {})
    },
    [refreshMessages, persistActive, persistTabs]
  )

  const onNewThread = useCallback(async () => {
    const created = await createThread().catch(() => null)
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
        const created = await createThread().catch(() => null)
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
      await apiDeleteThread(threadId).catch(() => false)
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
          const created = await createThread().catch(() => null)
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
  const sendMessage = useCallback((params: { text: string; files?: any[] }) => {
    runtimeRef.current?.sendMessage(params)
  }, [])

  const regenerate = useCallback(() => {
    runtimeRef.current?.regenerate()
  }, [])

  const registerRuntime = useCallback((api: RuntimeApi | null) => {
    runtimeRef.current = api
  }, [])

  /**
   * Initialization
   */
  useEffect(() => {
    if (!isOpen || initializedRef.current) return
    ;(async () => {
      const list = await listThreads().catch(() => [])
      setThreads(list)
      let lastId: string | undefined
      try {
        lastId = localStorage.getItem(LAST_THREAD_KEY) || undefined
      } catch {}
      const storedTabs: string[] = (() => {
        try {
          const raw = localStorage.getItem(OPEN_TABS_KEY)
          if (!raw) return []
          const arr = JSON.parse(raw)
          if (Array.isArray(arr)) return arr.slice(-TABS_CAP)
          return []
        } catch {
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
          await refreshMessages(created.id)
          await refreshThreads()
        }
      } else {
        const targetId = exists ? (lastId as string) : list[0].id
        const tabs = (storedTabs.length ? storedTabs : [targetId]).slice(-TABS_CAP)
        setOpenTabs(Array.from(new Set([...(tabs || []), targetId])).slice(-TABS_CAP))
        setActiveThreadId(targetId)
        persistActive(targetId)
        await refreshMessages(targetId)
      }
      initializedRef.current = true
    })()
  }, [isOpen])

  /**
   * Persist active thread id
   */
  useEffect(() => {
    if (!activeThreadId) return
    try {
      localStorage.setItem(LAST_THREAD_KEY, activeThreadId)
    } catch {}
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
    registerRuntime,
    setThreadMessages: useCallback(({ threadId, items, status, mode = "replace" }) => {
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
    }, []),
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
