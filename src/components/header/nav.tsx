"use client"

import { CMSLink } from "@/components/fields/link"
import type { Header as HeaderType } from "@/admin/payload/payload-types"
import { SearchCommandLauncher } from "@/components/search/search-dialog"
import { ChevronDown, ChevronRight } from "lucide-react"
import * as React from "react"

type NavItemLink = NonNullable<HeaderType["navItems"]>[number]["item"]["link"]

type ChildItemType = {
  link: NavItemLink
  hasChildren?: boolean | null
  subItems?: Array<{ link: NavItemLink }> | null
}

type SubItemType = {
  link: NavItemLink
}

type NavigationSearchConfig = {
  enabled: boolean
  mode: "page" | "modal" | "hybrid"
}

interface HeaderNavigationProps {
  data: HeaderType
  search: NavigationSearchConfig
}

/****************************************************
 * Header Navigation - Main Navigation Of Website
 ****************************************************/

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ data, search }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="hidden h-full items-center lg:flex">
      <ul className="gap-content-sm flex h-full flex-wrap items-center">
        {navItems.map(({ item }, i: number) => {
          if (item?.hasDropdown && item?.subItems && item?.subItems?.length > 0) {
            return <NavItemWithDropdown key={i} item={item} />
          }
          return <NavItem key={i} link={item?.link} />
        })}
        {search.enabled ? (
          <li className="relative flex h-full items-center">
            <SearchCommandLauncher
              mode={search.mode}
              variant="icon"
              className="text-dark hover:text-dark gap-content-xs flex h-full cursor-pointer items-center no-underline transition-colors duration-100"
            />
          </li>
        ) : null}
      </ul>
    </nav>
  )
}

/****************************************************
 * Nav Item
 ****************************************************/

const NavItem: React.FC<{ link: NavItemLink }> = ({ link }) => {
  const isButton = link?.appearance === "button"

  return (
    <li className="relative flex h-full items-center">
      <CMSLink
        className={
          isButton
            ? "cursor-pointer no-underline"
            : "text-dark hover:text-dark gap-content-xs flex h-full cursor-pointer items-center no-underline transition-colors duration-100"
        }
        {...link}
      >
        {link?.label}
      </CMSLink>
    </li>
  )
}

/****************************************************
 * Dropdown menu item
 ****************************************************/

const NavItemWithDropdown: React.FC<{
  item: NonNullable<HeaderType["navItems"]>[number]["item"]
}> = ({ item }) => {
  return (
    <li className="group relative flex h-full items-center">
      <CMSLink
        {...item?.link}
        className="text-dark hover:text-dark gap-content-xs flex h-full cursor-pointer items-center no-underline transition-colors duration-100"
      >
        <span>{item?.link?.label}</span>
        <ChevronDown className="text-dark-600 ml-content-xs h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
      </CMSLink>

      <div className="absolute left-0 top-full h-1 w-full opacity-0 group-hover:opacity-100" />

      <div className="border-dark-border mt-content-xs translate-y-control-sm pointer-events-none absolute left-0 top-auto z-30 w-56 min-w-full transform rounded-md border bg-white text-sm opacity-0 shadow-lg transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <div className="py-content-sm relative z-10 w-full">
          <ul className="list-none">
            {item.subItems?.map((childItem, j: number) => {
              const child = childItem.child

              if (child.hasChildren && child.subItems && child.subItems.length > 0) {
                return <NestedDropdownItem key={j} child={child} />
              }

              return <DropdownLink key={j} child={child} />
            })}
          </ul>
        </div>
      </div>
    </li>
  )
}

/****************************************************
 * Nested dropdown section
 ****************************************************/

const NestedDropdownItem: React.FC<{ child: ChildItemType }> = ({ child }) => {
  return (
    <li className="group/nested relative">
      <div className="text-dark hover:bg-neutral gap-content-xs px-content py-content-sm flex w-full cursor-pointer items-center text-sm no-underline transition-colors duration-100">
        <span className="flex-1">{child?.link?.label}</span>
        <ChevronRight className="text-dark-600 ml-content-xs h-4 w-4" />
      </div>

      <div className="absolute right-0 top-0 h-full w-1 opacity-0 group-hover/nested:opacity-100" />

      <div className="border-dark-border ml-content-xs translate-y-control-sm pointer-events-none absolute left-full top-0 z-30 w-56 min-w-full transform rounded-md border bg-white text-sm opacity-0 shadow-md transition-all duration-300 group-hover/nested:pointer-events-auto group-hover/nested:translate-y-0 group-hover/nested:opacity-100">
        <div className="py-content-sm relative z-10 w-full">
          <ul className="list-none">
            {child?.subItems?.map((subItem: SubItemType, k: number) => (
              <li key={k}>
                <CMSLink
                  className="text-dark hover:bg-neutral gap-content-xs px-content py-content-sm flex w-full cursor-pointer items-center text-sm no-underline transition-colors duration-100"
                  {...subItem.link}
                >
                  <span className="flex-1">{subItem.link?.label}</span>
                </CMSLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  )
}

/****************************************************
 * Single dropdown link item
 ****************************************************/

const DropdownLink: React.FC<{ child: ChildItemType }> = ({ child }) => {
  return (
    <li>
      <CMSLink
        className="text-dark hover:bg-neutral gap-content-xs px-content py-content-sm flex w-full cursor-pointer items-center text-sm no-underline transition-colors duration-100"
        {...child.link}
      >
        <span className="flex-1">{child.link?.label}</span>
      </CMSLink>
    </li>
  )
}
