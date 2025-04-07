import { EntityToGroup, EntityType, groupNavItems } from "@payloadcms/ui/shared"
import { ServerProps } from "payload"
import { FC } from "react"

import { Logout } from "@payloadcms/ui"
import { RenderServerComponent } from "@payloadcms/ui/elements/RenderServerComponent"
import { getNavPrefs } from "./getNavPrefs"
import { NavClient } from "./index.client"
import { NavHamburger } from "./NavHamburger"
import { NavWrapper } from "./NavWrapper"

export const baseClass = "nav"

export const Nav: FC<ServerProps> = async props => {
  const {
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
  } = props

  if (!payload?.config || !permissions) {
    return null
  }

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
    permissions,
    i18n
  )

  const navPreferences = await getNavPrefs({ payload, user })

  const LogoutComponent = RenderServerComponent({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: logout?.Button,
    Fallback: Logout,
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        <NavClient groups={groups} navPreferences={navPreferences} />
        <div className={`${baseClass}__controls`}>{LogoutComponent}</div>
      </nav>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <NavHamburger baseClass={baseClass} />
        </div>
      </div>
    </NavWrapper>
  )
}

export default Nav
