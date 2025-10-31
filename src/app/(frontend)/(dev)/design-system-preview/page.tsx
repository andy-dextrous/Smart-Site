'use client'

import * as React from "react"
import { cn } from "@/utilities/ui"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { PhoneInput } from "@/components/ui/phone-input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowRightIcon, MailIcon, PaletteIcon, SparklesIcon } from "lucide-react"

export const dynamic = "force-static"

type ButtonVariant = NonNullable<ButtonProps["variant"]>
type ButtonSize = Exclude<NonNullable<ButtonProps["size"]>, undefined>

type ButtonVariantOption = {
  label: string
  variant: ButtonVariant
}

type ButtonSizeOption = {
  label: string
  size: ButtonSize
}

type ColorSwatch = {
  label: string
  token: string
}

type ColorGroup = {
  title: string
  swatches: ColorSwatch[]
}

const buttonVariantsConfig: ButtonVariantOption[] = [
  { label: "Default", variant: "default" },
  { label: "Outline", variant: "outline" },
  { label: "Dark Outline", variant: "outlineDark" },
  { label: "Gradient Outline", variant: "outlineGradient" },
  { label: "Secondary", variant: "secondary" },
  { label: "White", variant: "white" },
  { label: "Dark", variant: "dark" },
  { label: "Ghost", variant: "ghost" },
  { label: "Link", variant: "link" },
]

const buttonSizesConfig: ButtonSizeOption[] = [
  { label: "Small", size: "sm" },
  { label: "Medium", size: "md" },
  { label: "Large", size: "lg" },
  { label: "Extra Large", size: "xl" },
]

const colorGroups: ColorGroup[] = [
  {
    title: "Primary",
    swatches: [
      { label: "--color-primary", token: "--color-primary" },
      { label: "--color-primary-50", token: "--color-primary-50" },
      { label: "--color-primary-100", token: "--color-primary-100" },
      { label: "--color-primary-200", token: "--color-primary-200" },
      { label: "--color-primary-300", token: "--color-primary-300" },
      { label: "--color-primary-400", token: "--color-primary-400" },
      { label: "--color-primary-500", token: "--color-primary-500" },
      { label: "--color-primary-600", token: "--color-primary-600" },
    ],
  },
  {
    title: "Secondary",
    swatches: [
      { label: "--color-secondary", token: "--color-secondary" },
      { label: "--color-secondary-50", token: "--color-secondary-50" },
      { label: "--color-secondary-100", token: "--color-secondary-100" },
      { label: "--color-secondary-200", token: "--color-secondary-200" },
      { label: "--color-secondary-300", token: "--color-secondary-300" },
      { label: "--color-secondary-400", token: "--color-secondary-400" },
      { label: "--color-secondary-500", token: "--color-secondary-500" },
      { label: "--color-secondary-600", token: "--color-secondary-600" },
      { label: "--color-secondary-700", token: "--color-secondary-700" },
    ],
  },
  {
    title: "Dark Neutral",
    swatches: [
      { label: "--color-dark", token: "--color-dark" },
      { label: "--color-dark-50", token: "--color-dark-50" },
      { label: "--color-dark-100", token: "--color-dark-100" },
      { label: "--color-dark-600", token: "--color-dark-600" },
      { label: "--color-dark-700", token: "--color-dark-700" },
      { label: "--color-dark-800", token: "--color-dark-800" },
      { label: "--color-dark-900", token: "--color-dark-900" },
      { label: "--color-dark-950", token: "--color-dark-950" },
    ],
  },
  {
    title: "Supporting",
    swatches: [
      { label: "--color-neutral", token: "--color-neutral" },
      { label: "--color-white", token: "--color-white" },
      { label: "--color-dark-border", token: "--color-dark-border" },
      { label: "--color-light-border", token: "--color-light-border" },
    ],
  },
]

const typographyHeadings = [
  { label: "Display H1", element: "h1", sample: "Design System Showcase" },
  { label: "Display H2", element: "h2", sample: "Typography Tokens" },
  { label: "Display H3", element: "h3", sample: "Fluid Headline Scale" },
  { label: "Display H4", element: "h4", sample: "Adaptive Headlines" },
  { label: "Display H5", element: "h5", sample: "Interface Subheading" },
  { label: "Display H6", element: "h6", sample: "Supporting Title" },
] as const

