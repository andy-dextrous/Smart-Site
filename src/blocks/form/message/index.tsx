import RichText from "@/components/fields/rich-text"
import React from "react"

import { Width } from "@/blocks/form/width/index"
import type { DefaultTypedEditorState } from "@payloadcms/richtext-lexical"

export const Message: React.FC<{ message?: DefaultTypedEditorState | null }> = ({
  message,
}) => {
  return (
    <Width className="my-12" width="100">
      {message && <RichText data={message} />}
    </Width>
  )
}
