import {
  normalizeContentBeforeValidate,
  normalizeContentAfterRead,
} from "@/payload/hooks/legacy-content"
import { slugField } from "@/payload/fields/slug"
import { seoFields } from "@/payload/fields/seo"
import { websitePreview } from "@/lib/preview"
import { beforeUniversalChange } from "@/payload/hooks/collections/universal/before-change"
import { afterUniversalChange } from "@/payload/hooks/collections/universal/after-change"
import { afterUniversalDelete } from "@/payload/hooks/collections/universal/after-delete"
import { lockSlugAfterPublish } from "@/payload/hooks/utilities/lock-slug"
import { CollectionConfig } from "payload"
import { anyone } from "@/payload/access/anyone"
import { canEditContent } from "@/payload/access/editor"
import { CollectionCustomMetadata } from "@/types/icon-types"

const teamConfig: CollectionConfig = {
  slug: "team",
  custom: {
    smartsite: {
      route: true,
      label: "Team",
      seo: true,
      search: true,
      mcp: true,
      sitemap: {
        enabled: true,
        priority: 0.5,
        changefreq: "monthly",
        respectNoIndex: true,
      },
    },
  },
  enableQueryPresets: true,
  trash: true,
  access: {
    create: canEditContent,
    delete: canEditContent,
    read: anyone,
    update: canEditContent,
  },
  labels: {
    singular: "Team Member",
    plural: "Team Members",
  },
  admin: {
    ...websitePreview("team"),
    useAsTitle: "name",
    description:
      "Team members are used to display the team on the website. They are different to users, which are used for the admin panel.",
    custom: {
      icon: {
        type: "react-icons",
        name: "ri/RiTeamFill",
      },
    } as CollectionCustomMetadata,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "email",
          type: "email",
          required: true,
        },
      ],
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Content",
          fields: [
            {
              name: "image",
              label: "Profile Image",
              admin: {
                description:
                  "The image will be used as the profile image for the team member.",
              },
              type: "upload",
              relationTo: "media",
              required: true,
            },
            {
              name: "role",
              type: "text",
              required: true,
            },
            {
              name: "bio",
              type: "textarea",
              required: true,
            },
            {
              type: "array",
              name: "socialLinks",
              label: "Social Profiles",
              admin: {
                description: "Optional profile links displayed with this team member.",
              },
              fields: [
                {
                  name: "platform",
                  type: "select",
                  options: [
                    "twitter",
                    "facebook",
                    "instagram",
                    "linkedin",
                    "youtube",
                    "twitch",
                    "tiktok",
                    "github",
                    "website",
                  ],
                },
                {
                  name: "url",
                  type: "text",
                },
              ],
            },
            {
              type: "array",
              name: "education",
              label: "Education",
              admin: {
                description:
                  "Optional qualifications and certifications for this team member.",
              },
              fields: [
                {
                  name: "degree",
                  type: "text",
                  label: "Degree/Qualification",
                },
                {
                  name: "institution",
                  type: "text",
                  label: "Institution",
                },
                {
                  name: "year",
                  type: "number",
                  label: "Year Completed",
                },
              ],
            },
          ],
        },
        { name: "seo", label: "SEO", fields: seoFields({ seoSchemaType: "Person" }) },
      ],
    },
    ...slugField("name"),
  ],
  hooks: {
    beforeValidate: [normalizeContentBeforeValidate],
    afterRead: [normalizeContentAfterRead],
    beforeOperation: [lockSlugAfterPublish],
    afterDelete: [afterUniversalDelete],
    afterChange: [afterUniversalChange],
    beforeChange: [beforeUniversalChange],
  },
}

export const Team: CollectionConfig = teamConfig
