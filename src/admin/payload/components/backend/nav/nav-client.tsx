"use client"

import { getTranslation } from "@payloadcms/translations"
import { useConfig, useTranslation } from "@payloadcms/ui"
import { baseClass } from "./index"
import { EntityType, formatAdminURL, NavGroupType } from "@payloadcms/ui/shared"
import { usePathname } from "next/navigation"
import LinkWithDefault from "next/link"
import { NavPreferences } from "payload"
import { FC, Fragment } from "react"
import { getNavIcon } from "./navIconMap"
import { NotificationBadge } from "./notification-badge"
import "./styles.scss"

type Props = {
  groups: NavGroupType[]
  navPreferences?: NavPreferences | null
  unreadFormSubmissionsCount: number
}

/*******************************************************/
/*  Items to omit from the nav
/*******************************************************/

const omittedEntities = ["search", "payload-kv", "payload-kvs"]

/*******************************************************/
/*  Nav Client Component
/*******************************************************/

export const NavClient: FC<Props> = ({ groups, unreadFormSubmissionsCount }) => {
  const pathname = usePathname()

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { i18n } = useTranslation()

  return (
    <Fragment>
      {groups.map(({ entities }, key) => {
        return (
          <div key={key} className="nav-group">
            {entities
              .filter(({ slug }) => !omittedEntities.includes(slug))
              .map(({ slug, type, label }, i) => {
                let href: string
                let id: string

                if (type === EntityType.collection) {
                  href = formatAdminURL({
                    adminRoute,
                    path: `/collections/${slug}`,
                  })
                  id = `nav-${slug}`
                } else {
                  href = formatAdminURL({
                    adminRoute,
                    path: `/globals/${slug}`,
                  })
                  id = `nav-global-${slug}`
                }

                const Link = LinkWithDefault

                const LinkElement = Link || "a"
                const activeCollection =
                  pathname.startsWith(href) &&
                  ["/", undefined].includes(pathname[href.length])

                const Icon = getNavIcon(slug)

                const navItemClasses = ["nav-item"]
                if (activeCollection) navItemClasses.push("nav-item--active")

                const iconClasses = ["icon"]
                if (activeCollection) iconClasses.push("icon--active")

                const labelClasses = ["label"]
                if (activeCollection) labelClasses.push("label--active")

                return (
                  <LinkElement
                    className={navItemClasses.join(" ")}
                    href={href}
                    id={id}
                    key={i}
                    prefetch={false}
                  >
                    {activeCollection && <div className="nav-active-indicator" />}
                    {Icon && <Icon className={iconClasses.join(" ")} />}
                    <span className={labelClasses.join(" ")}>
                      {getTranslation(label, i18n)}
                    </span>
                    {slug === "form-submissions" && unreadFormSubmissionsCount > 0 && (
                      <NotificationBadge
                        count={unreadFormSubmissionsCount}
                        className="nav-badge-container"
                      />
                    )}
                  </LinkElement>
                )
              })}
          </div>
        )
      })}
    </Fragment>
  )
}
