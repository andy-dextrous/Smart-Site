import type { WebsiteCollection } from "@/website/collection-metadata"
import type { Field } from "payload"

/*************************************************************************/
/*  GENERATE READING SETTINGS FIELDS
/*************************************************************************/

export function generateReadingSettingsFields(): Field[] {
  return [
    {
      type: "group",
      label: "Reading Settings",
      fields: [
        {
          name: "homepage",
          type: "relationship",
          relationTo: "pages",
          label: "Homepage",
          admin: {
            description: "Choose which page displays as your site's front page",
          },
        },
        {
          name: "pagesDefaultTemplate",
          type: "relationship",
          relationTo: "templates",
          label: "Default Page Template",
          admin: {
            description: "Default template for new pages (if no template is specified)",
          },
        },
      ],
    },
  ]
}

/*************************************************************************/
/*  GENERATE COLLECTION ROUTING FIELDS
/*************************************************************************/

export function generateCollectionRoutingFields(
  frontendCollections: WebsiteCollection[]
): Field[] {
  const fields: Field[] = frontendCollections
    .filter(collection => collection.slug !== "pages")
    .map(collection => {
      return {
        type: "group",
        label: collection.label,
        fields: [
          {
            name: `${collection.slug}CollectionLabel`,
            type: "text",
            defaultValue: collection.label,
            admin: {
              readOnly: true,
              hidden: true,
            },
            label: "Collection",
          },
          {
            name: `${collection.slug}ArchivePage`,
            type: "relationship",
            relationTo: "pages" as const,
            label: "Archive Page",
          },
          {
            name: `${collection.slug}SingleTemplate`,
            type: "relationship",
            relationTo: "templates" as const,
            label: "Single Template",
          },
        ],
      }
    })

  if (fields.length === 0) {
    console.warn(
      "\x1b[33m⚠️  No frontend collections found for routing fields generation\x1b[0m"
    )
  }

  return [
    {
      type: "row",
      admin: {
        components: {
          Field: "@/admin/components/row-grid",
        },
      },
      fields,
    },
  ]
}

/*************************************************************************/
/*  GENERATE ALL ROUTING FIELDS
/*************************************************************************/

export function generateRoutingFields(inventory: WebsiteCollection[]): Field[] {
  return [
    ...generateReadingSettingsFields(),
    ...generateCollectionRoutingFields(inventory),
  ]
}
