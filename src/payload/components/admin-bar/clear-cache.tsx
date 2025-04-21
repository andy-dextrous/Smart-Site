"use client"

/*******************************************************/
/* Clear Cache
/*******************************************************/

import { getClientSideURL } from "@/utilities/getURL"
import { toast } from "@payloadcms/ui"

function ClearCache() {
  async function clearCache() {
    const response = await fetch(`${getClientSideURL()}/next/revalidate`, {
      method: "GET",
    })

    if (!response.ok) {
      toast.error("Failed to clear cache")
      return
    }

    toast.success("Cache cleared")

    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  return (
    <button
      onClick={clearCache}
      className="cursor-pointer rounded-sm border-none bg-transparent px-2 text-white hover:bg-[#37373c]"
      type="submit"
    >
      Clear Cache
    </button>
  )
}

export default ClearCache
