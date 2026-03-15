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

    window.location.href = `/api/exit-preview?redirect=${encodeURIComponent(redirectPath)}`
  }

  return (
    <div>
      <button className="admin-bar__button" onClick={handleExitPreview}>
        Exit preview mode
      </button>
    </div>
  )
}
