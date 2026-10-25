"use client"

interface ExitPreviewProps {
  onExitPreview?: () => void
}

export default function ExitPreview({ onExitPreview }: ExitPreviewProps) {
  function stripPreviewPrefix(pathname: string): string {
    if (!pathname.startsWith("/preview")) {
      return pathname
    }

    const stripped = pathname.replace(/^\/preview(\/|$)/, "/")
    return stripped === "" ? "/" : stripped
  }

  function handleExitPreview(): void {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete("livePreview")

    const redirectPath = `${stripPreviewPrefix(currentUrl.pathname)}${currentUrl.search}`

    onExitPreview?.()

    // The endpoint clears HTTP-only preview cookies before redirecting. Load a
    // new document so the browser and server both leave the preview session.
    const exitUrl = new URL("/api/exit-preview", currentUrl.origin)
    exitUrl.searchParams.set("redirect", redirectPath)
    window.location.assign(exitUrl.href)
  }

  return (
    <div>
      <button className="admin-bar__button" onClick={handleExitPreview}>
        Exit preview mode
      </button>
    </div>
  )
}
