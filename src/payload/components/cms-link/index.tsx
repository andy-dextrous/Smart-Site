"use client"

import { cn } from "@/utilities/ui"
import Link from "next/link"
import React from "react"
import type { Page, Post } from "@/payload/payload-types"
import type { LinkProps } from "next/link"

// Base properties for Payload CMS links
type PayloadLinkType = {
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: "pages" | "posts"
    value: Page | Post | string | number
  } | null
  type?: "custom" | "reference" | null
  url?: string | null
  hasSubItems?: any
  subItems?: any
}

// Complete type for CMSLink component, including all standard Link props
type CMSLinkType = PayloadLinkType & {
  children?: React.ReactNode
  className?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "type" | keyof LinkProps> &
  Omit<LinkProps, "href">

export const CMSLink: React.FC<CMSLinkType> = props => {
  const {
    type,
    children,
    className,
    label,
    newTab,
    reference,
    url,
    hasSubItems,
    subItems,
    onClick,
    ...rest
  } = props

  const href =
    type === "reference" && typeof reference?.value === "object" && reference.value.slug
      ? reference.value.slug === "home"
        ? "/"
        : `${reference?.relationTo !== "pages" ? `/${reference?.relationTo}` : ""}/${
            reference.value.slug
          }`
      : url

  if (!href) return null

  const newTabProps = newTab ? { rel: "noopener noreferrer", target: "_blank" } : {}

  return (
    <Link
      className={cn(className)}
      href={href || url || ""}
      onClick={onClick}
      {...newTabProps}
      {...rest}
    >
      {children && children}
    </Link>
  )
}
