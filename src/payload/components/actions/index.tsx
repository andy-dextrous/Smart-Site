import { Button } from "@/payload/components/ui/button"
import { HiOutlineExternalLink } from "react-icons/hi"
import Link from "next/link"

export default async function ViewPage() {
  return (
    <Link href="/">
      <Button variant="icon">
        <HiOutlineExternalLink className="text-2xl" />
      </Button>
    </Link>
  )
}
