import clsx from "clsx"
import React, { forwardRef } from "react"

import type {
  SectionAttribute,
  SectionContainerWidth,
  SectionSettings,
} from "@/components/fields/section/types"

export interface SectionProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "children"
> {
  sectionSettings?: SectionSettings | null
  disableContainer?: boolean
  containerClassName?: string
  children: React.ReactNode
}

const containerClassMap: Record<SectionContainerWidth | "default", string> = {
  default: "container",
  sm: "container-sm",
  md: "container-md",
  lg: "container",
  full: "mx-auto w-full",
}

const colorSchemeClassMap = {
  light: "bg-white text-dark border-neutral",
  neutral: "bg-neutral text-dark border-dark-border",
  dark: "bg-dark text-white border-dark-border",
} satisfies Record<NonNullable<SectionSettings["colorScheme"]>, string>

type SectionPaddingValue = NonNullable<SectionSettings["paddingTop"]>

const sectionPaddingSuffixMap: Record<Exclude<SectionPaddingValue, "default">, string> = {
  none: "none",
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
  xxl: "xxl",
}

const paddingSidePrefixMap = {
  top: "pt",
  bottom: "pb",
  left: "pl",
  right: "pr",
} as const

function resolvePaddingClass(
  side: keyof typeof paddingSidePrefixMap,
  value?: SectionPaddingValue | null
): string | undefined {
  if (!value || value === "default") {
    return undefined
  }

  const suffix = sectionPaddingSuffixMap[value]
  return `${paddingSidePrefixMap[side]}-section-${suffix}`
}

interface NormalizedAttributes {
  attributes: Record<string, string>
  className: string | undefined
}

function normalizeAttributes(
  attributes?: SectionAttribute[] | null
): NormalizedAttributes {
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

export const Section = forwardRef<HTMLElement, SectionProps>(
  function Section(props, ref) {
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

    const colorSchemeClass = colorSchemeClassMap[sectionSettings?.colorScheme ?? "light"]

    const paddingClasses = [
      "px-section-x",
      "py-section-y",
      resolvePaddingClass("top", sectionSettings?.paddingTop),
      resolvePaddingClass("bottom", sectionSettings?.paddingBottom),
      resolvePaddingClass("left", sectionSettings?.paddingLeft),
      resolvePaddingClass("right", sectionSettings?.paddingRight),
    ]

    const combinedClassName = clsx(
      "relative w-full border-b",
      paddingClasses,
      colorSchemeClass,
      attributeClasses,
      className
    )

    const content = disableContainer ? (
      children
    ) : (
      <div className={finalContainerClassName}>{children}</div>
    )

    const colorScheme = sectionSettings?.colorScheme ?? "light"

    return (
      <section
        ref={ref as any}
        className={combinedClassName}
        data-section-scheme={colorScheme}
        {...attributes}
        {...rest}
      >
        {content}
      </section>
    )
  }
)
