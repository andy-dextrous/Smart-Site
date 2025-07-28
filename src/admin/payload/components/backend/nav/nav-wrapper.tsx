"use client"

import { useNav } from "@payloadcms/ui"
import React from "react"
import "./styles.scss"

export const NavWrapper: React.FC<{
  baseClass?: string
  children: React.ReactNode
}> = props => {
  const { baseClass, children } = props

  const { hydrated, navOpen, navRef, shouldAnimate } = useNav()

  const asideClasses = ["border-admin-800 pt-sidebar-nav-y h-full border-r pb-4"]

  if (navOpen) asideClasses.push("nav--nav-open")
  if (shouldAnimate) asideClasses.push("nav--nav-animate")
  if (hydrated) asideClasses.push("nav--nav-hydrated")

  return (
    <aside className={asideClasses.join(" ")} inert={!navOpen ? true : undefined}>
      <div className="nav-wrapper-content" ref={navRef}>
        {children}
      </div>
    </aside>
  )
}
