"use client"

import { RowLabelProps, useRowLabel } from "@payloadcms/ui"

export const SocialLinksRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel() as any

  console.log("Social Links RowLabel data:", data)

  const platformName = data?.data?.platform
    ? data.data.platform.charAt(0).toUpperCase() + data.data.platform.slice(1)
    : "Social Link"

  const label = data?.data?.platform
    ? platformName
    : `Social Link ${data.rowNumber !== undefined ? data.rowNumber + 1 : ""}`

  return <div>{label}</div>
}
