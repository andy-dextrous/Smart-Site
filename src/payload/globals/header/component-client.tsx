"use client"

// import { useHeaderTheme } from "@/payload/providers/HeaderTheme"
import Link from "next/link"

import React, { useEffect, useState } from "react"

import type { Header } from "@/payload/payload-types"

import { Logo } from "@/payload/components/logo"
import { HeaderNav } from "@/payload/globals/header/nav"

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)

  return (
    <header
      className="relative z-20 container"
      {...(theme ? { "data-theme": theme } : {})}
    >
      <div className="flex justify-between py-8">
        <Link href="/">
          <Logo loading="eager" priority="high" className="invert dark:invert-0" />
        </Link>
        <HeaderNav data={data} />
      </div>
    </header>
  )
}
