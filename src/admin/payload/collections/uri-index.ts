import type { CollectionConfig } from "payload"
import { isAdminOrAiAgent } from "@/admin/payload/access/admin"
import { frontendCollections } from "@/admin/config/frontend"
import { CollectionSlug } from "payload"

export const URIIndex: CollectionConfig = {
  slug: "uri-index",
  access: {
    create: isAdminOrAiAgent,
    delete: isAdminOrAiAgent,
    read: isAdminOrAiAgent,
    update: isAdminOrAiAgent,
  },
  admin: {
    hidden: true,
    useAsTitle: "uri",
    defaultColumns: ["uri", "sourceCollection", "status", "updatedAt"],
    hideAPIURL: process.env.NODE_ENV === "production",
  },
  fields: [
    {
      name: "uri",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "The URI path for this document (e.g., /about, /blog/post-title)",
      },
    },
    {
      name: "sourceCollection",
      type: "text",
      required: true,
      index: true,
      admin: {
        description: "The collection slug that contains the source document",
      },
    },
    {
      name: "documentId",
      type: "text",
      required: true,
      index: true,
      admin: {
        description: "The ID of the source document in the collection",
      },
    },
    {
      name: "document",
      type: "relationship",
      relationTo: frontendCollections.map(
        collection => collection.slug
      ) as CollectionSlug[],
      required: true,
      unique: true,
      admin: {
        description: "Reference to the actual document",
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      index: true,
      defaultValue: "published",
      options: [
        {
          label: "Published",
          value: "published",
        },
        {
          label: "Draft",
          value: "draft",
        },
      ],
      admin: {
        description: "Publication status of the source document",
      },
    },
    {
      name: "breadcrumbs",
      type: "array",
      index: true,
      admin: {
        description: "Pre-computed breadcrumb navigation chain for this document",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          admin: {
            description: "Display text for the breadcrumb link",
          },
        },
        {
          name: "uri",
          type: "text",
          required: true,
          admin: {
            description: "URI path for the breadcrumb link",
          },
        },
        {
          name: "isCurrentPage",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description: "Whether this breadcrumb represents the current page",
          },
        },
      ],
    },
    {
      name: "previousURIs",
      type: "array",
      maxRows: 10,
      admin: {
        description: "Previous URI paths for automatic redirect generation",
      },
      fields: [
        {
          name: "uri",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "templateId",
      type: "text",
      index: true,
      admin: {
        description: "Template ID for this document (if assigned via routing settings)",
      },
    },
    {
      name: "isHomepage",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Whether this URI is the homepage. Only one homepage is allowed.",
      },
    },
  ],
  timestamps: true,
}
