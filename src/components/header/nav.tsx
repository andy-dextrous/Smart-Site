import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { CMSLink } from "@/payload/components/cms-link"
import type { Header as HeaderType } from "@/payload/payload-types"
import { SearchIcon } from "lucide-react"
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
    <NavigationMenu className="hidden md:flex" orientation="vertical">
      <NavigationMenuList>
        {navItems.map(({ item }, i: number) => {
          if (item?.hasDropdown && item?.subItems && item?.subItems?.length > 0) {
            return <NavItemWithDropdown key={i} item={item} />
          } else {
            return <NavItem key={i} link={item?.link} />
          }
        })}
        <SearchNavItem />
      </NavigationMenuList>
    </NavigationMenu>
  )
}

/****************************************************
 * Nav Item
 ****************************************************/

const NavItem: React.FC<{ link: NavItemLink }> = ({ link }) => {
  return (
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <CMSLink {...link}>{link.label}</CMSLink>
      </NavigationMenuLink>
    </NavigationMenuItem>
  )
}

/****************************************************
 * Dropdown menu item
 ****************************************************/

const NavItemWithDropdown: React.FC<{
  item: NonNullable<HeaderType["navItems"]>[number]["item"]
}> = ({ item }) => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="cursor-pointer">
        {item?.link?.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-fit gap-3 p-4">
          {item.subItems?.map((childItem, j: number) => {
            const child = childItem.child

            if (child.hasChildren && child.subItems && child.subItems.length > 0) {
              return <NestedDropdownItem key={j} child={child} />
            }

            return <DropdownLink key={j} child={child} />
          })}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

/****************************************************
 * Nested dropdown section
 ****************************************************/

const NestedDropdownItem: React.FC<{ child: ChildItemType }> = ({ child }) => {
  return (
    <li className="row-span-3">
      <div className="mb-2 cursor-pointer font-medium">{child?.link?.label}</div>
      <ul className="space-y-1">
        {child?.subItems?.map((subItem: SubItemType, k: number) => (
          <li
            key={k}
            className="hover:bg-accent hover:text-accent-foreground block cursor-pointer rounded-md p-3 leading-none transition-colors select-none"
          >
            <CMSLink {...subItem.link}>{subItem.link.label}</CMSLink>
          </li>
        ))}
      </ul>
    </li>
  )
}

/****************************************************
 * Single dropdown link item
 ****************************************************/

const DropdownLink: React.FC<{ child: ChildItemType }> = ({ child }) => {
  return (
    <li className="hover:bg-accent hover:text-accent-foreground block cursor-pointer rounded-md p-3 leading-none transition-colors select-none">
      <CMSLink {...child.link}>{child.link.label}</CMSLink>
    </li>
  )
}

/****************************************************
 * Search icon component
 ****************************************************/

const SearchNavItem: React.FC = () => {
  return (
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <Link href="/search">
          <SearchIcon className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  )
}
