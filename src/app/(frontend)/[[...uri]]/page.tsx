import {
  SmartSiteURIRenderer,
  generateStaticParams,
  generateMetadata,
} from "@/admin/components/uri-renderer"

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

export { generateStaticParams, generateMetadata }
