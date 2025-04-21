import { headers as nextHeaders } from "next/headers"
import { getPayload, User } from "payload"
import configPromise from "@payload-config"

export const getCurrentUser = async (args?: {
  nullUserRedirect?: string
  validUserRedirect?: string
}): Promise<User | null> => {
  const headers = await nextHeaders()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.auth({ headers })

  return result?.user
}
