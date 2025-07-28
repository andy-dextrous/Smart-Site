import { getPayload } from "payload"
import configPromise from "@payload-config"

/*************************************************************************/
/*  DRAFT MODE DATA FETCHING - BYPASSES CACHE FOR REAL-TIME CONTENT
    USED IN LIVE PREVIEW MODE
/*************************************************************************/

export async function getDraftModeData(uri: string) {
  const payload = await getPayload({ config: configPromise })

  const indexResult = await payload.find({
    collection: "uri-index",
    where: { uri: { equals: uri } },
    limit: 1,
    overrideAccess: true,
  })

  const indexDoc = indexResult.docs[0]
  if (!indexDoc) {
    return null
  }

  const document = await payload.findByID({
    collection: (indexDoc as any).sourceCollection,
    id: (indexDoc as any).documentId,
    draft: true, // gets latest version of document
    depth: 5,
    overrideAccess: true,
  })

  if (!document) {
    return null
  }

  if (
    (!document.sections || document.sections.length === 0) &&
    (indexDoc as any).templateId
  ) {
    const template = await payload
      .findByID({
        collection: "templates",
        id: (indexDoc as any).templateId,
        draft: false,
        depth: 2,
        overrideAccess: true,
      })
      .catch(() => null)

    if (template?.sections) {
      document.sections = template.sections
    }
  }

  return {
    document,
    uriIndex: indexDoc,
  }
}
