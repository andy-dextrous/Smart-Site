"use client"

import { Button } from "@/admin/payload/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/admin/payload/components/ui/dropdown-menu"
import { User, Settings, LogOut } from "lucide-react"
import { getClientSideURL } from "@/admin/utilities/get-url"
import { useAuth } from "@payloadcms/ui"
import { Avatar, AvatarFallback, AvatarImage } from "@/admin/payload/components/ui/avatar"

/*************************************************************************/
/*  USER DROPDOWN COMPONENT
/*************************************************************************/

export default function UserDropdown() {
  const cmsURL = getClientSideURL()
  const { user, logOut } = useAuth()

  /*************************************************************************/
  /*  LOGOUT HANDLER
  /*************************************************************************/

  async function handleLogout() {
    try {
      await logOut()
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

  if (!user) {
    return (
      <Button
        size="icon-round"
        className="text-admin-100 flex items-center gap-2"
        disabled
      >
        <User />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-lg" className="overflow-hidden rounded-full p-0">
          <Avatar>
            {user.avatar?.url ? (
              <AvatarImage src={user.avatar.url} />
            ) : (
              <AvatarFallback>
                {user.name?.charAt(0) || user.email?.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-admin-850 border-admin-700 text-admin-100 min-w-[200px]"
      >
        <DropdownMenuItem asChild className="px-4 py-2.5 text-base">
          <a href={`${cmsURL}/admin/collections/users/${user.id}`}>
            <User className="size-5" />
            Profile
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="px-4 py-2.5 text-base">
          <a href={`${cmsURL}/admin/globals/settings`}>
            <Settings className="size-5" />
            Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer px-4 py-2.5 text-base"
          onClick={handleLogout}
        >
          <LogOut className="size-5" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
