import { FormBlock, type FormVariant } from "@/payload/blocks/form/component"
import type { Form } from "@/payload/payload-types"
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical"
import React from "react"

type CMSFormType = {
  form: Form | string | null
  variant?: FormVariant | null
  enableIntro?: boolean | null
  introContent?: SerializedEditorState | null
  className?: string
}

export const CMSForm: React.FC<CMSFormType> = ({
  form,
  variant = "white",
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
        variant={variant as FormVariant}
        enableIntro={enableIntro || false}
        introContent={introContent || undefined}
      />
    </div>
  )
}