const typographyBodyClasses = [
  { label: "Text XS", className: "text-xs" },
  { label: "Text SM", className: "text-sm" },
  { label: "Text Base", className: "text-base" },
  { label: "Text LG", className: "text-lg" },
  { label: "Text XL", className: "text-xl" },
] as const

export default function DesignSystemPreviewPage(): any {
  return (
    <main className="bg-white text-dark">
      <header className="mt-nav border-dark-border border-b px-section-x py-section-lg">
        <div className="container flex flex-col gap-content">
          <div className="flex items-center gap-content">
            <SparklesIcon className="size-6 text-primary" />
            <span className="text-sm uppercase tracking-[0.2em]">
              Smart Site
            </span>
          </div>
          <div className="flex flex-col gap-content-sm">
            <h1>Design System Preview</h1>
            <p className="max-w-2xl text-dark-600">
              Private playground for reviewing the starter&rsquo;s tokens, typography,
              palette, and UI building blocks before shipping changes into sections or
              client projects.
            </p>
          </div>
          <div className="flex flex-wrap gap-content-sm">
            <Button size="md" variant="dark">
              <PaletteIcon className="size-4" />
              Explore Tokens
            </Button>
            <Button size="md" variant="outlineDark">
              <ArrowRightIcon />
              Jump to Components
            </Button>
          </div>
        </div>
      </header>
      <TypographyShowcase />
      <ColorShowcase />
      <ComponentShowcase />
    </main>
  )
}

/*************************************************************************/
/*  TYPOGRAPHY
/*************************************************************************/

