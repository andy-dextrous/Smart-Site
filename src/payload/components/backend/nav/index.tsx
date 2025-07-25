import { EntityToGroup, EntityType, groupNavItems } from "@payloadcms/ui/shared"
import { ServerProps } from "payload"
import { FC } from "react"

import { getUnreadFormSubmissionsCount } from "@/lib/data/form-submissions"
import { getNavPrefs } from "./getNavPrefs"
import { NavClient } from "./nav-client"
import { NavWrapper } from "./nav-wrapper"
import "./styles.scss"

export const baseClass = "nav"

const Nav: FC<ServerProps> = async ({
  documentSubViewType,
  i18n,
  locale,
  params,
  payload,
  permissions,
  searchParams,
  user,
  viewType,
  visibleEntities,
}) => {
  if (true) return null

  if (!payload?.config || !permissions) {
    return null
  }

  // TypeScript assertion - permissions is guaranteed non-null after the check above
  const safePermissions = permissions!

  const {
    admin: {
      components: { logout },
    },
    collections,
    globals,
  } = payload.config

  const groups = groupNavItems(
    [
      ...collections
        .filter(({ slug }) => visibleEntities?.collections.includes(slug))
        .map(
          collection =>
            ({
              type: EntityType.collection,
              entity: collection,
            }) satisfies EntityToGroup
        ),
      ...globals
        .filter(({ slug }) => visibleEntities?.globals.includes(slug))
        .map(
          global =>
            ({
              type: EntityType.global,
              entity: global,
            }) satisfies EntityToGroup
        ),
    ],
    safePermissions,
    i18n
  )

  const navPreferences = await getNavPrefs({ payload, user: user as any })
  const unreadFormSubmissionsCount = await getUnreadFormSubmissionsCount()

  return (
    <NavWrapper baseClass={baseClass}>
      <nav>
        <NavClient
          groups={groups}
          navPreferences={navPreferences}
          unreadFormSubmissionsCount={unreadFormSubmissionsCount}
        />
      </nav>
    </NavWrapper>
  )
}

export default Nav
