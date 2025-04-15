"use client"

import Link from "next/link"
import React, { useState } from "react"
import type { Header } from "@/payload/payload-types"
import { HeaderNav } from "@/payload/globals/header/nav"
import Image from "next/image"

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  return (
    <header className="relative z-20 container">
      <div className="flex justify-between py-8">
        <Link href="/">
          <Image src="/assets/logos/logo.svg" alt="Logo" width={200} height={50} />
        </Link>
        <HeaderNav data={data} />
      </div>
    </header>
  )
}
