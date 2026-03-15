import { generateMetadata } from "@/admin/components/uri-renderer/metadata"
import {
  SmartSitePublishedURIRenderer,
  generateStaticParams,
} from "@/admin/components/published-uri-renderer"

type Args = {
  params: Promise<{
    uri?: string[]
  }>
}

export default function Page(props: Args) {
  return <SmartSitePublishedURIRenderer {...props} />
}

export { generateStaticParams, generateMetadata }
