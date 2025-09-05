"use client"

import { ChevronDown, PlusIcon, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link.js"
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa"
import { useState, useEffect, useMemo } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu"
import { Toaster } from "../../../../components/ui/sonner"
import { getSmartSiteConfig } from "@/admin/config"
import type { Setting, User as PayloadUser } from "@/admin/payload/payload-types"
import ClearCache from "./clear-cache"
import EditCurrentPage from "./edit-current-page"
import ExitPreview from "./exit-preview"
import "./styles.scss"

interface AdminBarProps {
  settings?: Setting
}

const cmsURL = process.env.NEXT_PUBLIC_URL
export const revalidate = 0

// Get config once at module level for client component
const smartSiteConfig = getSmartSiteConfig()

/*************************************************************************/
/*  smart site ADMIN BAR - CLIENT-SIDE AUTH & PREVIEW DETECTION
/*************************************************************************/

export function SmartSiteAdminBar({ settings }: AdminBarProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [isLivePreview, setIsLivePreview] = useState(false)
  const [user, setUser] = useState<PayloadUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${cmsURL}/api/users/me`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    // Client-side preview mode detection
    const checkPreviewModes = () => {
      const hasPreviewCookie = document.cookie.includes("__prerender_bypass")
      const hasPreviewParam = window.location.search.includes("preview=true")
      const hasLivePreviewParam = window.location.search.includes("livePreview=true")

      setIsPreview(hasPreviewCookie || hasPreviewParam)
      setIsLivePreview(hasLivePreviewParam)
    }

    checkAuth()
    checkPreviewModes()
  }, [])

  /*************************************************************************/
  /*  REFRESH PREVIEW DETECTION AFTER EXIT
  /*************************************************************************/

  const refreshPreviewState = () => {
    const hasPreviewCookie = document.cookie.includes("__prerender_bypass")
    const hasPreviewParam = window.location.search.includes("preview=true")
    const hasLivePreviewParam = window.location.search.includes("livePreview=true")

    setIsPreview(hasPreviewCookie || hasPreviewParam)
    setIsLivePreview(hasLivePreviewParam)
  }

  useEffect(() => {
    if (user && !isLivePreview) {
      document.body.classList.add("relative", "!pt-[32px]")
    } else {
      document.body.classList.remove("relative", "!pt-[32px]")
    }
  }, [user, isLivePreview])

  if (isLoading || !user || isLivePreview) return null

  return (
    <>
      <div className="admin-bar">
        {/* Left Menu Items */}
        <div className="admin-bar__left-menu">
          <DashboardLink />
          <SystemDropdown settings={settings} />
          <NewItemDropdown />
          <EditCurrentPage />
        </div>

        {/* Right Menu Items */}
        <div className="admin-bar__right-menu">
          <ClearCache />
          {isPreview && <ExitPreview onExitPreview={refreshPreviewState} />}
          <UserDropdown user={user} />
        </div>
      </div>

      {/* Toaster For Cache */}
      <Toaster
        position="bottom-right"
        style={{
          background: "linear-gradient(90deg, #18181a 0%, #1c1c1f 100%)",
        }}
        icons={{
          success: <FaCheckCircle className="admin-bar__toaster-success-icon" />,
          error: <FaExclamationCircle className="admin-bar__toaster-error-icon" />,
        }}
        className="admin-bar-toaster"
      />
    </>
  )
}

/*************************************************************************/
/*  INTERNAL COMPONENTS - NOW CLIENT-SIDE (NO ASYNC)
/*************************************************************************/

function UserDropdown({ user }: { user?: PayloadUser | null }) {
  if (!user) {
    return null
  }

  const { id: userID, email, name, lastName } = user
  const cmsURL = process.env.NEXT_PUBLIC_URL
  const displayName = name ? `${name}${lastName ? ` ${lastName}` : ""}` : email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="admin-bar__dropdown-trigger">
        <div className="admin-bar__dropdown-trigger">
          <div className="admin-bar__avatar-container--small">
            {user.avatar && typeof user.avatar === "object" && "url" in user.avatar && user.avatar.url ? (
              <Image
                src={user.avatar.url}
                alt={displayName || ""}
                width={24}
                height={24}
                className="admin-bar__avatar-image"
              />
            ) : (
              <User className="admin-bar__user-icon--small" />
            )}
          </div>
          <span>Howdy, {name || email?.split("@")[0]}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="admin-bar__dropdown-content admin-bar__dropdown-content--user">
        <div className="admin-bar__user-container">
          <div className="admin-bar__user-info">
            <div className="admin-bar__avatar-container">
              {user.avatar && typeof user.avatar === "object" && "url" in user.avatar && user.avatar.url ? (
                <Image
                  src={user.avatar.url}
                  alt={displayName || ""}
                  width={64}
                  height={64}
                  className="admin-bar__avatar-image"
                />
              ) : (
                <User className="admin-bar__user-icon--large" />
              )}
            </div>
            <div>
              <div className="admin-bar__user-text-name">{displayName}</div>
              <Link
                href={`${cmsURL}/admin/collections/users/${userID}`}
                className="admin-bar__user-text-link"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
        <DropdownMenuItem asChild className="admin-bar__menu-item">
          <Link href={`${cmsURL}/admin/logout`} className="admin-bar__menu-item-link">
            Log Out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DashboardLink() {
  return (
    <Link href={`${cmsURL}/admin`} className="admin-bar__dashboard-link">
      Dashboard
    </Link>
  )
}

function SystemDropdown({ settings }: { settings?: Setting }) {
  // Build system items dynamically from config
  const systemItems = useMemo(() => {
    const items = []
    
    // Add enabled collections
    for (const [slug, collection] of Object.entries(smartSiteConfig.collections)) {
      if (collection.enabled) {
        items.push({
          label: collection.label,
          href: `${cmsURL}/admin/collections/${slug}`,
          type: 'collection' as const,
        })
      }
    }
    
    // Add globals (always enabled in smart-site)
    items.push(
      {
        label: "Header",
        href: `${cmsURL}/admin/globals/header`,
        type: 'global' as const,
      },
      {
        label: "Footer",
        href: `${cmsURL}/admin/globals/footer`,
        type: 'global' as const,
      },
      {
        label: "Settings",
        href: `${cmsURL}/admin/globals/settings`,
        type: 'global' as const,
      }
    )
    
    return items
  }, [])

  if (!settings) return null

  const siteName = settings?.general?.siteName || "My Site"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="admin-bar__dropdown-trigger">
        <span className="admin-bar__site-name" title={siteName}>
          {siteName}
        </span>
        <ChevronDown className="admin-bar__chevron-icon" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="admin-bar__dropdown-content">
        {systemItems.map(item => (
          <DropdownMenuItem key={item.label} asChild>
            <Link href={item.href} className="admin-bar__menu-item-link">
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NewItemDropdown() {
  // Get all frontend-enabled collections dynamically
  const collections = useMemo(() => {
    const frontendCollections = []
    
    for (const [slug, collection] of Object.entries(smartSiteConfig.collections)) {
      if (collection.enabled && collection.frontend) {
        frontendCollections.push({
          slug,
          labels: {
            singular: getSingularLabel(collection.label),
          },
        })
      }
    }
    
    return frontendCollections
  }, [])
  
  // If no frontend collections, don't render the dropdown
  if (collections.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="admin-bar__dropdown-trigger admin-bar__dropdown-trigger--new">
        <PlusIcon className="admin-bar__plus-icon" />
        <span>New</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="admin-bar__dropdown-content">
        {collections.map(collection => (
          <DropdownMenuItem key={collection.slug} asChild>
            <Link
              href={`${cmsURL}/admin/collections/${collection.slug}/create`}
              className="admin-bar__menu-item-link"
            >
              {collection.labels.singular}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/*************************************************************************/
/*  UTILITY FUNCTIONS
/*************************************************************************/

function getSingularLabel(pluralLabel: string): string {
  // Handle special cases first
  if (pluralLabel === "Categories") return "Category"
  if (pluralLabel === "Services") return "Service"
  
  // Handle common patterns
  if (pluralLabel.endsWith("ies")) {
    return pluralLabel.slice(0, -3) + "y"
  }
  if (pluralLabel.endsWith("ses") || pluralLabel.endsWith("xes") || pluralLabel.endsWith("zes")) {
    return pluralLabel.slice(0, -2)
  }
  if (pluralLabel.endsWith("s")) {
    return pluralLabel.slice(0, -1)
  }
  return pluralLabel
}
