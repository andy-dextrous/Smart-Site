import type { CollectionConfig } from "payload"

import { authenticated } from "@/payload/access/authenticated"
import { isAdmin, isAdminOrSelf } from "@/payload/access/admin"

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    admin: authenticated,
    create: isAdmin,
    delete: isAdmin,
    read: authenticated,
    update: isAdminOrSelf,
  },
  admin: {
    defaultColumns: ["username", "name", "lastName", "email", "role"],
    useAsTitle: "email",
    hideAPIURL: process.env.NODE_ENV === "production",
  },
  auth: {
    tokenExpiration: 604800000, // 7 days
    // verify: true, // Require email verification before being allowed to authenticate
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes
    loginWithUsername: {
      allowEmailLogin: true,
      requireEmail: true,
    },
  },
  fields: [
    {
      type: "row",
      fields: [
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
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      options: [
        {
          label: "Admin",
          value: "admin",
        },
        {
          label: "Editor",
          value: "editor",
        },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      filterOptions: {
        mimeType: { contains: "image" },
      },
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
