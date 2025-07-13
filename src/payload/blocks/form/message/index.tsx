import RichText from "@/payload/components/frontend/rich-text"
import React from "react"

import { Width } from "../width"
import { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical"

export const Message: React.FC<{ message: SerializedEditorState }> = ({ message }) => {
  return (
    <Width className="my-12" width="100">
      {message && <RichText data={message} />}
    </Width>
  )
}
