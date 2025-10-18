"use client"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { CMSLink } from "@/components/fields/link"
import { SocialLinks } from "@/components/fields/social-links"
import type { Header as HeaderType, Setting } from "@/admin/payload/payload-types"
import Link from "next/link"
import * as React from "react"
import { Hamburger } from "./hamburger"
import LogoPrimary from "../logos/logo"
import { SearchCommandLauncher } from "@/components/search/search-dialog"

/*************************************************************************/
/*  MOBILE NAVIGATION WITH SHEET AND CUSTOM HAMBURGER
/*************************************************************************/

type NavigationSearchConfig = {
  enabled: boolean
  mode: "page" | "modal" | "hybrid"
}

interface MobileNavProps {
  data: HeaderType
  settings?: Setting
  search: NavigationSearchConfig
}

export const MobileNavUpdated: React.FC<MobileNavProps> = ({ data, settings, search }) => {
  const [open, setOpen] = React.useState(false)
  const navItems = data?.navItems || []

  function handleLinkClick() {
    setOpen(false)
  }

  function handleToggle() {
    setOpen(!open)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Hamburger isOpen={open} onClick={handleToggle} />
      <SheetContent
        side="left"
        className="fixed inset-y-0 left-0 z-[1000] h-full w-[80%] border-r border-dark-border bg-white p-0 lg:hidden"
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-dark-border px-section-x py-content-lg">
            <Link href="/" aria-label="Return to homepage" onClick={handleLinkClick}>
              <LogoPrimary className="h-logo w-auto" />
            </Link>
            <span className="text-xs uppercase tracking-[0.18em] text-dark-600">
              Menu
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-section-x py-section-sm">
            <nav className="flex h-full flex-col gap-content">
              <SheetTitle className="sr-only">Menu</SheetTitle>

              <div className="flex flex-1 flex-col gap-content">
                {search.enabled ? (
                  <SearchCommandLauncher
                    mode={search.mode}
                    variant="button"
                    className="!text-h6 text-dark transition-colors text-left"
                    onNavigate={handleLinkClick}
                  />
                ) : null}
                {navItems.map(({ item }, i: number) => {
                  if (item?.hasDropdown && item?.subItems && item?.subItems?.length > 0) {
                    return (
                      <div key={i} className="flex flex-col gap-content">
                        <h3 className="text-dark">{item.link?.label}</h3>
                        <div className="flex flex-col gap-content-sm pl-section-xs">
                          {item.subItems.map((childItem, j: number) => {
                            const child = childItem.child
                            if (
                              child.hasChildren &&
                              child.subItems &&
                              child.subItems.length > 0
                            ) {
                              return (
                                <div key={j} className="flex flex-col gap-content-sm">
                                  <h4 className="text-dark">{child.link?.label}</h4>
                                  <div className="flex flex-col gap-content-sm pl-section-xs">
                                    {child.subItems.map((subItem, k: number) => (
                                      <CMSLink
                                        key={k}
                                        {...subItem.link}
                                        className="text-dark-600 transition-colors hover:text-dark"
                                        onClick={handleLinkClick}
                                      >
                                        {subItem.link?.label}
                                      </CMSLink>
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            return (
                              <div key={j}>
                                <CMSLink
                                  {...child.link}
                                  className="text-dark-600 transition-colors hover:text-dark"
                                  onClick={handleLinkClick}
                                >
                                  {child.link?.label}
                                </CMSLink>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <CMSLink
                        key={i}
                        {...item.link}
                        className="!text-h6 text-dark transition-colors"
                        onClick={handleLinkClick}
                      >
                        {item.link?.label}
                      </CMSLink>
                    )
                  }
                })}
              </div>
            </nav>

            {/* Removed decorative background mark for neutral theme */}
          </div>

          <div className="border-t border-dark-border px-section-x py-content-lg">
            <div className="flex flex-col gap-content-sm text-dark-600">
              <SheetDescription className="text-sm text-center text-dark-600">
                © {new Date().getFullYear()} smart-site. All rights reserved.
              </SheetDescription>
              <SocialLinks
                socialLinks={settings?.social?.socialLinks || []}
                variant="icon"
                className="justify-center [&>a]:text-dark-600 [&>a]:hover:text-dark"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
