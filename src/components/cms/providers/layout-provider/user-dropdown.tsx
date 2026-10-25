"use client"

import { Button } from "@/components/cms/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/cms/ui/dropdown-menu"
import { User, Settings, LogOut } from "lucide-react"
import { getClientSideURL } from "@/lib/get-url"
import { useAuth } from "@payloadcms/ui"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/cms/ui/avatar"

/*************************************************************************/
/*  USER DROPDOWN COMPONENT
/*************************************************************************/

export default function UserDropdown() {
  const cmsURL = getClientSideURL()
  const { user } = useAuth()

  if (!user) {
    return (
      <Button
        size="icon-round"
        className="text-admin-800 dark:text-admin-100 flex items-center gap-2"
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
        className="bg-admin-100 border-admin-300 text-admin-900 dark:bg-admin-850 dark:border-admin-700 dark:text-admin-100 min-w-[200px]"
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
        <DropdownMenuItem asChild className="cursor-pointer px-4 py-2.5 text-base">
          <a href={`${cmsURL}/admin/logout`}>
            <LogOut className="size-5" />
            Logout
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
