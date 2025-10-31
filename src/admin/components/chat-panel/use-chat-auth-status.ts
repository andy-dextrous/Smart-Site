"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

export type ChatAuthStatus = "unknown" | "loading" | "authenticated" | "unauthenticated"

export function useChatAuthStatus(enabled: boolean) {
  const [status, setStatus] = useState<ChatAuthStatus>("unknown")

  const check = useCallback(async () => {
    if (typeof window === "undefined") return "unknown" as ChatAuthStatus
    if (!enabled) {
      setStatus("unauthenticated")
      return "unauthenticated" as ChatAuthStatus
    }
    setStatus(prev => (prev === "authenticated" ? prev : "loading"))
    try {
      const response = await fetch("/api/users/me", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })
      if (response.ok) {
        setStatus("authenticated")
        return "authenticated" as ChatAuthStatus
      }
      setStatus("unauthenticated")
      return "unauthenticated" as ChatAuthStatus
    } catch {
      setStatus("unauthenticated")
      return "unauthenticated" as ChatAuthStatus
    }
  }, [enabled])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!enabled) return
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      check().catch(() => {})
    })
    return () => {
      cancelled = true
    }
  }, [check, enabled])

  const derivedStatus = useMemo<ChatAuthStatus>(() => {
    if (!enabled) {
      return "unauthenticated"
    }
    return status
  }, [enabled, status])

  return { status: derivedStatus, refresh: check }
}
