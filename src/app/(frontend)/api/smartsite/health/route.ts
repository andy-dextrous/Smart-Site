import { getPayload } from 'payload'
import config from '@payload-config'
export const dynamic = 'force-dynamic'
export async function GET() {
  const payload = await getPayload({ config })
  const found = await payload.find({ collection: 'smartsite-identity' as any, where: { siteId: { equals: process.env.SMARTSITE_SITE_ID } }, limit: 1, depth: 0 })
  const identity = found.docs[0] as any
  return Response.json({ siteId: identity?.siteId, environment: identity?.environment, database: Boolean(identity) }, { status: identity ? 200 : 503 })
}
