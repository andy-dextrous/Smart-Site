"use client"

import React from "react"
import { RowField } from "@payloadcms/ui"
import type { RowFieldClientComponent } from "payload"
import "./styles.scss"

/*************************************************************************/
/*  ROUTING GRID COMPONENT - CUSTOM ROW FIELD
/*************************************************************************/

export const RoutingGrid: RowFieldClientComponent = props => {
  return (
    <div className="routing-grid-wrapper">
      <RowField {...props} />
    </div>
  )
}

export default RoutingGrid
