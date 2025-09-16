"use client"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { CMSLink } from "@/components/fields/link"
import { SocialLinks } from "@/components/fields/social-links"
import type { Header as HeaderType, Setting } from "@/admin/payload/payload-types"
import Link from "next/link"
import * as React from "react"
import { Hamburger } from "./hamburger"
import LogoPrimary from "../logos/logo"

/*************************************************************************/
/*  MOBILE NAVIGATION WITH SHEET AND CUSTOM HAMBURGER
/*************************************************************************/

export const MobileNavUpdated: React.FC<{ data: HeaderType; settings?: Setting }> = ({
  data,
  settings,
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
      <SheetContent side="left" className="fixed inset-y-0 left-0 z-[1000] h-full w-[80%] border-r border-zinc-200 bg-white p-0 lg:hidden">
        <div className="relative flex h-full w-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
            <Link href="/" aria-label="Return to homepage" onClick={handleLinkClick}>
              <LogoPrimary className="h-8 w-auto" />
            </Link>
            <span className="text-sm font-medium uppercase tracking-wide text-zinc-500">Menu</span>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8">
            <nav className="flex h-full flex-col space-y-6">
              <SheetTitle className="sr-only">Menu</SheetTitle>

              <div className="flex flex-1 flex-col gap-6">
                {navItems.map(({ item }, i: number) => {
                  if (item?.hasDropdown && item?.subItems && item?.subItems?.length > 0) {
                    return (
                      <div key={i} className="space-y-4">
                        <h3 className="text-zinc-900">{item.link?.label}</h3>
                        <div className="flex flex-col space-y-3 pl-4">
                          {item.subItems.map((childItem, j: number) => {
                            const child = childItem.child
                            if (
                              child.hasChildren &&
                              child.subItems &&
                              child.subItems.length > 0
                            ) {
                              return (
                                <div key={j} className="space-y-2">
                                  <h4 className="text-zinc-800">{child.link?.label}</h4>
                                  <div className="flex flex-col space-y-2 pl-3">
                                    {child.subItems.map((subItem, k: number) => (
                                      <CMSLink key={k} {...subItem.link} className="text-zinc-600 transition-colors hover:text-zinc-900" onClick={handleLinkClick}>
                                        {subItem.link?.label}
                                      </CMSLink>
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            return (
                              <div key={j}>
                                <CMSLink {...child.link} className="text-zinc-700 transition-colors hover:text-zinc-900" onClick={handleLinkClick}>
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
                      <CMSLink key={i} {...item.link} className="!text-h6 font-medium text-zinc-800 transition-colors" onClick={handleLinkClick}>
                        {item.link?.label}
                      </CMSLink>
                    )
                  }
                })}
              </div>
            </nav>

            {/* Removed decorative background mark for neutral theme */}
          </div>

          <div className="border-t border-zinc-200 p-6">
            <div className="flex flex-col gap-4 text-zinc-600">
              <SheetDescription className="text-center text-sm text-zinc-500">
                © {new Date().getFullYear()} smart-site. All rights reserved.
              </SheetDescription>
              <SocialLinks
                socialLinks={settings?.social?.socialLinks || []}
                variant="icon"
                className="justify-center [&>a]:text-zinc-700 [&>a]:hover:text-zinc-900"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
