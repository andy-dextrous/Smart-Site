import { type groupNavItems, EntityType } from "@payloadcms/ui/shared"
import { AdminViewProps, ServerProps } from "payload"
import { FC, Fragment } from "react"
import { DashboardBanner } from "@/components/cms/dashboard/dashboard-banner/index"
import { DashboardGroup } from "@/components/cms/dashboard/dashboard-group/index"
import "@/components/cms/dashboard/styles.scss"

type DashboardProps = AdminViewProps & ServerProps

export const Dashboard: FC<DashboardProps> = props => {
  const {
    i18n,
    payload: {
      config: {
        routes: { admin: adminRoute },
        collections,
        globals,
      },
    },
  } = props

  const omittedEntities = [
    "uri-index",
    "payload-preferences",
    "payload-migrations",
    "payload-jobs",
    "payload-locked-documents",
    "payload-kv",
    "payload-kvs",
    "search",
  ]

  const visibleCollections = collections.filter(
    ({ slug }) => !omittedEntities.includes(slug)
  )
  const visibleGlobals = globals.filter(({ slug }) => !omittedEntities.includes(slug))

  // Define dashboard groups
  const dashboardGroups = {
    main: {
      label: "Quick Access",
      items: ["pages", "posts", "media", "users"],
    },
    business: {
      label: "Your Business",
      items: ["team", "services", "testimonials"],
    },
    settings: {
      label: "Settings",
      items: ["settings", "header", "footer", "templates"],
    },
  }

  // Create organized groups
  const organizedGroups = Object.entries(dashboardGroups)
    .map(([, group]) => {
      const entities = [...visibleCollections, ...visibleGlobals]
        .filter(item => group.items.includes(item.slug))
        .map(item => {
          const isCollection = "labels" in item
          const label = isCollection
            ? typeof item.labels?.plural === "string"
              ? item.labels.plural
              : item.slug
            : typeof item.label === "string"
              ? item.label
              : item.slug

          // Extract only the serializable icon config data
          const customMetadata = (item.admin?.custom || item.custom) as any
          const iconConfig = customMetadata?.icon || null

          return {
            slug: item.slug,
            type: isCollection ? EntityType.collection : EntityType.global,
            label,
            iconConfig, // Only pass the icon config, not the whole item
          }
        })

      return {
        label: group.label,
        entities,
      }
    })
    .filter(group => group.entities.length > 0) // Only show groups with entities

  return (
    <Fragment>
      <DashboardBanner />
      <div className="dashboard">
        <div className="dashboard__wrap">
          {organizedGroups.map(({ label, entities }, entityIndex) => (
            <DashboardGroup
              key={entityIndex}
              label={label}
              entities={entities}
              adminRoute={adminRoute}
              i18n={i18n}
            />
          ))}
        </div>
      </div>
    </Fragment>
  )
}
