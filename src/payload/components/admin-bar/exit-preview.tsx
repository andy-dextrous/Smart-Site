"use client"

import { useRouter } from "next/navigation"

export default function Preview() {
  const router = useRouter()

  return (
    <div>
      <button
        className="cursor-pointer rounded-sm border-none bg-transparent px-2 text-white hover:cursor-pointer hover:bg-[#37373c]"
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
