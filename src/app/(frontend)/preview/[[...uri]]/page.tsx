import { SmartSiteURIRenderer } from "@/lib/rendering/uri-renderer"
import { generateMetadata } from "@/lib/rendering/uri-renderer/metadata"

export const dynamic = "force-dynamic"

type Args = {
  params: Promise<{
    uri?: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

export default function Page(props: Args) {
  return <SmartSiteURIRenderer {...props} />
}

export { generateMetadata }
