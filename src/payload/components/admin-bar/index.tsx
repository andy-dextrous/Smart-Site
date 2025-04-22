import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Toaster } from "@/components/ui/sonner"
import { getContentCollections } from "@/lib/queries/collections"
import { getSettings } from "@/lib/queries/globals"
import { getCurrentUser } from "@/lib/queries/user"
import { ChevronDown, PlusIcon, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link.js"
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa"
import ClearCache from "./clear-cache"
import ExitCurrentPage from "./edit-current-page"
import Preview from "./exit-preview"

interface AdminBarProps {
  preview?: boolean
}

const cmsURL = process.env.NEXT_PUBLIC_URL
export const revalidate = 0

/*******************************************************/
/* Wild Child Custom Admin Bar
/*******************************************************/

export async function WildChildAdminBar({ preview }: AdminBarProps) {
  const user = await getCurrentUser()
  if (!user) return null

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[99999] flex h-[32px] w-full items-center justify-between gap-2 bg-[#18181a] px-4 font-sans text-[13px] text-white">
        {/* Left Menu Items */}
        <div className="flex items-center gap-2">
          <DashboardLink />
          <SystemDropdown />
          <NewItemDropdown />
          <ExitCurrentPage />
        </div>

        {/* Right Menu Items */}
        <div className="flex items-center gap-4">
          <ClearCache />
          {preview && <Preview />}
          <UserDropdown />
        </div>
      </div>

      {/* Toaster For Cache */}
      <Toaster
        position="bottom-right"
        style={{ background: "linear-gradient(90deg, #18181a 0%, #1c1c1f 100%)" }}
        icons={{
          success: <FaCheckCircle className="text-[#8190ff]" />,
          error: <FaExclamationCircle className="text-[#ff4500]" />,
        }}
      />
    </>
  )
}

/*******************************************************/
/* Items
/*******************************************************/

async function UserDropdown() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { id: userID, email, firstName, lastName } = user
  const cmsURL = process.env.NEXT_PUBLIC_URL
  const displayName = firstName ? `${firstName}${lastName ? ` ${lastName}` : ""}` : email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-sm border-none bg-transparent px-2 text-white hover:cursor-pointer hover:bg-[#37373c]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gray-500">
            {user.avatar?.url && typeof user.avatar?.url === "string" ? (
              <Image
                src={user.avatar.url}
                alt={displayName || ""}
                width={24}
                height={24}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-white" />
            )}
          </div>
          <span className="capitalize">Howdy, {firstName || email?.split("@")[0]}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mt-1 min-w-[200px] border-[unset] bg-[#18181a]">
        <div className="border-b border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-500">
              {user.avatar?.url && typeof user.avatar.url === "string" ? (
                <Image
                  src={user.avatar?.url}
                  alt={displayName || ""}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-white" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{displayName}</div>
              <Link
                href={`${cmsURL}/admin/collections/users/${userID}`}
                className="text-sm text-[#8190ff]"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
        <DropdownMenuItem
          asChild
          className="!hover:bg-[#37373c] text-white hover:cursor-pointer"
        >
          <Link href={`${cmsURL}/admin/logout`} className="!hover:bg-[#37373c]">
            Log Out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

async function DashboardLink() {
  return (
    <Link
      href={`${cmsURL}/admin`}
      className="flex h-5 flex-shrink-0 items-center rounded-sm border-none bg-transparent px-2 !text-[14px] text-white hover:bg-[#37373c]"
    >
      Dashboard
    </Link>
  )
}

async function SystemDropdown() {
  const settings = await getSettings()

  const siteName = settings?.general?.siteName || "My Site"

  const systemItems = [
    {
      label: "Pages",
      href: `${cmsURL}/admin/collections/pages`,
    },
    {
      label: "Posts",
      href: `${cmsURL}/admin/collections/posts`,
    },
    {
      label: "Header",
      href: `${cmsURL}/admin/globals/header`,
    },
    {
      label: "Footer",
      href: `${cmsURL}/admin/globals/footer`,
    },
    {
      label: "Settings",
      href: `${cmsURL}/admin/globals/settings`,
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 rounded-sm border-none bg-transparent px-2 text-white hover:cursor-pointer hover:bg-[#37373c]">
        <span>{siteName}</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="border-[unset] bg-[#18181a]">
        {systemItems.map(item => (
          <DropdownMenuItem key={item.label} asChild>
            <Link
              href={item.href}
              className="!hover:bg-[#37373c] cursor-pointer !text-[14px] text-white"
            >
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

async function NewItemDropdown() {
  const collectionsData = await getContentCollections()

  const collections = collectionsData.map(collection => ({
    slug: collection.slug,
    labels: {
      singular: collection.slug.charAt(0).toUpperCase() + collection.slug.slice(1),
    },
  }))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 rounded-sm border-none bg-transparent px-2 text-white hover:cursor-pointer hover:bg-[#37373c]">
        <span className="flex items-center gap-1">
          <PlusIcon className="h-4 w-4" /> New
        </span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="border-[unset] bg-[#18181a]">
        {collections.map(collection => (
          <DropdownMenuItem key={collection.slug} asChild>
            <Link
              href={`${cmsURL}/admin/collections/${collection.slug}/create`}
              className="!hover:bg-[#37373c] cursor-pointer !text-[14px] text-white"
            >
              {collection.labels?.singular || collection.slug}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
