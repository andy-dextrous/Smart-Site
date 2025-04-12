import type { CollectionConfig } from "payload"

import { authenticated } from "@/payload/access/authenticated"

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ["name", "email"],
    useAsTitle: "name",
  },
  auth: true,
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "nickname",
          type: "text",
          label: "Nickname",
        },
        {
          name: "name",
          label: "First Name",
          type: "text",
        },
        {
          name: "lastName",
          label: "Last Name",
          type: "text",
        },
      ],
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "bio",
      type: "textarea",
      label: "Bio",
      maxLength: 500,
    },
    {
      type: "array",
      name: "socialLinks",
      label: "Social Links",
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
  ],
  timestamps: true,
}
