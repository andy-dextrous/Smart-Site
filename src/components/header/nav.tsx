"use client"

import { CMSLink } from "@/payload/components/frontend/cms-link"
import type { Header as HeaderType } from "@/payload/payload-types"
import { SearchIcon, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import * as React from "react"

type NavItemLink = NonNullable<HeaderType["navItems"]>[number]["item"]["link"]
// Simplify the type definition to avoid index signature errors
type ChildItemType = {
  link: NavItemLink
  hasChildren?: boolean | null
  subItems?: Array<{ link: NavItemLink }> | null
}

type SubItemType = {
  link: NavItemLink
}

/****************************************************
 * Header Navigation - Main Navigation Of Website
 ****************************************************/

export const HeaderNavigation: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="hidden lg:flex">
      <ul className="flex w-full flex-wrap items-center">
        {navItems.map(({ item }, i: number) => {
          if (item?.hasDropdown && item?.subItems && item?.subItems?.length > 0) {
            return <NavItemWithDropdown key={i} item={item} />
          } else {
            return <NavItem key={i} link={item?.link} />
          }
        })}
      </ul>
    </nav>
  )
}

/****************************************************
 * Nav Item
 ****************************************************/

const NavItem: React.FC<{ link: NavItemLink }> = ({ link }) => {
  return (
    <li className="relative block">
      <CMSLink
        className="text-gradient-hover mx-1 flex h-10 cursor-pointer items-center px-4 text-sm leading-10 !font-light text-white uppercase no-underline transition-colors duration-100"
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
    <li className="group relative block">
      <CMSLink
        {...item?.link}
        className="text-gradient-hover mx-1 flex h-10 cursor-pointer items-center px-4 text-sm leading-10 !font-light text-white uppercase no-underline transition-colors duration-100"
      >
        <span>{item?.link?.label}</span>
        <ChevronDown className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
      </CMSLink>

      {/* Invisible bridge to cover the gap */}
      <div className="absolute top-full left-0 h-1 w-full opacity-0 group-hover:opacity-100" />

      <div className="border-light-border bg-dark/80 pointer-events-none absolute top-auto left-0 z-30 mt-1 w-56 min-w-full translate-y-2 transform border text-sm opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        {/* <span className="border-light-border bg-dark absolute top-0 left-0 -mt-1 ml-6 h-3 w-3 rotate-45 transform"></span> */}
        <div className="relative z-10 w-full py-1">
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
      <div className="flex w-full cursor-pointer items-center px-4 py-2 text-sm !font-light text-white uppercase no-underline transition-colors duration-100 hover:bg-white/5">
        <span className="flex-1">{child?.link?.label}</span>
        <ChevronRight className="ml-2 h-4 w-4" />
      </div>

      {/* Invisible bridge for nested dropdown */}
      <div className="absolute top-0 right-0 h-full w-1 opacity-0 group-hover/nested:opacity-100" />

      <div className="border-light-border bg-dark/80 pointer-events-none absolute top-0 left-full z-30 ml-1 w-56 min-w-full translate-y-2 transform border text-sm opacity-0 shadow-md backdrop-blur-md transition-all duration-300 group-hover/nested:pointer-events-auto group-hover/nested:translate-y-0 group-hover/nested:opacity-100">
        <span className="border-light-border bg-dark absolute top-0 left-0 mt-2 -ml-1 h-3 w-3 rotate-45 transform"></span>
        <div className="relative z-10 w-full py-1">
          <ul className="list-none">
            {child?.subItems?.map((subItem: SubItemType, k: number) => (
              <li key={k}>
                <CMSLink
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-sm !font-light text-white uppercase no-underline transition-colors duration-100 hover:bg-white/3"
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
        className="flex w-full cursor-pointer items-center px-4 py-2 text-sm !font-light text-white no-underline transition-colors duration-100 hover:bg-white/5"
        {...child.link}
      >
        <span className="flex-1">{child.link?.label}</span>
      </CMSLink>
    </li>
  )
}

/****************************************************
 * Search icon component
 ****************************************************/

const SearchNavItem: React.FC = () => {
  return (
    <li className="relative block">
      <Link
        href="/search"
        className="mx-1 flex h-10 cursor-pointer items-center px-4 leading-10 no-underline transition-colors duration-100"
      >
        <SearchIcon className="h-4 w-4 text-white" />
        <span className="sr-only">Search</span>
      </Link>
    </li>
  )
}
