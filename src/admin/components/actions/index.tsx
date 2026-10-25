"use client"

import { Button } from "@/components/cms-ui/button"
import { HiOutlineExternalLink } from "react-icons/hi"
import Link from "next/link"

export default function Actions() {
  return (
    <Link href="/">
      <Button variant="ghost" size="icon">
        <HiOutlineExternalLink />
      </Button>
    </Link>
  )
}
