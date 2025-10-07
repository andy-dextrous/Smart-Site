"use client"

import { Home, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useHotkeys } from "react-hotkeys-hook"

import { useConfig, useTranslation, usePreferences } from "@payloadcms/ui"
import { formatAdminURL } from "@payloadcms/ui/shared"
import { getTranslation } from "@payloadcms/translations"
import { usePathname } from "next/navigation"
import { CollectionIcon } from "@/admin/components/collection-icon"
import { getNavIcon } from "@/admin/payload/components/backend/nav/navIconMap"
import { Button } from "@/admin/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"


/*************************************************************************/
/*  NAV ITEM COMPONENT WITH TOOLTIP AND ANIMATION
/*************************************************************************/

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  isCollapsed,
}: {
  href: string
  icon?: React.ComponentType<{ className?: string }>
  label: string
  isActive: boolean
  isCollapsed: boolean
}) {
  const linkContent = (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-base no-underline transition-all duration-100 ${
        isActive
          ? "bg-admin-accent text-admin-0 hover:bg-admin-accent/90 hover:text-admin-0"
          : "text-admin-800 hover:bg-admin-100 hover:text-admin-900 dark:text-admin-100 dark:hover:bg-admin-800 dark:hover:text-admin-100"
      } ${isCollapsed ? "justify-center px-3" : ""}`}
    >
      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
      {!isCollapsed && (
        <span className="truncate font-medium opacity-0 transition-opacity delay-100 duration-100 group-hover:opacity-100 lg:opacity-100">
          {label}
        </span>
      )}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          <p className="font-medium">{label}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}

/*************************************************************************/
/*  NAV GROUP COMPONENT WITH COLLAPSIBLE FUNCTIONALITY
/*************************************************************************/

function NavGroup({
  label,
  icon: Icon,
  children,
  isCollapsed,
  isOpen,
  onToggle,
}: {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  isCollapsed: boolean
  isOpen: boolean
  onToggle: () => void
}) {
  const groupHeader = (
    <button
      onClick={onToggle}
      className={`text-admin-800 hover:bg-admin-100 hover:text-admin-900 dark:text-admin-100 dark:hover:bg-admin-800 dark:hover:text-admin-100 group flex w-full cursor-pointer items-center gap-3 rounded-lg border-none bg-transparent px-4 py-3 text-base no-underline transition-all duration-100 ${
        isCollapsed ? "justify-center px-3" : ""
      }`}
    >
      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate text-left font-medium opacity-0 transition-opacity delay-100 duration-100 group-hover:opacity-100 lg:opacity-100">
            {label}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-100 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </>
      )}
    </button>
  )

  if (isCollapsed) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>{groupHeader}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            <p className="font-medium">{label}</p>
          </TooltipContent>
        </Tooltip>
        {isOpen && <div className="space-y-1">{children}</div>}
      </>
    )
  }

  return (
    <div>
      {groupHeader}
      {isOpen && <div className="ml-3 space-y-1 pl-3">{children}</div>}
    </div>
  )
}

/*************************************************************************/
/*  APP SIDEBAR - HANDLES DYNAMIC NAVIGATION
/*************************************************************************/

export function AppSidebar() {
  const pathname = usePathname()
  const {
    config: {
      routes: { admin: adminRoute },
      collections,
      globals,
    },
  } = useConfig()
  const { i18n } = useTranslation()
  const { getPreference, setPreference } = usePreferences()

  /*************************************************************************/
  /*  STATE FOR SIDEBAR COLLAPSE
  /*************************************************************************/

  const [isCollapsed, setIsCollapsed] = useState(true)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    business: true,
    forms: false,
    settings: false,
  })

  // Load saved state from Payload preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const collapsedPref = await getPreference("admin-sidebar-collapsed")
        if (collapsedPref?.value === true) {
          setIsCollapsed(true)
        } else if (collapsedPref?.value === false) {
          setIsCollapsed(false)
        }

        const groupsPref = await getPreference("admin-sidebar-groups")
        if (groupsPref?.value && typeof groupsPref.value === "object") {
          setOpenGroups(groupsPref.value as Record<string, boolean>)
        }
      } catch (error) {
        console.warn("Failed to load sidebar preferences:", error)
      }
    }

    loadPreferences()
  }, [getPreference])

  // Save collapsed state to Payload preferences when it changes
  useEffect(() => {
    const saveCollapsedState = async () => {
      try {
        await setPreference("admin-sidebar-collapsed", isCollapsed)
      } catch (error) {
        console.warn("Failed to save sidebar collapsed state:", error)
      }
    }

    saveCollapsedState()
  }, [isCollapsed, setPreference])

  // Save group state to Payload preferences when it changes
  useEffect(() => {
    const saveGroupState = async () => {
      try {
        await setPreference("admin-sidebar-groups", openGroups)
      } catch (error) {
        console.warn("Failed to save sidebar group state:", error)
      }
    }

    saveGroupState()
  }, [openGroups, setPreference])

  /*************************************************************************/
  /*  TOGGLE HANDLER
  /*************************************************************************/

  function toggleSidebar() {
    setIsCollapsed(!isCollapsed)
  }

  /*************************************************************************/
  /*  HOTKEY HANDLER - Command+B to toggle sidebar
  /*************************************************************************/

  useHotkeys("meta+b", toggleSidebar, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  })

  const omittedEntities = [
    "uri-index",
    "payload-preferences",
    "payload-migrations",
    "payload-jobs",
    "payload-locked-documents",
    "search",
    "payload-folders",
  ]

  const visibleCollections = collections.filter(
    ({ slug }) => !omittedEntities.includes(slug)
  )
  const visibleGlobals = globals.filter(({ slug }) => !omittedEntities.includes(slug))

  /*************************************************************************/
  /*  GROUP DEFINITIONS
  /*************************************************************************/

  const groups = {
    business: {
      label: "Your Business",
      icon: getNavIcon("services"), // Using services icon for business group
      items: ["team", "services", "testimonials"],
    },
    forms: {
      label: "Forms",
      icon: getNavIcon("forms"),
      items: ["forms", "form-submissions"],
    },
    settings: {
      label: "Settings",
      icon: getNavIcon("settings"),
      items: ["settings", "ai-settings", "header", "footer", "templates", "redirects", "categories"],
    },
  }

  // Categorize items
  const mainItems = [
    { type: "global", slug: "dashboard", href: "/admin", icon: Home, label: "Dashboard" },
    // Pages collection first
    ...visibleCollections
      .filter(col => col.slug === "pages")
      .map(col => ({
        type: "collection",
        slug: col.slug,
        href: formatAdminURL({ adminRoute, path: `/collections/${col.slug}` }),
        label: getTranslation(col.labels?.plural || col.slug, i18n),
        icon: (props: any) => <CollectionIcon item={col} slug={col.slug} {...props} />,
      })),
    // Other collections (excluding pages since it's already above)
    ...visibleCollections
      .filter(
        col =>
          ![
            "pages",
            "team",
            "services",
            "testimonials",
            "forms",
            "form-submissions",
            "templates",
            "redirects",
            "categories",
            "users",
            "media",
          ].includes(col.slug)
      )
      .map(col => ({
        type: "collection",
        slug: col.slug,
        href: formatAdminURL({ adminRoute, path: `/collections/${col.slug}` }),
        label: getTranslation(col.labels?.plural || col.slug, i18n),
        icon: (props: any) => <CollectionIcon item={col} slug={col.slug} {...props} />,
      })),
    ...visibleGlobals
      .filter(glob => !["header", "footer", "settings", "ai-settings"].includes(glob.slug))
      .map(glob => ({
        type: "global",
        slug: glob.slug,
        href: formatAdminURL({ adminRoute, path: `/globals/${glob.slug}` }),
        label: getTranslation(glob.label || glob.slug, i18n),
        icon: (props: any) => <CollectionIcon item={glob} slug={glob.slug} {...props} />,
      })),
  ]

  return (
    <aside
      className={`bg-admin-50 border-admin-200 dark:bg-admin-950 dark:border-admin-800 relative flex flex-col border-r transition-all duration-100 ${
        isCollapsed ? "w-20" : "w-admin-nav-width"
      }`}
    >
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {/* Main items */}
        {mainItems.map(item => (
          <NavItem
            key={item.slug}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={
              item.slug === "dashboard"
                ? pathname === "/admin"
                : pathname.startsWith(item.href) &&
                  ["/", undefined].includes(pathname[item.href.length])
            }
            isCollapsed={isCollapsed}
          />
        ))}

        {/* Business Group */}
        <NavGroup
          label={groups.business.label}
          icon={groups.business.icon}
          isCollapsed={isCollapsed}
          isOpen={openGroups.business}
          onToggle={() => {
            if (isCollapsed) {
              setIsCollapsed(false)
            }
            setOpenGroups(prev => ({ ...prev, business: !prev.business }))
          }}
        >
          {[...visibleCollections, ...visibleGlobals]
            .filter(item => groups.business.items.includes(item.slug))
            .map(item => {
              const isCollection = "labels" in item
              const href = formatAdminURL({
                adminRoute,
                path: isCollection
                  ? `/collections/${item.slug}`
                  : `/globals/${item.slug}`,
              })
              const label = isCollection
                ? getTranslation(item.labels?.plural || item.slug, i18n)
                : getTranslation(item.label || item.slug, i18n)
              const Icon = (props: any) => <CollectionIcon item={item} slug={item.slug} {...props} />
              const isActive =
                pathname.startsWith(href) &&
                ["/", undefined].includes(pathname[href.length])

              return (
                <NavItem
                  key={item.slug}
                  href={href}
                  icon={Icon}
                  label={label}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                />
              )
            })}
        </NavGroup>

        {/* Media */}
        {visibleCollections
          .filter(col => col.slug === "media")
          .map(collection => {
            const href = formatAdminURL({
              adminRoute,
              path: `/collections/${collection.slug}`,
            })
            const Icon = (props: any) => <CollectionIcon item={collection} slug={collection.slug} {...props} />
            const isActive =
              pathname.startsWith(href) &&
              ["/", undefined].includes(pathname[href.length])

            return (
              <NavItem
                key={collection.slug}
                href={href}
                icon={Icon}
                label={getTranslation(collection.labels?.plural || collection.slug, i18n)}
                isActive={isActive}
                isCollapsed={isCollapsed}
              />
            )
          })}

        {/* Users */}
        {visibleCollections
          .filter(col => col.slug === "users")
          .map(collection => {
            const href = formatAdminURL({
              adminRoute,
              path: `/collections/${collection.slug}`,
            })
            const Icon = (props: any) => <CollectionIcon item={collection} slug={collection.slug} {...props} />
            const isActive =
              pathname.startsWith(href) &&
              ["/", undefined].includes(pathname[href.length])

            return (
              <NavItem
                key={collection.slug}
                href={href}
                icon={Icon}
                label={getTranslation(collection.labels?.plural || collection.slug, i18n)}
                isActive={isActive}
                isCollapsed={isCollapsed}
              />
            )
          })}

        {/* Forms Group */}
        <NavGroup
          label={groups.forms.label}
          icon={groups.forms.icon}
          isCollapsed={isCollapsed}
          isOpen={openGroups.forms}
          onToggle={() => {
            if (isCollapsed) {
              setIsCollapsed(false)
            }
            setOpenGroups(prev => ({ ...prev, forms: !prev.forms }))
          }}
        >
          {visibleCollections
            .filter(col => groups.forms.items.includes(col.slug))
            .map(collection => {
              const href = formatAdminURL({
                adminRoute,
                path: `/collections/${collection.slug}`,
              })
              const Icon = (props: any) => <CollectionIcon item={collection} slug={collection.slug} {...props} />
              const isActive =
                pathname.startsWith(href) &&
                ["/", undefined].includes(pathname[href.length])

              return (
                <NavItem
                  key={collection.slug}
                  href={href}
                  icon={Icon}
                  label={getTranslation(
                    collection.labels?.plural || collection.slug,
                    i18n
                  )}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                />
              )
            })}
        </NavGroup>

        {/* Settings Group */}
        <NavGroup
          label={groups.settings.label}
          icon={groups.settings.icon}
          isCollapsed={isCollapsed}
          isOpen={openGroups.settings}
          onToggle={() => {
            if (isCollapsed) {
              setIsCollapsed(false)
            }
            setOpenGroups(prev => ({ ...prev, settings: !prev.settings }))
          }}
        >
          {groups.settings.items.map(itemSlug => {
            // Regular item handling
            const item = [...visibleCollections, ...visibleGlobals].find(i => i.slug === itemSlug)
            if (!item) return null
            
            const isCollection = "labels" in item
            const href = formatAdminURL({
              adminRoute,
              path: isCollection
                ? `/collections/${item.slug}`
                : `/globals/${item.slug}`,
            })
            const label = isCollection
              ? getTranslation(item.labels?.plural || item.slug, i18n)
              : getTranslation(item.label || item.slug, i18n)
            const Icon = (props: any) => <CollectionIcon item={item} slug={item.slug} {...props} />
            const isActive =
              pathname.startsWith(href) &&
              ["/", undefined].includes(pathname[href.length])

            return (
              <NavItem
                key={item.slug}
                href={href}
                icon={Icon}
                label={label}
                isActive={isActive}
                isCollapsed={isCollapsed}
              />
            )
          })}
        </NavGroup>
      </div>

      {/* Toggle Button at Bottom */}
      <div className="border-admin-200 dark:border-admin-800 border-t p-4">
        <Button
          onClick={toggleSidebar}
          size="icon"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
    </aside>
  )
}
