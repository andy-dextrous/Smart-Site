"use client"

/*******************************************************/
/* Clear Cache
/*******************************************************/

import { getClientSideURL } from "@/utilities/get-url"
import { toast } from "sonner"

function ClearCache() {
  async function clearCache() {
    const response = await fetch(`${getClientSideURL()}/api/revalidate`, {
      method: "GET",
    })

    if (!response.ok) {
      toast.error("Failed to clear cache")
      return
    }

    toast.success("Cache cleared")

    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <button onClick={clearCache} className="admin-bar__button" type="submit">
      Clear Cache
    </button>
  )
}

export default ClearCache
