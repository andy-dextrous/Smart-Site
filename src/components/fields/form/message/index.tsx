import RichText from "@/components/fields/rich-text"
import React from "react"

import { Width } from "@/components/fields/form/width/index"
import { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical"

export const Message: React.FC<{ message: SerializedEditorState }> = ({ message }) => {
  return (
    <Width className="my-section-sm" width="100">
      {message && <RichText data={message} />}
    </Width>
  )
}
