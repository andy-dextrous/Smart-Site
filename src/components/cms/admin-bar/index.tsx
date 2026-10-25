"use client"

import { ChevronDown, PlusIcon, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link.js"
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa"
import { useState, useEffect, useRef, type CSSProperties } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/cms/ui/dropdown-menu"
import { Toaster } from "@/components/cms/ui/sonner"
import type { Setting, User as PayloadUser } from "@/payload-types"
import ClearCache from "@/components/cms/admin-bar/clear-cache"
import EditCurrentPage from "@/components/cms/admin-bar/edit-current-page"
import ExitPreview from "@/components/cms/admin-bar/exit-preview"
import "@/components/cms/admin-bar/theme.css"
import "@/components/cms/admin-bar/styles.scss"

interface AdminBarProps {
  reserveSpace?: boolean
  settings?: Setting
  collections: Array<{ slug: string; label: string; singular: string }>
}

const cmsURL = process.env.NEXT_PUBLIC_URL
export const revalidate = 0

const toasterThemeStyles = {
  "--normal-bg": "#202023",
  "--normal-text": "#ebebed",
  "--normal-border": "#505056",
  background: "linear-gradient(90deg, #18181a 0%, #1c1c1f 100%)",
} as CSSProperties

/*************************************************************************/
/*  smart site ADMIN BAR - CLIENT-SIDE AUTH & PREVIEW DETECTION
/*************************************************************************/

export function SmartSiteAdminBar({
  settings,
  collections,
  reserveSpace = true,
}: AdminBarProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [isLivePreview, setIsLivePreview] = useState(false)
  const [user, setUser] = useState<PayloadUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const barRef = useRef<HTMLDivElement>(null)

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
      const hasLivePreviewParam = window.location.search.includes("livePreview=true")
      const isPreviewPath = window.location.pathname.startsWith("/preview")

      setIsPreview(hasPreviewCookie || isPreviewPath)
      setIsLivePreview(hasLivePreviewParam)
    }

    checkAuth()
    checkPreviewModes()
  }, [])

  useEffect(() => {
    const root = document.documentElement

    const clearOffset = () => {
      root.classList.remove("smartsite-has-admin-bar")
      root.style.removeProperty("--smartsite-admin-bar-height")
    }
    const bar = barRef.current
    if (isLoading || !user || isLivePreview || !bar) {
      clearOffset()
      return clearOffset
    }

    const measure = () => {
      root.style.setProperty(
        "--smartsite-admin-bar-height",
        `${Math.ceil(bar.getBoundingClientRect().height)}px`
      )
    }
    root.classList.add("smartsite-has-admin-bar")
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    return () => {
      observer.disconnect()
      clearOffset()
    }
  }, [isLoading, isLivePreview, user])

  /*************************************************************************/
  /*  REFRESH PREVIEW DETECTION AFTER EXIT
  /*************************************************************************/

  const refreshPreviewState = () => {
    const hasPreviewCookie = document.cookie.includes("__prerender_bypass")
    const hasLivePreviewParam = window.location.search.includes("livePreview=true")
    const isPreviewPath = window.location.pathname.startsWith("/preview")

    setIsPreview(hasPreviewCookie || isPreviewPath)
    setIsLivePreview(hasLivePreviewParam)
  }

  if (isLoading || !user || isLivePreview) return null

  return (
    <div
      className={reserveSpace ? "admin-bar-theme admin-bar-space" : "admin-bar-theme"}
      data-theme="dark"
    >
      <div ref={barRef} className="admin-bar">
        {/* Left Menu Items */}
        <div className="admin-bar__left-menu">
          <DashboardLink />
          <SystemDropdown settings={settings} collections={collections} />
          <NewItemDropdown collections={collections} />
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
        style={toasterThemeStyles}
        icons={{
          success: <FaCheckCircle className="admin-bar__toaster-success-icon" />,
          error: <FaExclamationCircle className="admin-bar__toaster-error-icon" />,
        }}
        className="admin-bar-toaster"
      />
    </div>
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
            {user.avatar &&
            typeof user.avatar === "object" &&
            "url" in user.avatar &&
            user.avatar.url ? (
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
              {user.avatar &&
              typeof user.avatar === "object" &&
              "url" in user.avatar &&
              user.avatar.url ? (
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

function SystemDropdown({ settings, collections }: AdminBarProps) {
  const systemItems = [
    ...collections.map(collection => ({
      label: collection.label,
      href: `${cmsURL}/admin/collections/${collection.slug}`,
    })),
    ...["header", "footer", "settings"].map(slug => ({
      label: slug[0].toUpperCase() + slug.slice(1),
      href: `${cmsURL}/admin/globals/${slug}`,
    })),
  ]

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

function NewItemDropdown({ collections }: Pick<AdminBarProps, "collections">) {
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
              {collection.singular}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
