"use client"

import * as React from "react"
import { createContext, useContext } from "react"
import { ChevronDownIcon } from "lucide-react"
import {
  Root as NavigationMenuRoot,
  List as NavigationMenuListPrimitive,
  Item as NavigationMenuItemPrimitive,
  Trigger as NavigationMenuTriggerPrimitive,
  Content as NavigationMenuContentPrimitive,
  Link as NavigationMenuLinkPrimitive,
  Viewport as NavigationMenuViewportPrimitive,
  Indicator as NavigationMenuIndicatorPrimitive,
} from "@radix-ui/react-navigation-menu"
import { tv } from "tailwind-variants"
import { cn } from "@/utilities/ui"

/****************************************************
 * Navigation Menu Types
 ****************************************************/

type NavigationMenuProps = React.ComponentPropsWithoutRef<typeof NavigationMenuRoot> & {
  variant?: "light" | "dark"
}

type NavigationMenuListProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuListPrimitive
>

type NavigationMenuTriggerProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuTriggerPrimitive
>

type NavigationMenuContentProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuContentPrimitive
>

type NavigationMenuViewportProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuViewportPrimitive
>

type NavigationMenuIndicatorProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuIndicatorPrimitive
>

/****************************************************
 * Navigation Menu Context
 ****************************************************/

const NavigationMenuContext = createContext<{ theme: "light" | "dark" }>({
  theme: "light",
})

/****************************************************
 * Navigation Menu Variants
 ****************************************************/

const navigationMenu = tv({
  slots: {
    root: "relative z-10 flex max-w-max flex-1 items-center justify-center",
    list: "group flex flex-1 list-none items-center justify-center space-x-1",
    trigger:
      "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-base font-normal transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50",
    content:
      "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 top-0 left-0 w-full text-base md:absolute md:w-auto",
    viewport:
      "origin-top-center bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md shadow md:w-[var(--radix-navigation-menu-viewport-width)]",
    indicator:
      "data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden",
    viewportWrapper: "absolute top-full left-0 flex justify-center",
    indicatorArrow:
      "bg-border relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm shadow-md",
    chevronIcon:
      "relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180",
  },
  variants: {
    theme: {
      light: {
        trigger: "focus:text-primary text-foreground hover:text-primary font-normal",
        chevronIcon: "text-foreground",
        indicatorArrow: "bg-background",
        content: "bg-background text-foreground",
      },
      dark: {
        trigger:
          "text-background hover:text-primary-foreground focus:text-primary-foreground cursor-pointer bg-transparent font-normal",
        chevronIcon: "text-primary-foreground",
        indicatorArrow: "bg-primary-foreground",
        content: "bg-foreground text-background",
      },
    },
  },
  defaultVariants: {
    theme: "light",
  },
})

/****************************************************
 * Navigation Menu Root Components
 ****************************************************/

const NavigationMenu = ({
  className,
  children,
  variant = "light",
  ...props
}: NavigationMenuProps) => {
  const styles = navigationMenu({ theme: variant })
  return (
    <NavigationMenuContext.Provider value={{ theme: variant }}>
      <NavigationMenuRoot className={cn(styles.root(), className)} {...props}>
        {children}
        <NavigationMenuViewport />
      </NavigationMenuRoot>
    </NavigationMenuContext.Provider>
  )
}

const NavigationMenuList = ({ className, ...props }: NavigationMenuListProps) => {
  const { theme } = useContext(NavigationMenuContext)
  const styles = navigationMenu({ theme })
  return (
    <NavigationMenuListPrimitive className={cn(styles.list(), className)} {...props} />
  )
}

const NavigationMenuItem = NavigationMenuItemPrimitive

/****************************************************
 * Navigation Menu Interactive Components
 ****************************************************/

const NavigationMenuTrigger = ({
  className,
  children,
  ...props
}: NavigationMenuTriggerProps) => {
  const { theme } = useContext(NavigationMenuContext)
  const styles = navigationMenu({ theme })
  return (
    <NavigationMenuTriggerPrimitive
      className={cn(styles.trigger(), "group", className)}
      {...props}
    >
      {children}{" "}
      <ChevronDownIcon className={cn(styles.chevronIcon())} aria-hidden="true" />
    </NavigationMenuTriggerPrimitive>
  )
}

const NavigationMenuContent = ({ className, ...props }: NavigationMenuContentProps) => {
  const { theme } = useContext(NavigationMenuContext)
  const styles = navigationMenu({ theme })
  return (
    <NavigationMenuContentPrimitive
      className={cn(
        styles.content(),
        "min-w-[var(--radix-navigation-menu-viewport-width)] whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
}

const NavigationMenuLink = React.forwardRef<
  React.ElementRef<typeof NavigationMenuLinkPrimitive>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuLinkPrimitive>
>(({ className, ...props }, ref) => (
  <NavigationMenuLinkPrimitive
    ref={ref}
    className={cn(
      "hover:text-primary focus:text-primary block space-y-1 rounded-md p-3 text-base leading-none font-normal no-underline transition-colors outline-none select-none",
      className
    )}
    {...props}
  />
))
NavigationMenuLink.displayName = NavigationMenuLinkPrimitive.displayName

/****************************************************
 * Navigation Menu Viewport Components
 ****************************************************/

const NavigationMenuViewport = ({ className, ...props }: NavigationMenuViewportProps) => {
  const { theme } = useContext(NavigationMenuContext)
  const styles = navigationMenu({ theme })
  return (
    <div className={cn(styles.viewportWrapper())}>
      <NavigationMenuViewportPrimitive
        className={cn(styles.viewport(), "min-w-max", className)}
        {...props}
      />
    </div>
  )
}

const NavigationMenuIndicator = ({
  className,
  ...props
}: NavigationMenuIndicatorProps) => {
  const { theme } = useContext(NavigationMenuContext)
  const styles = navigationMenu({ theme })
  return (
    <NavigationMenuIndicatorPrimitive
      className={cn(styles.indicator(), className)}
      {...props}
    >
      <div className={cn(styles.indicatorArrow())} />
    </NavigationMenuIndicatorPrimitive>
  )
}

/****************************************************
 * Display Names
 ****************************************************/

NavigationMenu.displayName = NavigationMenuRoot.displayName
NavigationMenuList.displayName = NavigationMenuListPrimitive.displayName
NavigationMenuTrigger.displayName = NavigationMenuTriggerPrimitive.displayName
NavigationMenuContent.displayName = NavigationMenuContentPrimitive.displayName
NavigationMenuViewport.displayName = NavigationMenuViewportPrimitive.displayName
NavigationMenuIndicator.displayName = NavigationMenuIndicatorPrimitive.displayName

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuIndicator,
}
