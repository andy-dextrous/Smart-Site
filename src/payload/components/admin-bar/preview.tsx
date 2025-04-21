"use client"

import { useRouter } from "next/navigation"

export default function Preview() {
  const router = useRouter()

  return (
    <div>
      <button
        onClick={() => {
          fetch("/next/exit-preview").then(() => {
            router.push("/")
            router.refresh()
          })
        }}
      >
        Exit preview mode
      </button>
    </div>
  )
}
