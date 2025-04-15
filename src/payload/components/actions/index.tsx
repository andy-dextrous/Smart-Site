import { Button } from "@/payload/components/ui/button"
import { HiOutlineExternalLink } from "react-icons/hi"
import Link from "next/link"

export default async function ViewPage(props: any) {
  // const { payload, docID, collectionSlug, viewType } = props

  // const { docs } = await payload.find({
  //   collection: collectionSlug,
  //   where: {
  //     id: {
  //       equals: docID,
  //     },
  //   },
  // })

  // console.log(docs[0].slug)

  return (
    <Link href="/" target="_blank">
      <Button variant="icon">
        <HiOutlineExternalLink className="text-2xl" />
      </Button>
    </Link>
  )
}
