"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CMSLink } from "@/payload/components/cms-link"
import type { Header as HeaderType } from "@/payload/payload-types"
import {
  FacebookIcon,
  LinkedinIcon,
  Menu,
  SearchIcon,
  TwitterIcon,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"

export const MobileNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const [open, setOpen] = React.useState(false)
  const navItems = data?.navItems || []

  const handleLinkClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent/50 z-50 flex size-12 items-center justify-center rounded-full md:hidden"
        >
          <Menu className="h-6 w-6 transition-transform duration-200" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="border-primary/20 fixed inset-y-0 left-0 h-full w-[80%] border-r bg-white p-0"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="flex items-center justify-between border-b p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-6 right-6 z-50"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close navigation menu</span>
            </Button>

            <div className="flex items-center justify-between">
              <Link href="/" aria-label="Logo" onClick={() => setOpen(false)}>
                <Image
                  src="/assets/logos/logo.svg"
                  alt="Logo"
                  width={100}
                  height={100}
                  className="h-auto w-auto transition-colors duration-300"
                />
              </Link>
            </div>
          </SheetHeader>

          <div className="overflow-y-auto p-6">
            <nav className="flex flex-col space-y-4">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col gap-4">
                {navItems.map(({ item }, i: number) => {
                  if (item?.hasDropdown && item?.subItems && item?.subItems?.length > 0) {
                    return (
                      <div key={i} className="space-y-3">
                        <h3 className="text-primary text-lg font-semibold">
                          {item.link?.label}
                        </h3>
                        <div className="flex flex-col space-y-2 pl-4">
                          {item.subItems.map((childItem, j: number) => {
                            const child = childItem.child
                            if (
                              child.hasChildren &&
                              child.subItems &&
                              child.subItems.length > 0
                            ) {
                              return (
                                <div key={j} className="space-y-2 py-1">
                                  <h4 className="font-medium text-gray-800">
                                    {child.link?.label}
                                  </h4>
                                  <div className="flex flex-col space-y-1 pl-3">
                                    {child.subItems.map((subItem, k: number) => (
                                      <div key={k} className="py-1">
                                        <CMSLink
                                          {...subItem.link}
                                          className="hover:text-primary text-gray-700 transition-colors"
                                          onClick={handleLinkClick}
                                        >
                                          {subItem.link?.label}
                                        </CMSLink>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            return (
                              <div key={j} className="py-1">
                                <CMSLink
                                  {...child.link}
                                  className="hover:text-primary text-gray-700 transition-colors"
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
                      <div key={i}>
                        <CMSLink
                          {...item.link}
                          className="hover:text-primary text-lg font-semibold text-gray-800 transition-colors"
                          onClick={handleLinkClick}
                        >
                          {item.link?.label}
                        </CMSLink>
                      </div>
                    )
                  }
                })}
              </div>
            </nav>

            <div className="mt-8 w-full border-y border-gray-200 py-8">
              <div className="flex items-center justify-center space-x-2">
                <SearchIcon className="h-5 w-5 text-gray-500" />
                <Link
                  href="/search"
                  className="hover:text-primary text-gray-700 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Search
                </Link>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex flex-col gap-4 py-6 text-gray-500">
                <SheetDescription className="text-center text-sm">
                  © {new Date().getFullYear()} Your Company. All rights reserved.
                </SheetDescription>
                <div className="flex justify-center gap-4">
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    <LinkedinIcon className="h-5 w-5" />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    <TwitterIcon className="h-5 w-5" />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    <FacebookIcon className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
