"use client"

import { useRouter, usePathname } from "next/navigation"

interface ExitPreviewProps {
  onExitPreview?: () => void
}

export default function ExitPreview({ onExitPreview }: ExitPreviewProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div>
      <button
        className="admin-bar__button"
        onClick={() => {
          fetch("/api/exit-preview").then(() => {
            // Call the callback to update parent state
            onExitPreview?.()

            // Remove preview parameter from URL and navigate
            const currentUrl = new URL(window.location.href)
            currentUrl.searchParams.delete("preview")
            currentUrl.searchParams.delete("livePreview")

            // Navigate to clean URL
            router.push(currentUrl.pathname + currentUrl.search)
            router.refresh()
          })
        }}
      >
        Exit preview mode
      </button>
    </div>
  )
}
