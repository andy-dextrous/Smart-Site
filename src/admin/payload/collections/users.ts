import type { AccessArgs, CollectionBeforeChangeHook, CollectionConfig } from "payload"

import { authenticated } from "@/admin/payload/access/authenticated"
import { isAdmin, isAdminOrSelf } from "@/admin/payload/access/admin"
import { userHasMinimumRole } from "@/admin/payload/access/roles"
import { CollectionCustomMetadata } from "@/admin/payload/types/icon-types"
import type { User } from "@/admin/payload/payload-types"

function canReadUsers(args: AccessArgs<User>) {
  const {
    req: { user },
  } = args

  if (!user) {
    return false
  }

  return {
    role: {
      not_in: userHasMinimumRole(user, "admin")
        ? ["ai-agent"]
        : ["ai-agent", "developer"],
    },
  }
}

function enforceDeveloperRoleGuard(args: Parameters<CollectionBeforeChangeHook>[0]) {
  const { data, req, originalDoc } = args
  const actingUser = req?.user as User | undefined

  if (userHasMinimumRole(actingUser, "developer")) {
    return data
  }

  if (!actingUser) {
    return data
  }

  const targetIsSelf =
    typeof originalDoc?.id === "string" && actingUser.id === originalDoc.id

  if (targetIsSelf) {
    return data
  }

  if (data?.role === "developer") {
    throw new Error("Only developers can assign the developer role.")
  }

  if (originalDoc?.role === "developer") {
    throw new Error("Only developers can modify developer accounts.")
  }

  return data
}

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    admin: authenticated,
    create: isAdmin,
    delete: isAdmin,
    read: canReadUsers,
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
    useAPIKey: false, // MCP credentials live in Payload’s scoped key collection
    tokenExpiration: 604800000, // 7 days
    // verify: true, // Require email verification before being allowed to authenticate
    maxLoginAttempts: process.env.NODE_ENV === "production" ? 5 : 100,
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
          required: true,
          validate: (value: unknown) =>
            typeof value === "string" && value.trim() !== ""
              ? true
              : "First name is required",
        },
        {
          name: "lastName",
          label: "Last Name",
          type: "text",
          required: true,
          validate: (value: unknown) =>
            typeof value === "string" && value.trim() !== ""
              ? true
              : "Last name is required",
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
          label: "Developer",
          value: "developer",
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
  ],
  timestamps: true,
  hooks: {
    beforeChange: [enforceDeveloperRoleGuard],
  },
}
