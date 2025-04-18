/****************************************************
 * CMSLink Component for Payload CMS link fields.
 ****************************************************/

import type { Page, Post, Service } from "@/payload/payload-types"
import type { LinkProps } from "next/link"
import Link from "next/link"
import React from "react"

/****************************************************
 * Type Declarations
 ****************************************************/

type PayloadReference = {
  relationTo: "pages" | "posts" | "services"
  value: Page | Post | Service | string | number
}

type PayloadLink = {
  type?: "custom" | "reference" | null
  reference?: PayloadReference | null
  url?: string | null
  newTab?: boolean | null
}

type CMSLinkProps = PayloadLink &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "type" | keyof LinkProps> &
  Omit<LinkProps, "href"> & {
    children?: React.ReactNode
    className?: string
    onClick?: React.MouseEventHandler<HTMLAnchorElement>
  }

/****************************************************
 * Build the link from the payload link field
 ****************************************************/

const buildHref = ({
  type,
  reference,
  url,
}: Pick<PayloadLink, "type" | "reference" | "url">): string | null => {
  if (
    type === "reference" &&
    reference &&
    typeof reference.value === "object" &&
    "slug" in reference.value &&
    reference.value.slug
  ) {
    if (reference.value.slug === "home") return "/"

    const base =
      reference.relationTo === "posts"
        ? "/blog"
        : reference.relationTo !== "pages"
          ? `/${reference.relationTo}`
          : ""

    return `${base}/${reference.value.slug}`
  }

  return url ?? null
}

/****************************************************
 * Component
 ****************************************************/

export const CMSLink: React.FC<CMSLinkProps> = props => {
  const { type, reference, url, newTab, children, ...rest } = props

  const href = buildHref({ type, reference, url })
  if (!href) return null

  const targetProps = newTab
    ? { rel: "noopener noreferrer", target: "_blank" }
    : undefined

  return (
    <Link href={href} {...targetProps} {...rest}>
      {children}
    </Link>
  )
}
