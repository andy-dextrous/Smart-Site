import type { CollectionConfig } from "payload"

import { authenticated } from "@/admin/payload/access/authenticated"
import { isAdmin, isAdminOrSelf } from "@/admin/payload/access/admin"
import { CollectionCustomMetadata } from "@/admin/payload/types/icon-types"

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    admin: authenticated,
    create: isAdmin,
    delete: isAdmin,
    read: ({ req }) => {
      // Allow server-side access with overrideAccess
      if (!req.user) return false
      
      // For client-side requests, filter out AI agent users
      return {
        role: {
          not_equals: "ai-agent",
        },
      }
    },
    update: isAdminOrSelf,
  },
  admin: {
    defaultColumns: ["username", "name", "lastName", "email", "role"],
    useAsTitle: "email",
    hideAPIURL: process.env.NODE_ENV === "production",
    custom: {
      icon: {
        type: "react-icons",
        name: "fa/FaUserAlt"
      }
    } as CollectionCustomMetadata,
  },
  auth: {
    useAPIKey: true, // Enable API key generation for AI agents
    tokenExpiration: 604800000, // 7 days
    // verify: true, // Require email verification before being allowed to authenticate
    maxLoginAttempts: process.env.NODE_ENV === "production" ? 5 : 100,
    lockTime: 600 * 1000, // 10 minutes
    loginWithUsername: {
      allowEmailLogin: true,
      requireEmail: false,
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
      name: "teamMember",
      type: "relationship",
      relationTo: "team",
      admin: {
        description: "Link this user to their public team profile for shared bios and SEO attribution.",
        position: "sidebar",
      },
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
        {
          label: "AI Agent",
          value: "ai-agent",
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
  ],
  timestamps: true,
}
