import type { Block, CollectionConfig, GlobalConfig } from "payload"
import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical"
import { link } from "@/components/fields/link/link"
import { websitePreview } from "@/website/preview"

export const NativeLinkBlock: Block = {
  slug: "native-link-probe",
  fields: [link({ optional: true })],
}
export const NativeProjects: CollectionConfig = {
  slug: "native-projects",
  custom: {
    smartsite: {
      route: true,
      label: "Native projects",
      seo: true,
      search: true,
      mcp: true,
    },
  },
  admin: { useAsTitle: "title", ...websitePreview("native-projects") },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: "title", type: "text", localized: true, required: true },
    { name: "privateNote", type: "text", access: { read: () => false } },
    link({ optional: true }),
    { name: "restricted", type: "relationship", relationTo: "pages" },
    {
      name: "sections",
      type: "blocks",
      blocks: [{ slug: "inline-native", fields: [link({ optional: true })] }],
    },
    {
      name: "references",
      type: "blocks",
      blocks: [],
      blockReferences: [NativeLinkBlock],
    },
    {
      name: "body",
      type: "richText",
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: ["native-link-probe"] }),
        ],
      }),
    },
  ],
}
export const PrivateNative: CollectionConfig = {
  slug: "native-private",
  access: { read: () => false },
  fields: [{ name: "title", type: "text" }],
}
export const NativeGlobal: GlobalConfig = {
  slug: "native-announcement",
  custom: { smartsite: { mcp: true } },
  fields: [link({ optional: true })],
}
