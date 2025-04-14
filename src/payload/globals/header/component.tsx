import { HeaderClient } from "./component-client"
import { getCachedGlobal } from "@/lib/queries/globals"
import React from "react"

import type { Header } from "@/payload/payload-types"
import type { Config } from "payload"

export async function Header() {
  const headerData: Header = await getCachedGlobal(
    "header" as keyof Config["globals"],
    1
  )()

  return <HeaderClient data={headerData} />
}
