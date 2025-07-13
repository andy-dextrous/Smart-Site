import { Button } from "@/payload/components/ui/button"
import { HiOutlineExternalLink } from "react-icons/hi"
import Link from "next/link"

export default async function Actions() {
  return (
    <Link href="/">
      <Button variant="icon" size="lg">
        <HiOutlineExternalLink />
      </Button>
    </Link>
  )
}
