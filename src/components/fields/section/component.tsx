import clsx from "clsx"
import React, { forwardRef } from "react"

import type {
  SectionAttribute,
  SectionContainerWidth,
  SectionPaddingX,
  SectionPaddingY,
  SectionSettings,
} from "./types"

export interface SectionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  sectionSettings?: SectionSettings | null
  disableContainer?: boolean
  containerClassName?: string
  children: React.ReactNode
}

const containerClassMap: Record<SectionContainerWidth | "default", string> = {
  default: "container-md",
  sm: "container-sm",
  md: "container-md",
  lg: "container",
  full: "mx-auto w-full",
}

const colorSchemeClassMap = {
  light: "bg-white text-dark",
  neutral: "bg-neutral text-dark",
  dark: "bg-dark text-white",
  surface: "bg-white text-dark shadow-sm border border-dark-border",
  transparent: "bg-transparent text-inherit",
} satisfies Record<NonNullable<SectionSettings["colorScheme"]>, string>

const paddingXClassMap: Record<SectionPaddingX | "default", string> = {
  default: "px-section-x",
  none: "px-section-none",
  xs: "px-section-xs",
  sm: "px-section-sm",
  lg: "px-section-lg",
  xl: "px-section-xl",
}

const paddingYClassMap: Record<SectionPaddingY | "default", string> = {
  default: "py-section-y",
  none: "py-section-none",
  xs: "py-section-xs",
  sm: "py-section-sm",
  md: "py-section-md",
  lg: "py-section-lg",
  xl: "py-section-xl",
  xxl: "py-section-xxl",
}

interface NormalizedAttributes {
  attributes: Record<string, string>
  className: string | undefined
}

function normalizeAttributes(attributes?: SectionAttribute[] | null): NormalizedAttributes {
  if (!attributes || attributes.length === 0) {
    return { attributes: {}, className: undefined }
  }

  const elementAttributes: Record<string, string> = {}
  const classSegments: string[] = []

  attributes.forEach(attribute => {
    if (!attribute || !attribute.key || attribute.value == null) {
      return
    }

    const key = attribute.key.trim()
    if (!key) return

    const value = String(attribute.value).trim()
    if (!value) return

    if (key === "class" || key === "className") {
      classSegments.push(value)
      return
    }

    elementAttributes[key] = value
  })

  return {
    attributes: elementAttributes,
    className: classSegments.length > 0 ? classSegments.join(" ") : undefined,
  }
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(props, ref) {
  const {
    sectionSettings,
    disableContainer = false,
    containerClassName,
    children,
    className,
    ...rest
  } = props

  const { attributes, className: attributeClasses } = normalizeAttributes(
    sectionSettings?.attributes
  )

  const baseContainerClassName =
    containerClassMap[sectionSettings?.containerWidth ?? "default"]
  const finalContainerClassName = clsx(baseContainerClassName, containerClassName)

  const colorSchemeClass =
    colorSchemeClassMap[sectionSettings?.colorScheme ?? "light"]

  const paddingXClass =
    paddingXClassMap[sectionSettings?.paddingX ?? "default"] ?? "px-section-x"

  const paddingYClass =
    paddingYClassMap[sectionSettings?.paddingY ?? "default"] ?? "py-section-y"

  const combinedClassName = clsx(
    "relative w-full",
    paddingXClass,
    paddingYClass,
    colorSchemeClass,
    attributeClasses,
    className
  )

  const content = disableContainer ? children : <div className={finalContainerClassName}>{children}</div>

  return (
    <section
      ref={ref as any}
      className={combinedClassName}
      {...attributes}
      {...rest}
    >
      {content}
    </section>
  )
})
