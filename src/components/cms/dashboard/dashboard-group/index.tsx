import { EntityType, formatAdminURL } from "@payloadcms/ui/shared"
import { FC } from "react"
import { getTranslation, I18nClient } from "@payloadcms/translations"
import Link from "next/link"
import { StaticLabel } from "payload"
import { CollectionIcon } from "@/components/cms/collection-icon"
import { IconConfig } from "@/types/icon-types"

import "@/components/cms/dashboard/dashboard-group/index.scss"

type Props = {
  adminRoute: string
  label: string
  i18n: I18nClient
  entities: {
    label: StaticLabel
    slug: string
    type: EntityType
    iconConfig?: IconConfig | null
  }[]
}

export const DashboardGroup: FC<Props> = ({
  label: groupLabel,
  adminRoute,
  i18n,
  entities,
}) => {
  return (
    <div className="dashboard__group">
      <p className="dashboard__label">{groupLabel}</p>
      <ul className="dashboard__card-list">
        {entities.map(({ slug, type, label, iconConfig }, entityIndex) => (
          <li key={entityIndex}>
            <Link
              href={formatAdminURL({
                adminRoute,
                path:
                  type === EntityType.collection
                    ? `/collections/${slug}`
                    : `/globals/${slug}`,
              })}
              className="dashboard__card-link"
            >
              <div className="dashboard__card">
                <div className="dashboard__card-icon">
                  <CollectionIcon
                    slug={slug}
                    iconConfig={iconConfig}
                    className="dashboard__icon"
                  />
                </div>
                <span className="dashboard__card-title">
                  {getTranslation(label, i18n)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
