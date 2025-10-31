"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/admin/components/ui/button"
import { toast } from "sonner"

import "./access-gate.scss"

type WorkspaceStatus = "loading" | "active" | "pending" | "inactive" | "suspended" | "unauthorized" | "error"

interface StatusResponse {
  enabled: boolean
  reason: string | null
  status: WorkspaceStatus
  validUntil: string | null
}

const STATUS_ENDPOINT = "/api/ai/status"
const APPLY_ENDPOINT = "/api/ai/apply"

function normalizeStatus(value: string | null, enabled: boolean): WorkspaceStatus {
  if (value === "active" || enabled) return "active"
  if (value === "pending") return "pending"
  if (value === "suspended") return "suspended"
  if (value === "unauthorized") return "unauthorized"
  if (value === "error") return "error"
  return "inactive"
}

function toggleContentVisibility(isActive: boolean) {
  if (typeof document === "undefined") return
  const containers = document.querySelectorAll<HTMLElement>(".ai-settings-content")
  containers.forEach(container => {
    if (isActive) {
      container.style.removeProperty("display")
      container.classList.remove("ai-settings-content--hidden")
    } else {
      container.style.display = "none"
      container.classList.add("ai-settings-content--hidden")
    }
  })
}

export function AISettingsAccessGate() {
  const [status, setStatus] = useState<WorkspaceStatus>("loading")
  const [reason, setReason] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(STATUS_ENDPOINT, { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Status request failed (${response.status})`)
      }
      const data = (await response.json()) as StatusResponse
      const resolvedStatus = normalizeStatus(data?.status ?? null, data?.enabled ?? false)
      setStatus(resolvedStatus)
      setReason(data?.reason ?? null)
    } catch (error) {
      setStatus("error")
      setReason(error instanceof Error ? error.message : "Unknown error")
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    toggleContentVisibility(status === "active")
  }, [status])

  const handleApply = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(APPLY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.details || data?.error || `Apply request failed (${response.status})`)
      }

      const data = (await response.json()) as StatusResponse
      const resolvedStatus = normalizeStatus(data?.status ?? null, data?.enabled ?? false)
      setStatus(resolvedStatus)
      setReason(data?.reason ?? null)

      if (resolvedStatus === "pending") {
        toast.success("Application submitted. We'll notify you once it's approved.")
      } else if (resolvedStatus === "active") {
        toast.success("AI workspace activated.")
      } else {
        toast("AI workspace status updated.")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit application.")
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const description = useMemo(() => {
    switch (status) {
      case "pending":
        return "Your request has been received. We'll activate your workspace shortly."
      case "suspended":
        return "This workspace is suspended. Contact Wild Creative for assistance."
      case "unauthorized":
        return "Your credentials were rejected. Regenerate your AI agent or contact support."
      case "error":
        return "We couldn't reach the AI backend. Please try again in a moment."
      case "inactive":
        return "Activate the Smart Site AI workspace to unlock the assistant and automation features."
      case "loading":
        return "Checking workspace status..."
      default:
        return reason ?? ""
    }
  }, [status, reason])

  if (status === "active") {
    return null
  }

  const showApplyButton = status === "inactive" || status === "pending"
  const showRetryButton = status === "error" || status === "unauthorized"
  const showRefreshButton = status === "pending" || status === "suspended"

  const className = ["ai-settings-gate"]
  if (status !== "loading") {
    className.push("ai-settings-gate--ready")
  }

  return (
    <div className={className.join(" ")} data-ai-status={status}>
      <div className="ai-settings-gate__panel">
        <div className="ai-settings-gate__header">
          <h2>Smart Site AI Workspace</h2>
          <p>{description}</p>
        </div>

        {reason && status !== "inactive" && status !== "loading" && (
          <div className="ai-settings-gate__reason">{reason}</div>
        )}

        <div className="ai-settings-gate__actions">
          {showApplyButton && (
            <Button onClick={handleApply} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Apply for AI Access"}
            </Button>
          )}
          {showRetryButton && (
            <Button variant="outline" onClick={handleApply} disabled={isSubmitting}>
              {isSubmitting ? "Retrying..." : "Try Again"}
            </Button>
          )}
          {showRefreshButton && (
            <Button variant="outline" onClick={() => void fetchStatus()} disabled={isSubmitting}>
              Refresh status
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
