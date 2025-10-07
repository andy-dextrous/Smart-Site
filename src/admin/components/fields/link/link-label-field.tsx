"use client"

import { useEffect, useMemo, useRef } from "react"
import type { CSSProperties } from "react"
import type { TextFieldClientProps } from "payload"
import { FieldLabel, TextInput, useField, useFormFields } from "@payloadcms/ui"

const LABEL_SOURCE_FIELDS = ["title", "name"]

function getReferenceSignature(reference: unknown): string | undefined {
  if (!reference) {
    return undefined
  }

  if (typeof reference === "string") {
    return reference
  }

  if (Array.isArray(reference)) {
    return reference
      .map(item => getReferenceSignature(item))
      .filter(Boolean)
      .join("|")
  }

  if (typeof reference === "object") {
    const refObject = reference as Record<string, unknown>

    const relation = typeof refObject.relationTo === "string" ? refObject.relationTo : ""

    if (typeof refObject.value === "string") {
      return `${relation}:${refObject.value}`
    }

    if (typeof refObject.id === "string") {
      return `${relation}:${refObject.id}`
    }

    if (typeof refObject.doc === "object" && refObject.doc !== null) {
      const doc = refObject.doc as Record<string, unknown>
      const docId = typeof doc.id === "string" ? doc.id : undefined
      if (docId) {
        return `${relation}:${docId}`
      }
    }

    try {
      return JSON.stringify(refObject)
    } catch (error) {
      return undefined
    }
  }

  return undefined
}

export function LinkLabelField(props: TextFieldClientProps) {
  const { field, path, readOnly: readOnlyFromProps } = props
  const className = (props as { className?: string }).className
  const style = (props as { style?: CSSProperties }).style
  const { value, setValue } = useField<string>({ path: path || field.name })

  const referencePath = useMemo(() => {
    if (!path) {
      return `${field.name?.replace(/label$/, "reference") ?? "reference"}`
    }

    return path.replace(/label$/, "reference")
  }, [field.name, path])

  const referenceValue = useFormFields(([fields]) => fields[referencePath]?.value)
  const lastReferenceSignature = useRef<string | null>(null)

  const referenceSignature = useMemo(() => getReferenceSignature(referenceValue), [referenceValue])

  useEffect(() => {
    if (!referenceSignature) {
      lastReferenceSignature.current = null
      return
    }

    if (referenceSignature === lastReferenceSignature.current) {
      return
    }

    const deriveLabel = (reference: unknown): string | undefined => {
      if (!reference) {
        return undefined
      }

      if (Array.isArray(reference)) {
        for (const entry of reference) {
          const nested = deriveLabel(entry)
          if (nested) {
            return nested
          }
        }
        return undefined
      }

      if (typeof reference !== "object") {
        return undefined
      }

      const refObject = reference as Record<string, unknown>

      if (typeof refObject.label === "string" && refObject.label.trim()) {
        return refObject.label.trim()
      }

      for (const key of LABEL_SOURCE_FIELDS) {
        const candidate = refObject[key]
        if (typeof candidate === "string" && candidate.trim()) {
          return candidate.trim()
        }
      }

      if (typeof refObject.value === "object" && refObject.value !== null) {
        const nested = deriveLabel(refObject.value)
        if (nested) {
          return nested
        }
      }

      if (typeof refObject.doc === "object" && refObject.doc !== null) {
        const nested = deriveLabel(refObject.doc)
        if (nested) {
          return nested
        }
      }

      return undefined
    }

    const derived = deriveLabel(referenceValue)

    if (!derived) {
      lastReferenceSignature.current = referenceSignature
      return
    }

    setValue(derived)
    lastReferenceSignature.current = referenceSignature
  }, [referenceSignature, referenceValue, setValue])

  const readOnly = readOnlyFromProps ?? false

  const wrapperClassName = ["field-type", "text", className].filter(Boolean).join(" ")
  const combinedStyle = {
    ...(style || {}),
    ["--field-width"]: "50%",
  } as Record<string, unknown>

  return (
    <div className={wrapperClassName} style={combinedStyle as CSSProperties}>
      <FieldLabel label={field.label ?? field.name} path={path} required={field.required} />
      <TextInput
        path={path || field.name}
        readOnly={readOnly}
        value={value ?? ""}
        onChange={setValue}
      />
    </div>
  )
}

export default LinkLabelField