function TypographyShowcase(): any {
  return (
    <section className="px-section-x py-section-lg">
      <div className="container flex flex-col gap-content-lg">
        <div className="flex flex-col gap-content-sm">
          <h2>Typography</h2>
          <p className="text-dark-600">
            Headings and body styles respond to the fluid type scale while remaining easy
            to inspect for hierarchy, rhythm, and legibility.
          </p>
        </div>
        <div className="grid gap-content-lg lg:grid-cols-2">
          <div className="flex flex-col gap-content">
            {typographyHeadings.map(item => (
              <div
                key={item.label}
                className="border-dark-border flex flex-col gap-content-xs rounded-lg border p-content-lg"
              >
                <span className="text-xs uppercase tracking-[0.2em] text-dark-600">
                  {item.label}
                </span>
                {React.createElement(item.element, undefined, item.sample)}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-content">
            <div className="border-dark-border rounded-lg border p-content-lg">
              <span className="text-xs uppercase tracking-[0.2em] text-dark-600">
                Body Copy
              </span>
              <p className="mt-content text-base text-dark-600">
                The universal body stack keeps paragraphs legible across breakpoints.
                Line-height and letter-spacing remain consistent regardless of the token
                you choose. Use `text-base` for paragraphs and scale down with the tokens
                below when you need supporting copy or legal footnotes.
              </p>
            </div>
            <div className="border-dark-border flex flex-col gap-content-sm rounded-lg border p-content-lg">
              <span className="text-xs uppercase tracking-[0.2em] text-dark-600">
                Scale Steps
              </span>
              <div className="flex flex-col gap-content-xs">
                {typographyBodyClasses.map(item => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-md bg-neutral px-control-lg py-control-sm"
                  >
                    <span className="text-dark-600">{item.label}</span>
                    <span className={item.className}>Aa</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-dark-border flex flex-col gap-content-sm rounded-lg border p-content-lg">
              <span className="text-xs uppercase tracking-[0.2em] text-dark-600">
                Rich Text Preview
              </span>
              <div className="prose max-w-none text-dark">
                <h3>Balanced Headlines</h3>
                <p>
                  Rich text surfaces inherit the same tokens as the rest of the app. This
                  keeps marketing sections, CMS pages, and product education aligned.
                </p>
                <ul>
                  <li>Headings map to the fluid display scale</li>
                  <li>Paragraphs reuse the base line-height</li>
                  <li>Spacing tokens coordinate nested elements</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/*************************************************************************/
/*  COLORS
/*************************************************************************/

function ColorShowcase(): any {
  return (
    <section className="border-y border-dark-border bg-neutral px-section-x py-section-lg">
      <div className="container flex flex-col gap-content-lg">
        <div className="flex flex-col gap-content-sm">
          <h2>Color Palette</h2>
          <p className="text-dark-600">
            Each role references Tailwind&rsquo;s OKLCH palette while exposing brand
            tokens ready for overrides. Tokens cascade through components and prose so
            one update realigns the entire interface.
          </p>
        </div>
        <div className="grid gap-content-lg lg:grid-cols-2">
          {colorGroups.map(group => (
            <div key={group.title} className="flex flex-col gap-content-sm">
              <h3 className="text-sm uppercase tracking-[0.2em] text-dark-600">
                {group.title}
              </h3>
              <div className="grid gap-content-sm sm:grid-cols-2">
                {group.swatches.map(swatch => (
                  <div
                    key={swatch.token}
                    className="border-dark-border flex flex-col gap-content-xs rounded-lg border bg-white p-content"
                  >
                    <div
                      className="h-16 w-full rounded-md"
                      style={{ backgroundColor: `var(${swatch.token})` }}
                    />
                    <div className="flex flex-col gap-content-xs">
                      <span className="text-sm">{swatch.label}</span>
                      <span className="text-xs text-dark-600">
                        var({swatch.token})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/*************************************************************************/
/*  COMPONENTS
/*************************************************************************/

function ComponentShowcase(): any {
  return (
    <section className="px-section-x py-section-lg">
      <div className="container flex flex-col gap-content-xl">
        <div className="flex flex-col gap-content-sm">
          <h2>UI Components</h2>
          <p className="text-dark-600">
            Starter primitives ship ready for sections and marketing flows. Explore every
            variant below before promoting updates back into the starter.
          </p>
        </div>
        <ButtonGallery />
        <FormGallery />
        <MenuGallery />
        <OverlayGallery />
        <NavigationGallery />
        <ContentGallery />
      </div>
    </section>
  )
}

function ButtonGallery(): any {
  return (
    <div className="flex flex-col gap-content-lg">
      <div className="flex flex-col gap-content-xs">
        <h3 className="text-sm uppercase tracking-[0.2em] text-dark-600">
          Buttons
        </h3>
        <p className="text-dark-600">
          Variants and sizes draw from the design tokens, covering surface, outline, and
          text-only treatments. Combine with icons for call-to-action states.
        </p>
      </div>
      <div className="grid gap-content-lg lg:grid-cols-2">
          {buttonVariantsConfig.map(({ label, variant }) => (
          <div
            key={variant}
            className={cn(
              "border-dark-border flex flex-col gap-content-sm rounded-lg border p-content-lg",
              variant === "white" ? "bg-neutral" : ""
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-dark-600">
                variant=&quot;{variant}&quot;
              </span>
            </div>
            <div className="flex flex-wrap items-start gap-content-sm">
              {buttonSizesConfig.map(({ label: sizeLabel, size }) => (
                <Button key={size} variant={variant} size={size}>
                  <span>{sizeLabel}</span>
              <ArrowRightIcon />
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-start gap-content-sm">
              <Button variant={variant} size="md" icon>
                <SparklesIcon />
              </Button>
              <Button variant={variant} size="sm" layout="centered">
                <MailIcon />
                Subscribe
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FormGallery(): any {
  const [isChecked, setIsChecked] = React.useState(true)
  const [selectValue, setSelectValue] = React.useState("option-one")
  const [phoneValue, setPhoneValue] = React.useState("+61400123456")

  return (
    <div className="mt-content flex flex-col gap-content-lg">
      <div className="flex flex-col gap-content-xs">
        <h3 className="text-sm uppercase tracking-[0.2em] text-dark-600">
          Form Controls
        </h3>
        <p className="text-dark-600">
          Inputs align with spacing tokens, borders, and focus rings so forms stay
          consistent across sections.
        </p>
      </div>
      <div className="grid gap-content-lg md:grid-cols-2">
        <div className="border-dark-border flex flex-col gap-content-sm rounded-lg border p-content-lg">
          <Label htmlFor="design-email">Email Address</Label>
          <Input
            id="design-email"
            placeholder="Enter your email"
            type="email"
            defaultValue="founder@example.com"
          />
          <Label htmlFor="design-message">Message</Label>
          <Textarea
            id="design-message"
            placeholder="Tell us about your goals"
            rows={4}
          />
        </div>
        <div className="border-dark-border flex flex-col gap-content-sm rounded-lg border p-content-lg">
          <div className="flex items-center gap-content-sm">
            <Checkbox
              id="design-checkbox"
              checked={isChecked}
            onCheckedChange={value => setIsChecked(value === true)}
          />
            <Label htmlFor="design-checkbox">Keep me informed about new features</Label>
          </div>
          <Select value={selectValue} onValueChange={setSelectValue}>
            <SelectTrigger data-testid="design-select">
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option-one">Essential Plan</SelectItem>
              <SelectItem value="option-two">Growth Plan</SelectItem>
              <SelectItem value="option-three">Enterprise Plan</SelectItem>
            </SelectContent>
          </Select>
          <PhoneInput
            value={phoneValue}
            onChange={value => setPhoneValue(value ?? "")}
            defaultCountry="AU"
          />
        </div>
      </div>
    </div>
  )
}

function MenuGallery(): any {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [dropdownChecked, setDropdownChecked] = React.useState(true)
  const [dropdownRole, setDropdownRole] = React.useState("editor")

  return (
    <div className="mt-content flex flex-col gap-content-lg">
      <div className="flex flex-col gap-content-xs">
        <h3 className="text-sm uppercase tracking-[0.2em] text-dark-600">
          Menus &amp; Popovers
        </h3>
        <p className="text-dark-600">
          Dropdowns inherit control spacing, hover styles, and focus rings for consistent
          overlays.
        </p>
      </div>
      <div className="grid gap-content-lg md:grid-cols-2">
        <div className="border-dark-border flex flex-col gap-content-sm rounded-lg border p-content-lg">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="md" variant="outlineDark">
                Open Dropdown
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                Invite teammate
                <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                View analytics
                <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={dropdownChecked}
                onCheckedChange={value => setDropdownChecked(value === true)}
              >
                Enable notifications
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Roles
                  <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuRadioGroup
                    value={dropdownRole}
                    onValueChange={setDropdownRole}
                  >
                    <DropdownMenuRadioItem value="viewer">Viewer</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="editor">Editor</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <Button size="md" variant="dark">
                Profile Popover
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="flex flex-col gap-content-sm">
                <div className="flex items-center gap-content-sm">
                  <span className="size-10 rounded-full bg-secondary text-white center">
                    JD
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm">Jordan Drew</span>
                    <span className="text-xs text-dark-600">Product Director</span>
                  </div>
                </div>
                <p className="text-sm text-dark-600">
                  Manage account preferences, billing, and team roles from this control
                  surface.
                </p>
                <div className="flex gap-content-sm">
                  <Button size="md" variant="outlineDark">
                    Account
                  </Button>
                  <Button size="md" variant="dark">
                    Sign Out
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="border-dark-border flex flex-col gap-content-sm rounded-lg border p-content-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="md" variant="outlineDark">
                Hover Me
              </Button>
            </TooltipTrigger>
            <TooltipContent>Shows on hover with the brand accent.</TooltipContent>
          </Tooltip>
          <Accordion type="single" collapsible defaultValue="item-one">
            <AccordionItem value="item-one">
              <AccordionTrigger>What is included?</AccordionTrigger>
              <AccordionContent>
                Modular sections, CMS primitives, and the analytics overlay ship by
                default so you can build landing pages rapidly.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-two">
              <AccordionTrigger>Can I customize tokens?</AccordionTrigger>
              <AccordionContent>
                Update the spacing, color, and typography files at the top of this page to
                retheme the entire experience.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  )
}

function OverlayGallery(): any {
  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const [isSheetOpen, setSheetOpen] = React.useState(false)
  const [isCommandOpen, setCommandOpen] = React.useState(false)

  return (
    <div className="mt-content flex flex-col gap-content-lg">
      <div className="flex flex-col gap-content-xs">
        <h3 className="text-sm uppercase tracking-[0.2em] text-dark-600">
          Overlays
        </h3>
        <p className="text-dark-600">
          Dialogs, sheets, and the command palette reuse shared focus rings and spacing.
        </p>
      </div>
      <div className="grid gap-content-lg md:grid-cols-2">
        <div className="border-dark-border flex flex-col gap-content-sm rounded-lg border p-content-lg">
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <Button size="md" variant="dark" onClick={() => setDialogOpen(true)}>
              Launch Dialog
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upgrade Plan</DialogTitle>
                <DialogDescription>
                  Move to the Growth plan to unlock extra seats, AI workflows, and
                  automated reporting.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-content-sm">
                <ul className="flex flex-col gap-content-xs text-sm text-dark-600">
                  <li>Unlimited marketing pages</li>
                  <li>Advanced analytics dashboards</li>
                  <li>Priority support with dedicated specialist</li>
                </ul>
              </div>
              <DialogFooter>
                <Button variant="outlineDark" size="md" onClick={() => setDialogOpen(false)}>
                  Not Now
                </Button>
                <Button size="md" variant="dark">
                  Upgrade
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="md" variant="outlineDark">
                Open Sheet
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Section Settings</SheetTitle>
                <SheetDescription>
                  Update layout, background, and call-to-action details for the current
                  hero.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-content-sm px-control-lg">
                <Label htmlFor="sheet-heading">Heading</Label>
                <Input id="sheet-heading" defaultValue="Build with Smart Site" />
                <Label htmlFor="sheet-preheading">Pre-heading</Label>
                <Textarea
                  id="sheet-preheading"
                  rows={3}
                  defaultValue="Optional label displayed above the main heading."
                />
              </div>
              <SheetFooter>
                <Button
                  size="md"
                  variant="outlineDark"
                  onClick={() => setSheetOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="md" variant="dark">
                  Save Changes
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        <div className="border-dark-border flex flex-col gap-content-sm rounded-lg border p-content-lg">
          <Button size="md" variant="dark" onClick={() => setCommandOpen(true)}>
            Open Command Palette
          </Button>
          <CommandDialog open={isCommandOpen} onOpenChange={setCommandOpen}>
            <Command>
              <CommandInput placeholder="Search actions..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>
                    Create section
                    <CommandShortcut>⌘N</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    Duplicate page
                    <CommandShortcut>⌘D</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Navigation">
                  <CommandItem>Go to analytics</CommandItem>
                  <CommandItem>Open content library</CommandItem>
                  <CommandItem>Visit knowledge base</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </CommandDialog>
          <ScrollArea className="h-40 rounded-lg border border-dashed border-dark-border">
            <div className="flex flex-col gap-control-sm p-control-lg">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-md bg-neutral px-control-lg py-control-sm text-sm text-dark-600"
                >
                  Scrollable item {index + 1}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

function NavigationGallery(): any {
  return (
    <div className="mt-content flex flex-col gap-content-lg">
      <div className="flex flex-col gap-content-xs">
        <h3 className="text-sm uppercase tracking-[0.2em] text-dark-600">
          Navigation Menu
        </h3>
        <p className="text-dark-600">
          Radix-driven navigation inherits light and dark variants from the token stack.
        </p>
      </div>
      <div className="border-dark-border flex flex-col gap-content-sm rounded-lg border p-content-lg">
        <NavigationMenu className="rounded-lg border border-dark-border p-control-lg">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent className="p-control-lg">
                <div className="grid w-[360px] gap-control-md p-control-lg md:w-[480px] md:grid-cols-2">
                  <NavigationMenuLink className="border border-transparent hover:bg-neutral">
                    Website Starter
                    <span className="text-dark-600 block text-xs">
                      Launch a marketing site with prebuilt sections.
                    </span>
                  </NavigationMenuLink>
                  <NavigationMenuLink className="border border-transparent hover:bg-neutral">
                    AI Assistant
                    <span className="text-dark-600 block text-xs">
                      Automate updates and content workflows across the CMS.
                    </span>
                  </NavigationMenuLink>
                  <NavigationMenuLink className="border border-transparent hover:bg-neutral">
                    Analytics Deck
                    <span className="text-dark-600 block text-xs">
                      Measure performance with funnel insights and heatmaps.
                    </span>
                  </NavigationMenuLink>
                  <NavigationMenuLink className="border border-transparent hover:bg-neutral">
                    Library Marketplace
                    <span className="text-dark-600 block text-xs">
                      Install new sections, themes, and data blocks in minutes.
                    </span>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Company</NavigationMenuTrigger>
              <NavigationMenuContent className="p-control-lg">
                <div className="flex w-[260px] flex-col gap-control-sm">
                  <NavigationMenuLink>About</NavigationMenuLink>
                  <NavigationMenuLink>Careers</NavigationMenuLink>
                  <NavigationMenuLink>Press</NavigationMenuLink>
                  <NavigationMenuLink>Contact</NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#">
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuIndicator />
        </NavigationMenu>
      </div>
    </div>
  )
}

function ContentGallery(): any {
  return (
    <div className="mt-content flex flex-col gap-content-lg">
      <div className="flex flex-col gap-content-xs">
        <h3 className="text-sm uppercase tracking-[0.2em] text-dark-600">
          Content Patterns
        </h3>
        <p className="text-dark-600">
          Combine typography, spacing, and utility classes to craft editorial layouts
          without leaving the design system.
        </p>
      </div>
      <div className="border-dark-border flex flex-col gap-content rounded-lg border bg-neutral p-content-lg">
        <div className="grid gap-content-lg lg:grid-cols-[2fr,1fr]">
          <article className="flex flex-col gap-content-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-dark-600">
              Case Study
            </p>
            <h3>Scaling acquisition with modular landing pages</h3>
            <p className="text-dark-600">
              Smart Site condenses brand foundations into configurable tokens,
              unlocking rapid iteration across campaigns. This preview route ensures
              designers and engineers stay aligned on the canonical implementation before
              promoting updates to client instances.
            </p>
            <div className="grid gap-content-sm sm:grid-cols-2">
              <div className="rounded-lg border border-dark-border bg-white p-content">
                <span className="text-xs uppercase tracking-[0.2em] text-dark-600">
                  Launch Timeline
                </span>
                <p className="mt-content-xs text-lg">14 days</p>
                <p className="text-sm text-dark-600">
                  From kickoff to production-ready marketing site.
                </p>
              </div>
              <div className="rounded-lg border border-dark-border bg-white p-content">
                <span className="text-xs uppercase tracking-[0.2em] text-dark-600">
                  Conversion Lift
                </span>
                <p className="mt-content-xs text-lg">+38%</p>
                <p className="text-sm text-dark-600">
                  Achieved by aligning variants with the shared design tokens.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-content-sm">
              <Button variant="dark" size="md">
                Read the Case Study
              </Button>
              <Button variant="outlineDark" size="md">
                Explore Section Library
              </Button>
            </div>
          </article>
          <aside className="flex flex-col gap-content-sm">
            <div className="rounded-lg border border-dark-border bg-white p-content">
              <span className="text-xs uppercase tracking-[0.2em] text-dark-600">
                Tokens Reference
              </span>
              <ul className="mt-content-xs flex flex-col gap-content-xs text-sm text-dark-600">
                <li>Spacing scale drives layout, gutter, and inset rhythm.</li>
                <li>Typography clamps keep headings in sync with viewport width.</li>
                <li>Color roles map to Tailwind palettes for quick rebrands.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-dark-border bg-white p-content">
              <span className="text-xs uppercase tracking-[0.2em] text-dark-600">
                Section Checklist
              </span>
              <ol className="mt-content-xs flex flex-col gap-content-xs text-sm text-dark-600">
                <li>Start with Section layout and container helpers.</li>
                <li>Use content spacing tokens for internal gaps.</li>
                <li>Reference typography tokens for headlines and body copy.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
