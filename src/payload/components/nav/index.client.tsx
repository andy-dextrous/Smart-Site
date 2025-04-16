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
import "./styles.scss"

type Props = {
  groups: NavGroupType[]
  navPreferences: NavPreferences | null
}

/*******************************************************/
/*  Items to omit from the nav
/*******************************************************/

const omittedEntities = ["search"]

/*******************************************************/
/*  Items to omit from the nav
/*******************************************************/

export const NavClient: FC<Props> = ({ groups, navPreferences }) => {
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
          <div key={key} className="flex w-full flex-col gap-2">
            {entities
              .filter(({ slug }) => !omittedEntities.includes(slug))
              .map(({ slug, type, label }, i) => {
                let href: string
                let id: string

                if (type === EntityType.collection) {
                  href = formatAdminURL({ adminRoute, path: `/collections/${slug}` })
                  id = `nav-${slug}`
                } else {
                  href = formatAdminURL({ adminRoute, path: `/globals/${slug}` })
                  id = `nav-global-${slug}`
                }

                const Link = LinkWithDefault

                const LinkElement = Link || "a"
                const activeCollection =
                  pathname.startsWith(href) &&
                  ["/", undefined].includes(pathname[href.length])

                const Icon = getNavIcon(slug)

                return (
                  <LinkElement
                    className={[
                      `${baseClass}__link px-6 py-2 hover:bg-(--color-base-850) hover:no-underline`,
                      activeCollection && `active`,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    href={href}
                    id={id}
                    key={i}
                    prefetch={false}
                  >
                    {activeCollection && (
                      <div
                        className={`${baseClass}__link-indicator bg-(--wild-child-indigo-light)`}
                      />
                    )}
                    {Icon && (
                      <Icon
                        className={[
                          `${baseClass}__icon mr-4`,
                          activeCollection && "text-(--wild-child-indigo-light)",
                        ].join(" ")}
                      />
                    )}
                    <span
                      className={[
                        `${baseClass}__link-label text-[14px]`,
                        activeCollection && "text-(--wild-child-indigo-light)",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {getTranslation(label, i18n)}
                    </span>
                  </LinkElement>
                )
              })}
          </div>
        )
      })}
    </Fragment>
  )
}
