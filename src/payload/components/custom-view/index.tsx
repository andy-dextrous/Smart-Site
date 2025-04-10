import type { AdminViewServerProps } from "payload"

import { Gutter } from "@payloadcms/ui"
import React from "react"

function MyCustomView(props: AdminViewServerProps) {
  return (
    <Gutter>
      <h1>Custom Default Root View</h1>
      <p>This view uses the Default Template.</p>
    </Gutter>
  )
}

export default MyCustomView
