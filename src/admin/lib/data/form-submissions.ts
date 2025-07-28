"use server"

import { cache } from "@/admin/lib/cache"

/*************************************************************************/
/*  GET UNREAD FORM SUBMISSIONS COUNT
/*************************************************************************/

export async function getUnreadFormSubmissionsCount(): Promise<number> {
  try {
    const result = await cache.getCollectionWithPagination("form-submissions", {
      where: {
        isRead: {
          equals: false,
        },
      },
      limit: 0,
      overrideAccess: true,
    })

    return result.totalDocs
  } catch (error) {
    return 0
  }
}
