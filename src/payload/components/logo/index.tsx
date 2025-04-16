"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"

export const Logo = () => {
  return (
    <span style={{ position: "relative", width: "256px", height: "40px" }}>
      <Image src="/assets/admin/logos/logo.svg" alt="" fill />
    </span>
  )
}

export const Icon = () => {
  return (
    <span
      style={{
        position: "relative",
        width: "120px",
        height: "28px",
        marginRight: "14px",
      }}
    >
      <Image src="/assets/admin/logos/logo.svg" alt="" fill />
    </span>
  )
}
