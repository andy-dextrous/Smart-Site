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

type NavItemLink = NonNullable<HeaderType["navItems"]>[number]["link"]
type SubItemLink = NonNullable<NonNullable<NavItemLink["subItems"]>[number]["link"]>

/****************************************************
 * Header Navigation - Main Navigation Of Website
 ****************************************************/

export const HeaderNavigation: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

  return (
    <NavigationMenu className="hidden md:flex" orientation="vertical">
      <NavigationMenuList>
        {navItems.map(({ link }, i: number) => {
          if (link.hasSubItems && link.subItems && link.subItems.length > 0) {
            return <DropdownNavItem key={i} link={link} />
          } else {
            return <NavItem key={i} link={link} />
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

const DropdownNavItem: React.FC<{ link: NavItemLink }> = ({ link }) => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="cursor-pointer">
        {link.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-fit gap-3 p-4">
          {link.subItems?.map((subItem, j: number) => {
            const subLink = subItem.link

            if (subLink.hasSubItems && subLink.subItems && subLink.subItems.length > 0) {
              return <NestedDropdownItem key={j} subLink={subLink} />
            }

            return <DropdownLink key={j} subLink={subLink} />
          })}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

/****************************************************
 * Nested dropdown section
 ****************************************************/

const NestedDropdownItem: React.FC<{ subLink: SubItemLink }> = ({ subLink }) => {
  return (
    <li className="row-span-3">
      <div className="mb-2 cursor-pointer font-medium">{subLink.label}</div>
      <ul className="space-y-1">
        {subLink.subItems?.map((nestedItem, k: number) => (
          <li
            key={k}
            className="hover:bg-accent hover:text-accent-foreground block cursor-pointer rounded-md p-3 leading-none transition-colors select-none"
          >
            <CMSLink {...nestedItem.link}>{nestedItem.link.label}</CMSLink>
          </li>
        ))}
      </ul>
    </li>
  )
}

/****************************************************
 * Single dropdown link item
 ****************************************************/

const DropdownLink: React.FC<{ subLink: SubItemLink }> = ({ subLink }) => {
  return (
    <li className="hover:bg-accent hover:text-accent-foreground block cursor-pointer rounded-md p-3 leading-none transition-colors select-none">
      <CMSLink {...subLink}>{subLink.label}</CMSLink>
    </li>
  )
}

/****************************************************
 * Search icon component
 ****************************************************/

const SearchNavItem: React.FC = () => {
  return (
    <NavigationMenuItem>
      <Link href="/search" passHref>
        <NavigationMenuLink className="cursor-pointer">
          <SearchIcon className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </NavigationMenuLink>
      </Link>
    </NavigationMenuItem>
  )
}
