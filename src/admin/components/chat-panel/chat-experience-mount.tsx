"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import { Sparkles, X } from "lucide-react"

import { ChatPanelCore } from "@/admin/components/chat-panel/chat-panel-core"
import { useAIContext } from "@/admin/payload/components/providers/ai-provider-client"
import { useChatAuthStatus } from "@/admin/components/chat-panel/use-chat-auth-status"
import { useSmoothContext } from "@/providers/gsap"
import { injectChatStyles } from "@/admin/components/chat-panel/chat-styles"
import { getDocumentTheme } from "@/admin/components/chat-panel/get-document-theme"

const HOST_ID = "smart-site-chat-host"
const HOST_CLASS = "chat-host"
const HOST_OPEN_CLASS = "chat-host--open"
const HOST_Z_INDEX = 2147483647
const LAUNCHER_CLASS = "chat-launcher"
const PANEL_ANIMATION_DURATION = 260

export const chatLauncherStyles = /* css */ `
.chat-launcher {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  pointer-events: auto;
}

.chat-launcher__button {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--chat-color-accent) !important;
  color: var(--chat-color-text-inverse);
  box-shadow: 0 22px 44px rgba(79, 55, 251, 0.42);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.chat-launcher__button--open {
  opacity: 0.9;
}

.chat-launcher__button:hover,
.chat-launcher__button:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 28px 52px rgba(79, 55, 251, 0.48);
  outline: none;
}

.chat-root[data-theme="dark"] .chat-launcher__button,
[data-chat-panel-root][data-theme="dark"] .chat-launcher__button {
  box-shadow: 0 26px 58px rgba(21, 17, 48, 0.62);
}

.chat-launcher__button svg {
  width: 28px;
  height: 28px;
  color: var(--chat-color-text-inverse);
}

.chat-launcher__button svg path,
.chat-launcher__button svg circle,
.chat-launcher__button svg line,
.chat-launcher__button svg polyline,
.chat-launcher__button svg polygon {
  stroke: var(--chat-color-text-inverse);
  fill: none;
}

.chat-launcher__cta {
  background: var(--chat-color-layer-0);
  color: var(--chat-color-text-primary);
  border: 1px solid var(--chat-color-border);
  border-radius: var(--chat-radius-md);
  padding: 10px 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--chat-shadow-sm);
  transition: border-color 0.2s ease, color 0.2s ease;
}

.chat-launcher__cta:hover {
  border-color: var(--chat-color-accent);
  color: var(--chat-color-accent);
}
`

