import type { CollectionAfterReadHook } from "payload"

/*******************************************************/
/* Mark Form Submissions as Read After Access
/*******************************************************/

export const markAsReadAfterRead: CollectionAfterReadHook = async ({
  doc,
  req: { payload },
}) => {
  if (!doc.isRead) {
    try {
      await payload.update({
        collection: "form-submissions",
        id: doc.id,
        data: {
          isRead: true,
        },
        overrideAccess: true,
      })
    } catch (error) {
      payload.logger.warn(
        `Could not mark form submission ${doc.id} as read:`,
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  return doc
}
