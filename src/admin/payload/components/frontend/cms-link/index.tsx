import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/admin/utilities/ui"
import Link from "next/link"
import React from "react"

type CMSLinkType = {
  appearance?: "inline" | ButtonProps["variant"] // either render as a link or a button
  children?: React.ReactNode // Pass in text and icons like usual
  className?: string
  newTab?: boolean | null
  reference?: {
    relationTo: string // Type of collection the reference is to
    value: any | string | number // The slug of the reference
  } | null
  size?: ButtonProps["size"] | null // The size of the button
  type?: "custom" | "reference" | null // Is this a custom link or a reference to a document in the CMS ?
  url?: string | null // The external URL if type is "custom"
} & Omit<React.ComponentProps<typeof Link>, "href" | "children" | "className" | "type">

/*************************************************************************/
/*  CMS LINK COMPONENT - URI-FIRST ARCHITECTURE
/*************************************************************************/

export const CMSLink: React.FC<CMSLinkType> = props => {
  const {
    type,
    appearance = "inline",
    children,
    className,
    newTab,
    reference,
    size: sizeFromProps,
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

  if (!href) return null

  const size = appearance === "link" ? undefined : sizeFromProps || undefined
  const newTabProps = newTab ? { rel: "noopener noreferrer", target: "_blank" } : {}

  // Render children if provided, otherwise render label
  const content = children

  /* Ensure we don't break any styles set by richText */
  if (appearance === "inline") {
    return (
      <Link className={cn(className)} href={href} {...newTabProps} {...linkProps}>
        {content}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link className={cn(className)} href={href} {...newTabProps} {...linkProps}>
        {content}
      </Link>
    </Button>
  )
}
