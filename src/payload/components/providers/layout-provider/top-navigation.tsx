"use client"

import { ExternalLink, MessageSquare, Sparkles } from "lucide-react"
import React from "react"
import { Button } from "@/payload/components/ui/button"
import { useAIContext } from "../ai-provider"
import UserDropdown from "./user-dropdown"
import Link from "next/link"

/*************************************************************************/
/*  TOP NAVIGATION WITH CHAT TOGGLE
/*************************************************************************/

export function TopNavigation() {
  const { toggleChat } = useAIContext()

  return (
    <nav className="bg-admin-950 border-admin-800 h-nav flex items-center justify-between border-b px-6">
      <Link href="/admin" className="text-admin-50 flex items-center gap-2 font-semibold">
        <Sparkles className="text-admin-accent h-6 w-6" />
        <span className="text-lg">Smart Site Admin</span>
      </Link>

      <div className="flex items-center gap-3">
        <Button asChild variant="secondary" size="lg">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium"
          >
            <ExternalLink />
            <span>View Site</span>
          </Link>
        </Button>

        <Button size="icon-round" onClick={toggleChat}>
          <Sparkles />
        </Button>

        <UserDropdown />
      </div>
    </nav>
  )
}
