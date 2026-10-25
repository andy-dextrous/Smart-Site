"use client"

import Image from "next/image"
import "./logo.scss"

export const Logo = () => {
  return (
    <span style={{ position: "relative", width: "256px", height: "40px" }}>
      <Image src="/assets/admin/logos/logo.svg" alt="SmartSite" className="smartsite-admin-logo" fill />
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
      <Image src="/assets/admin/logos/logo.svg" alt="SmartSite" className="smartsite-admin-logo" fill />
    </span>
  )
}