export function ChatExperienceMount({ scope }: { scope: "admin" | "frontend" }) {
  const { isEnabled, isChatOpen, toggleChat, closeChat } = useAIContext()
  const requireAuth = true
  const { status, refresh } = useChatAuthStatus(requireAuth ? isEnabled : false)
  const { smootherInstance } = useSmoothContext()
  const pathname = usePathname()
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [shouldRenderPanelDelayed, setShouldRenderPanelDelayed] = useState(false)
  const themeObserverRef = useRef<MutationObserver | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }
    const existing = document.getElementById(HOST_ID) as HTMLDivElement | null
    const ensureHostStyles = (element: HTMLDivElement) => {
      element.dataset.scope = scope
      element.classList.add(HOST_CLASS)
      element.style.position = "fixed"
      element.style.top = "0"
      element.style.right = "0"
      element.style.bottom = "0"
      element.style.left = "0"
      element.style.display = "flex"
      element.style.justifyContent = "flex-end"
      element.style.alignItems = "flex-end"
      element.style.pointerEvents = "auto"
      element.style.zIndex = String(HOST_Z_INDEX)
    }

    if (existing) {
      ensureHostStyles(existing)
      setHost(existing)
      return
    }
    const node = document.createElement("div")
    node.id = HOST_ID
    ensureHostStyles(node)
    document.body.appendChild(node)
    setHost(node)
  }, [scope])

  useEffect(() => {
    if (!host) {
      return
    }
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" })
    injectChatStyles(shadow)
    if (!shadow.getElementById("smart-site-chat-launcher-styles")) {
      const style = document.createElement("style")
      style.id = "smart-site-chat-launcher-styles"
      style.textContent = chatLauncherStyles
      shadow.appendChild(style)
    }
    let root = shadow.querySelector<HTMLElement>(".chat-root")
    if (!root) {
      root = document.createElement("div")
      root.className = "chat-root"
      shadow.appendChild(root)
    }
    root.dataset.theme = getDocumentTheme()
    setPortalTarget(root)

    if (themeObserverRef.current) {
      themeObserverRef.current.disconnect()
      themeObserverRef.current = null
    }
    if (typeof document !== "undefined") {
      const observer = new MutationObserver(() => {
        requestAnimationFrame(() => {
          root!.dataset.theme = getDocumentTheme()
        })
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      })
      themeObserverRef.current = observer
    }

    return () => {
      if (themeObserverRef.current) {
        themeObserverRef.current.disconnect()
        themeObserverRef.current = null
      }
    }
  }, [host])

  const wasEnabledRef = useRef(isEnabled)

  useEffect(() => {
    if (wasEnabledRef.current && !isEnabled && isChatOpen) {
      closeChat()
    }
    wasEnabledRef.current = isEnabled
  }, [isEnabled, isChatOpen, closeChat])

  useEffect(() => {
    if (pathname === "/admin/login" && isChatOpen) {
      closeChat()
    }
  }, [pathname, isChatOpen, closeChat])

  useEffect(() => {
    if (status === "unauthenticated" && isChatOpen) {
      closeChat()
    }
  }, [status, isChatOpen, closeChat])

  const redirectToLogin = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }
    const target = new URL("/admin/login", window.location.origin)
    target.searchParams.set("redirect", window.location.href)
    window.location.assign(target.toString())
  }, [])

  const handleToggle = useCallback(() => {
    if (requireAuth) {
      if (status === "unauthenticated") {
        redirectToLogin()
        return
      }
      if (status === "loading" || status === "unknown") {
        refresh().catch(() => {})
        return
      }
    }
    toggleChat()
  }, [requireAuth, status, toggleChat, refresh, redirectToLogin])

  const launcher = useMemo(() => {
    if (!isEnabled) {
      return null
    }
    if (requireAuth && (status === "loading" || status === "unknown")) {
      return null
    }
    if (requireAuth && status === "unauthenticated") {
      return (
        <div className={LAUNCHER_CLASS}>
          <button className="chat-launcher__cta" onClick={redirectToLogin} type="button">
            <Sparkles aria-hidden />
            Log in to use Smart Site Assistant
          </button>
        </div>
      )
    }

    const LauncherIcon = isChatOpen ? X : Sparkles

    return (
      <div className={LAUNCHER_CLASS}>
        <button
          className={isChatOpen ? "chat-launcher__button chat-launcher__button--open" : "chat-launcher__button"}
          onClick={handleToggle}
          title={isChatOpen ? "Close Smart Site Assistant" : "Smart Site Assistant (⌘L)"}
          type="button"
        >
          <LauncherIcon aria-hidden />
          <span className="chat-sr-only">{isChatOpen ? "Close assistant" : "Open assistant"}</span>
        </button>
      </div>
    )
  }, [handleToggle, isChatOpen, isEnabled, redirectToLogin, requireAuth, status])

  const shouldRenderPanel = (!requireAuth || status === "authenticated") && isChatOpen

  useLayoutEffect(() => {
    if (shouldRenderPanel) {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      setShouldRenderPanelDelayed(true)
      return
    }

    if (!shouldRenderPanelDelayed) {
      return
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setShouldRenderPanelDelayed(false)
      closeTimeoutRef.current = null
    }, PANEL_ANIMATION_DURATION)

    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [shouldRenderPanel, shouldRenderPanelDelayed])

  useEffect(() => {
    if (!host) {
      return
    }
    if (shouldRenderPanelDelayed) {
      host.classList.add(HOST_OPEN_CLASS)
      host.style.top = "0"
      host.style.right = "0"
      host.style.bottom = "0"
      host.style.left = "0"
      host.style.width = "100%"
      host.style.height = "100%"
      host.style.pointerEvents = "auto"
    } else {
      host.classList.remove(HOST_OPEN_CLASS)
      host.style.top = "auto"
      host.style.left = "auto"
      host.style.right = "0"
      host.style.bottom = "0"
      host.style.width = "0"
      host.style.height = "0"
      host.style.pointerEvents = "auto"
    }
  }, [host, shouldRenderPanelDelayed])

  useEffect(() => {
    if (!host || !shouldRenderPanel) {
      return
    }
    const stopPropagation = (event: Event) => {
      event.stopPropagation()
    }
    const options: AddEventListenerOptions = { passive: true }
    host.addEventListener("wheel", stopPropagation, options)
    host.addEventListener("touchmove", stopPropagation, options)
    host.addEventListener("scroll", stopPropagation, options)
    return () => {
      host.removeEventListener("wheel", stopPropagation, options)
      host.removeEventListener("touchmove", stopPropagation, options)
      host.removeEventListener("scroll", stopPropagation, options)
    }
  }, [host, shouldRenderPanel])

  useEffect(() => {
    if (typeof document === "undefined" || !shouldRenderPanel) {
      return
    }
    const prevDocOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = prevDocOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [shouldRenderPanel])

  useEffect(() => {
    const smoother = smootherInstance as any
    if (!smoother) {
      return
    }
    const setPaused = (value: boolean) => {
      try {
        if (value) {
          if (typeof smoother.paused === "function") smoother.paused(true)
          else if (typeof smoother.pause === "function") smoother.pause()
          if (typeof smoother.effects === "function") {
            const effects = smoother.effects()
            if (Array.isArray(effects)) {
              effects.forEach((effect: any) => effect?.disable?.())
            }
          }
        } else {
          if (typeof smoother.paused === "function") smoother.paused(false)
          else if (typeof smoother.resume === "function") smoother.resume()
          if (typeof smoother.effects === "function") {
            const effects = smoother.effects()
            if (Array.isArray(effects)) {
              effects.forEach((effect: any) => effect?.enable?.())
            }
          }
        }
      } catch {
      }
    }
    setPaused(shouldRenderPanel)
    return () => setPaused(false)
  }, [shouldRenderPanel, smootherInstance])

  if (!portalTarget || !host || !isEnabled) {
    return null
  }

  return createPortal(
    <>
      {shouldRenderPanelDelayed ? <ChatPanelCore isOpen={shouldRenderPanel} onClose={closeChat} /> : null}
      {launcher}
    </>,
    portalTarget
  )
}
