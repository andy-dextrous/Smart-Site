"use client"

import { Button } from "@/payload/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/payload/components/ui/dropdown-menu"
import { User, Settings, LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { getClientSideURL } from "@/utilities/get-url"

/*************************************************************************/
/*  USER DROPDOWN COMPONENT
/*************************************************************************/

export default function UserDropdown() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const cmsURL = getClientSideURL()

  /*************************************************************************/
  /*  FETCH USER DATA
  /*************************************************************************/

  useEffect(() => {
    const fetchUser = async () => {
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
        console.error("Failed to fetch user:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [cmsURL])

  if (isLoading || !user) {
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
        <Button size="icon-lg" className="rounded-full">
          <User />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-admin-850 border-admin-700 text-admin-100 min-w-[200px]"
      >
        <DropdownMenuItem asChild className="text-base py-2.5 px-4">
          <a href={`${cmsURL}/admin/collections/users/${user.id}`}>
            <User className="size-5" />
            Profile
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-base py-2.5 px-4">
          <a href={`${cmsURL}/admin/globals/settings`}>
            <Settings className="size-5" />
            Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="text-base py-2.5 px-4">
          <a href={`${cmsURL}/admin/logout`}>
            <LogOut className="size-5" />
            Logout
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
