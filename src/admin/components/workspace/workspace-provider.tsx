"use client"

import dynamic from "next/dynamic"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

import { useAIContext } from "@/admin/payload/components/providers/ai-provider-client"
import { useChatStore } from "@/admin/components/chat-panel/chat-store"

import "./workspace-shell.css"

const DEFAULT_WIDTH = 420
const MIN_WIDTH = 320
const MAX_WIDTH = 768
const WIDTH_STORAGE_KEY = "smart-site-workspace-sidebar"
const ACTIVE_STORAGE_KEY = "smart-site-workspace-enabled"

type WorkspaceScope = "admin" | "frontend"

type WorkspaceContextValue = {
  isActive: boolean
  isAvailable: boolean
  openWorkspace: () => void
  closeWorkspace: () => void
  toggleWorkspace: () => void
  sidebarWidth: number
  setSidebarWidth: (value: number) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const WorkspaceSidebar = dynamic(
  () => import("./workspace-sidebar").then(module => module.WorkspaceSidebar),
  { ssr: false, loading: () => null }
)

function clampWidth(value: number) {
  return Math.min(Math.max(value, MIN_WIDTH), MAX_WIDTH)
}

function readStoredWidth() {
  if (typeof window === "undefined") {
    return DEFAULT_WIDTH
  }
  try {
    const stored = window.localStorage.getItem(WIDTH_STORAGE_KEY)
    if (!stored) {
      return DEFAULT_WIDTH
    }
    const parsed = Number.parseInt(stored, 10)
    if (Number.isNaN(parsed)) {
      return DEFAULT_WIDTH
    }
    return clampWidth(parsed)
  } catch {
    return DEFAULT_WIDTH
  }
}

function readStoredActive() {
  if (typeof window === "undefined") {
    return false
  }
  try {
    const stored = window.localStorage.getItem(ACTIVE_STORAGE_KEY)
    if (!stored) {
      return false
    }
    const value = stored.toLowerCase()
    return value === "1" || value === "true" || value === "on"
  } catch {
    return false
  }
}

interface WorkspaceProviderProps {
  children: React.ReactNode
  scope?: WorkspaceScope
}

export function WorkspaceProvider({ children, scope = "frontend" }: WorkspaceProviderProps) {
  const [innerActive, setInnerActive] = useState(() => readStoredActive())
  const [sidebarWidth, setSidebarWidthState] = useState(() => readStoredWidth())
  const [isResizing, setIsResizing] = useState(false)
  const dragStartXRef = useRef(0)
  const dragStartWidthRef = useRef(sidebarWidth)
  const { openChat, closeChat, status } = useAIContext()
  const chatOpen = useChatStore(state => state.isOpen)
  const previousChatOpenRef = useRef(chatOpen)
  const workspaceAvailable = status === "active"
  const isActive = workspaceAvailable && innerActive
  const isSidebarVisible = workspaceAvailable && innerActive

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }
    const root = document.documentElement
    const body = document.body
    const adminOffset = body.style.paddingTop || window.getComputedStyle(body).paddingTop
    if (adminOffset) {
      root.style.setProperty("--workspace-admin-offset", adminOffset)
    }
    if (workspaceAvailable && isActive) {
      root.dataset.workspaceShell = "active"
      root.style.setProperty("--workspace-sidebar-width", `${sidebarWidth}px`)
    } else {
      delete root.dataset.workspaceShell
      root.style.removeProperty("--workspace-sidebar-width")
    }
  }, [workspaceAvailable, isActive, sidebarWidth])

  useEffect(() => {
    return () => {
      if (typeof document === "undefined") {
        return
      }
      const root = document.documentElement
      delete root.dataset.workspaceShell
      root.style.removeProperty("--workspace-sidebar-width")
      root.style.removeProperty("--workspace-admin-offset")
    }
  }, [])

  useEffect(() => {
    if (!workspaceAvailable || !innerActive) {
      closeChat()
      return
    }
    openChat()
  }, [workspaceAvailable, innerActive, openChat, closeChat])

  useEffect(() => {
    if (workspaceAvailable && innerActive && !chatOpen) {
      openChat()
    }
  }, [workspaceAvailable, innerActive, chatOpen, openChat])

  useEffect(() => {
    if (!workspaceAvailable) {
      previousChatOpenRef.current = chatOpen
      return
    }
    if (!innerActive && chatOpen && !previousChatOpenRef.current) {
      queueMicrotask(() => {
        setInnerActive(true)
      })
    }
    previousChatOpenRef.current = chatOpen
  }, [workspaceAvailable, innerActive, chatOpen])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    try {
      window.localStorage.setItem(
        ACTIVE_STORAGE_KEY,
        innerActive ? "1" : "0"
      )
    } catch {}
  }, [innerActive])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    try {
      window.localStorage.setItem(WIDTH_STORAGE_KEY, sidebarWidth.toString())
    } catch {}
  }, [sidebarWidth])

  useEffect(() => {
    if (!isResizing || !isSidebarVisible) {
      return
    }
    const handleMove = (event: PointerEvent) => {
      const delta = event.clientX - dragStartXRef.current
      const next = dragStartWidthRef.current - delta
      setSidebarWidthState(clampWidth(next))
    }
    const handleUp = () => {
      setIsResizing(false)
    }
    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
    }
  }, [isResizing, isSidebarVisible])

  const beginResize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isSidebarVisible) {
        return
      }
      if (event.button !== 0) {
        return
      }
      event.preventDefault()
      dragStartXRef.current = event.clientX
      dragStartWidthRef.current = sidebarWidth
      setIsResizing(true)
    },
    [sidebarWidth, isSidebarVisible]
  )

  const openWorkspace = useCallback(() => {
    if (!workspaceAvailable) {
      return
    }
    setInnerActive(true)
  }, [workspaceAvailable])

  const closeWorkspace = useCallback(() => {
    setInnerActive(false)
  }, [])

  const toggleWorkspace = useCallback(() => {
    if (!workspaceAvailable) {
      setInnerActive(false)
      return
    }
    setInnerActive(previous => !previous)
  }, [workspaceAvailable])

  const updateSidebarWidth = useCallback((value: number) => {
    setSidebarWidthState(clampWidth(value))
  }, [])

  const contextValue = useMemo<WorkspaceContextValue>(
    () => ({
      isActive,
      isAvailable: workspaceAvailable,
      openWorkspace,
      closeWorkspace,
      toggleWorkspace,
      sidebarWidth,
      setSidebarWidth: updateSidebarWidth,
    }),
    [workspaceAvailable, isActive, openWorkspace, closeWorkspace, toggleWorkspace, sidebarWidth, updateSidebarWidth]
  )
  const gridTemplateColumns = isSidebarVisible ? `minmax(0, 1fr) ${sidebarWidth}px` : "minmax(0, 1fr)"

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const global = window as typeof window & {
      __smartSiteWorkspaceToggle?: () => void
      __smartSiteWorkspaceOpen?: () => void
      __smartSiteWorkspaceClose?: () => void
    }
    global.__smartSiteWorkspaceToggle = toggleWorkspace
    global.__smartSiteWorkspaceOpen = openWorkspace
    global.__smartSiteWorkspaceClose = closeWorkspace
    return () => {
      delete global.__smartSiteWorkspaceToggle
      delete global.__smartSiteWorkspaceOpen
      delete global.__smartSiteWorkspaceClose
    }
  }, [toggleWorkspace, openWorkspace, closeWorkspace])

  return (
    <WorkspaceContext.Provider value={contextValue}>
      <div className="workspace-shell" data-state={isSidebarVisible ? "active" : "inactive"}>
        <div className="workspace-shell__grid" style={{ gridTemplateColumns }}>
          <div className="workspace-shell__preview">{children}</div>
          {isSidebarVisible ? (
            <aside className="workspace-shell__sidebar" aria-label="AI workspace sidebar">
              <div
                role="separator"
                aria-orientation="vertical"
                className="workspace-shell__resize-handle"
                data-resizing={isResizing && isSidebarVisible ? "true" : "false"}
                onPointerDown={beginResize}
              >
                <span className="workspace-shell__resize-grip" />
              </div>
              <div className="workspace-shell__sidebar-panel">
                <WorkspaceSidebar scope={scope} onClose={closeWorkspace} />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}

export function useWorkspaceOptional() {
  return useContext(WorkspaceContext)
}
