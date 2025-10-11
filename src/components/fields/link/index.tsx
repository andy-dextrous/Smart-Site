import type { Media as MediaType } from "@/admin/payload/payload-types"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/utilities/ui"
import Link from "next/link"
import React from "react"

type AppearanceOption = "inline" | "link" | "button" | ButtonProps["variant"]
type IconPosition = "left" | "right"

type CMSLinkType = {
  appearance?: AppearanceOption | null
  children?: React.ReactNode
  className?: string
  icon?: MediaType | string | null
  iconOnly?: boolean | null
  iconPosition?: IconPosition | null
  label?: string | null
  layout?: ButtonProps["layout"] | null
  newTab?: boolean | null
  reference?: {
    relationTo: string
    value: any | string | number
  } | null
  size?: ButtonProps["size"] | null
  type?: "custom" | "reference" | null
  url?: string | null
  variant?: ButtonProps["variant"] | null
} & Omit<React.ComponentProps<typeof Link>, "href" | "children" | "className" | "type">

/*************************************************************************/
/*  CMS LINK COMPONENT - URI-FIRST ARCHITECTURE
/*************************************************************************/

export const CMSLink: React.FC<CMSLinkType> = props => {
  const {
    type,
    appearance: appearanceProp = "link",
    children,
    className,
    icon,
    iconOnly = false,
    iconPosition = "left",
    label,
    layout,
    newTab,
    reference,
    size: sizeFromProps,
    variant,
    url,
    ...linkProps
  } = props

  // Generate href using URI-first approach
  const generateHref = (): string | null => {
    if (type === "custom") {
      return url || null
    }

    if (type === "reference" && typeof reference?.value === "object" && reference.value) {
      const doc = reference.value

      // Homepage special case
      if (doc.slug === "home") {
        return "/"
      }

      // Priority 1: Use URI field if available (Smart Routing Engine)
      if (doc.uri && typeof doc.uri === "string") {
        return doc.uri.startsWith("/") ? doc.uri : `/${doc.uri}`
      }

      // Fallback: Basic slug construction (documents without URI field)
      if (doc.slug && typeof doc.slug === "string") {
        console.log("fallback doc.slug", doc.slug)
        return `/${doc.slug}`
      }
    }

    return url || null
  }

  const href = generateHref()

  if (!href) {
    return null
  }

  const newTabProps = newTab ? { rel: "noopener noreferrer", target: "_blank" } : {}
  const normalizedAppearance =
    appearanceProp === "inline" ? "link" : (appearanceProp || "link")
  const isButtonAppearance = normalizedAppearance !== "link"

  const resolvedVariant: ButtonProps["variant"] | undefined = (() => {
    if (!isButtonAppearance) return undefined
    if (normalizedAppearance === "button") {
      return (variant || "default") ?? "default"
    }
    return (normalizedAppearance as ButtonProps["variant"]) || "default"
  })()

  const resolvedSize: ButtonProps["size"] | undefined = isButtonAppearance
    ? (sizeFromProps || "lg") || "lg"
    : undefined

  const resolvedLayout: ButtonProps["layout"] | undefined = isButtonAppearance
    ? (layout || "default") || "default"
    : undefined

  const iconAsset =
    typeof icon === "object" && icon !== null && "url" in icon ? (icon as MediaType) : null

  const renderIcon = (position: IconPosition) => {
    if (!iconAsset?.url) return null
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 items-center justify-center",
          iconOnly ? "pointer-events-none" : ""
        )}
        key={`${position}-${iconAsset.id ?? iconAsset.url}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="h-5 w-5"
          loading="lazy"
          src={iconAsset.url}
        />
      </span>
    )
  }

  const hasChildren = React.Children.count(children) > 0
  const shouldShowIcon = isButtonAppearance && iconAsset?.url
  const leftIcon =
    shouldShowIcon && (iconPosition !== "right" || iconOnly) ? renderIcon("left") : null
  const rightIcon =
    shouldShowIcon && iconPosition === "right" && !iconOnly ? renderIcon("right") : null

  const defaultButtonContent = (
    <>
      {leftIcon}
      {!iconOnly && label ? <span>{label}</span> : null}
      {rightIcon}
      {iconOnly && label ? <span className="sr-only">{label}</span> : null}
    </>
  )

  const buttonContent = hasChildren ? children : defaultButtonContent
  const ariaLabel =
    (linkProps["aria-label"] as string | undefined) || (iconOnly ? label ?? undefined : undefined)

  if (isButtonAppearance) {
    const buttonClassName = cn("inline-flex items-center gap-2", className)
    const innerLinkClassName = cn(
      "inline-flex items-center",
      iconOnly ? "justify-center gap-0" : "gap-2"
    )

    return (
      <Button
        asChild
        className={buttonClassName}
        icon={iconOnly ? true : undefined}
        layout={resolvedLayout}
        size={resolvedSize}
        variant={resolvedVariant}
      >
        <Link
          {...newTabProps}
          {...linkProps}
          aria-label={ariaLabel}
          className={innerLinkClassName}
          href={href}
        >
          {buttonContent}
        </Link>
      </Button>
    )
  }

  const textContent = hasChildren ? children : label

  if (!textContent) {
    return null
  }

  return (
    <Link
      {...newTabProps}
      {...linkProps}
      className={cn(className)}
      href={href}
    >
      {textContent}
    </Link>
  )
}
