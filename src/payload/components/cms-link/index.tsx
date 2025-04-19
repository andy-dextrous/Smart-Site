"use client"

import type { Page, Post, Service } from "@/payload/payload-types"
import type { LinkProps } from "next/link"
import Link from "next/link"
import React from "react"

type PayloadLinkType = {
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: "pages" | "posts" | "services"
    value: Page | Post | Service | string | number
  } | null
  type?: "custom" | "reference" | null
  url?: string | null
}

type CMSLinkType = PayloadLinkType & {
  children?: React.ReactNode
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "type" | keyof LinkProps> &
  Omit<LinkProps, "href">

export const CMSLink: React.FC<CMSLinkType> = props => {
  const {
    type, // reference to a document, custom link, or null
    children,
    newTab,
    reference,
    url,
    ...rest
  } = props

  let relationToPath: string | undefined = reference?.relationTo

  if (reference?.relationTo === "pages") {
    relationToPath = ""
  } else if (reference?.relationTo === "posts") {
    relationToPath = "blog"
  }

  const href =
    type === "reference" && typeof reference?.value === "object" && reference.value.slug
      ? reference.value.slug === "home"
        ? "/"
        : `${relationToPath}/${reference.value.slug}`
      : url

  const newTabProps = newTab ? { rel: "noopener noreferrer", target: "_blank" } : {}

  return href ? (
    <Link href={href} {...newTabProps} {...rest}>
      {children && children}
    </Link>
  ) : null
}
