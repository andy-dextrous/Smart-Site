import Link from "next/link"
import { getPayload } from "payload"
import config from "@payload-config"
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

export default async function Page(props: Args) {
  const { uri = [] } = await props.params
  if (!uri.length && process.env.SMARTSITE_ENVIRONMENT === "local") {
    const payload = await getPayload({ config })
    const pages = await payload.count({ collection: "pages" })
    if (!pages.totalDocs) return <main className="container py-24"><p className="text-sm uppercase tracking-widest">SmartSite</p><h1 className="mt-4 text-5xl">Your site is ready to build.</h1><p className="mt-6 max-w-xl text-lg">Tell your coding agent what you want to create. Your pages and content will be editable here.</p><Link className="mt-8 inline-block underline" href="/admin">Open the CMS</Link></main>
  }
  return <SmartSitePublishedURIRenderer {...props} />
}

export { generateStaticParams, generateMetadata }
