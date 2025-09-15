"use client"

/*************************************************************************/
/*  CLIENT TOOL CALL HANDLER
/*************************************************************************/

type AddToolResult = (params: { tool: string; toolCallId: string; output: any }) => void

type ClientToolCall = {
  toolName: string
  toolCallId: string
  input?: Record<string, any>
}

export function getOnToolCallHandler(addToolResult: AddToolResult) {
  return async function onToolCall({ toolCall }: { toolCall: ClientToolCall }) {
    try {
      const { toolName, toolCallId, input } = toolCall

      function submit(output: any) {
        addToolResult({ tool: toolName, toolCallId, output })
      }

      switch (toolName) {
        // Removed legacy: showAlert, consoleLog, scrollToTop (replaced by showToast / scrollTo)

        case "navigateTo": {
          const { path, newTab } = input || {}
          if (typeof window !== "undefined" && typeof path === "string") {
            if (newTab) {
              window.open(path, "_blank")
            } else {
              window.location.assign(path)
            }
            submit({ success: true })
          } else {
            submit({ success: false })
          }
          break
        }

        case "openPreview": {
          const { url, newTab = true } = input || {}
          if (typeof window !== "undefined" && typeof url === "string") {
            window.open(url, newTab ? "_blank" : "_self")
            submit({ opened: true })
          } else {
            submit({ opened: false })
          }
          break
        }

        case "scrollTo": {
          const { selector, top, behavior = "smooth" } = input || {}
          let previousPosition = 0
          if (typeof window !== "undefined") {
            previousPosition = window.scrollY || 0
            if (selector && typeof selector === "string") {
              const el = document.querySelector(selector)
              if (el && "scrollIntoView" in el) {
                ;(el as any).scrollIntoView({ behavior })
                submit({ success: true, previousPosition })
                break
              }
            }
            if (typeof top === "number") {
              window.scrollTo({ top, behavior })
              submit({ success: true, previousPosition })
              break
            }
          }
          submit({ success: false, previousPosition })
          break
        }

        case "focusField": {
          const { fieldPath } = input || {}
          let focused = false
          if (typeof window !== "undefined" && typeof fieldPath === "string") {
            const el =
              (document.querySelector(`[name="${CSS.escape(fieldPath)}"]`) as HTMLElement | null) ||
              (document.getElementById(fieldPath) as HTMLElement | null) ||
              (document.querySelector(`[data-field="${CSS.escape(fieldPath)}"]`) as HTMLElement | null)
            if (el && typeof (el as any).focus === "function") {
              ;(el as any).focus()
              focused = true
            }
          }
          submit({ focused })
          break
        }

        case "showToast": {
          const { message, variant = "info", durationMs } = input || {}
          try {
            // Lazy import to avoid bundling if not used
            const mod = await import("sonner")
            const api = mod.toast
            if (api) {
              switch (variant) {
                case "success":
                  api.success(message, { duration: durationMs })
                  break
                case "warning":
                  api.warning(message, { duration: durationMs })
                  break
                case "error":
                  api.error(message, { duration: durationMs })
                  break
                default:
                  api(message, { duration: durationMs })
              }
              submit({ shown: true })
              break
            }
          } catch {}
          submit({ shown: false })
          break
        }

        case "confirmAction": {
          const { title, body, confirmLabel, cancelLabel } = input || {}
          let accepted = false
          if (typeof window !== "undefined") {
            const msg = [title, body].filter(Boolean).join("\n\n")
            // Basic confirm; can be replaced with custom modal
            accepted = window.confirm(msg)
          }
          submit({ accepted })
          break
        }

        case "copyToClipboard": {
          const { text, html } = input || {}
          let copied = false
          try {
            if (typeof navigator !== "undefined" && navigator.clipboard) {
              if (typeof text === "string") {
                await navigator.clipboard.writeText(text)
                copied = true
              } else if (typeof html === "string") {
                const blob = new Blob([html], { type: "text/html" })
                const item = new (window as any).ClipboardItem({ "text/html": blob })
                await (navigator.clipboard as any).write([item])
                copied = true
              }
            }
          } catch {}
          submit({ copied })
          break
        }

        case "getSelectionContext": {
          let route = "/"
          let collection: string | undefined
          let documentId: string | undefined
          let fieldPath: string | undefined
          if (typeof window !== "undefined") {
            route = window.location.pathname
            const parts = route.split("/").filter(Boolean)
            // Heuristic: /admin/collections/:collection/:id
            const idx = parts.findIndex((p) => p === "collections")
            if (idx >= 0) {
              collection = parts[idx + 1]
              documentId = parts[idx + 2]
            }
            const active = document.activeElement as HTMLElement | null
            if (active) {
              fieldPath =
                (active.getAttribute && active.getAttribute("name")) ||
                (active.id || undefined) ||
                undefined
            }
          }
          submit({ route, collection, documentId, fieldPath })
          break
        }
        default: {
          submit({ ok: false, reason: `Unsupported client tool: ${toolName}` })
        }
      }
    } catch (error) {
      const tc = toolCall as ClientToolCall
      addToolResult({
        tool: tc.toolName,
        toolCallId: tc.toolCallId,
        output: { ok: false, error: String(error) },
      })
    }
  }
}
