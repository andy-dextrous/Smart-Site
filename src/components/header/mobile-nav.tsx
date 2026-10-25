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

export const MobileNavUpdated: React.FC<MobileNavProps> = ({
  data,
  settings,
  search,
}) => {
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
        className="border-dark-border fixed inset-y-0 left-0 z-[1000] h-full w-[80%] border-r bg-white p-0 lg:hidden"
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden">
          <div className="border-dark-border px-section-x py-content-lg flex items-center justify-between border-b">
            <Link href="/" aria-label="Return to homepage" onClick={handleLinkClick}>
              <LogoPrimary className="h-logo w-auto" />
            </Link>
            <span className="text-dark-600 text-xs uppercase tracking-[0.18em]">
              Menu
            </span>
          </div>

          <div className="px-section-x py-section-sm flex-1 overflow-y-auto">
            <nav className="gap-content flex h-full flex-col">
              <SheetTitle className="sr-only">Menu</SheetTitle>

              <div className="gap-content flex flex-1 flex-col">
                {search.enabled ? (
                  <SearchCommandLauncher
                    mode={search.mode}
                    variant="button"
                    className="!text-h6 text-dark text-left transition-colors"
                    onNavigate={handleLinkClick}
                  />
                ) : null}
                {navItems.map(({ item }, i: number) => {
                  if (item?.hasDropdown && item?.subItems && item?.subItems?.length > 0) {
                    return (
                      <div key={i} className="gap-content flex flex-col">
                        <h3 className="text-dark">{item.link?.label}</h3>
                        <div className="gap-content-sm pl-section-xs flex flex-col">
                          {item.subItems.map((childItem, j: number) => {
                            const child = childItem.child
                            if (
                              child.hasChildren &&
                              child.subItems &&
                              child.subItems.length > 0
                            ) {
                              return (
                                <div key={j} className="gap-content-sm flex flex-col">
                                  <h4 className="text-dark">{child.link?.label}</h4>
                                  <div className="gap-content-sm pl-section-xs flex flex-col">
                                    {child.subItems.map((subItem, k: number) => (
                                      <CMSLink
                                        key={k}
                                        {...subItem.link}
                                        className="text-dark-600 hover:text-dark transition-colors"
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
                                  className="text-dark-600 hover:text-dark transition-colors"
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
                        className={
                          item.link?.appearance === "button"
                            ? "self-start"
                            : "!text-h6 text-dark transition-colors"
                        }
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

          <div className="border-dark-border px-section-x py-content-lg border-t">
            <div className="gap-content-sm text-dark-600 flex flex-col">
              <SheetDescription className="text-dark-600 text-center text-sm">
                © {new Date().getFullYear()} smart-site. All rights reserved.
              </SheetDescription>
              <SocialLinks
                socialLinks={settings?.social?.socialLinks || []}
                variant="icon"
                className="[&>a]:text-dark-600 [&>a]:hover:text-dark justify-center"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
