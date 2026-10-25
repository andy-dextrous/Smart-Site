import { FormBlock } from "@/components/fields/form/component"
import type { Form } from "@/payload-types"
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical"
import React from "react"

type CMSFormType = {
  form: Form | string | null
  enableIntro?: boolean | null
  introContent?: SerializedEditorState | null
  className?: string
}

export const CMSForm: React.FC<CMSFormType> = ({
  form,
  enableIntro = false,
  introContent,
  className,
}) => {
  // Handle case where form is a string ID instead of populated object
  if (!form || typeof form === "string") {
    return null
  }

  return (
    <div className={className}>
      <FormBlock
        form={form as any}
        enableIntro={enableIntro || false}
        introContent={introContent || undefined}
      />
    </div>
  )
}
