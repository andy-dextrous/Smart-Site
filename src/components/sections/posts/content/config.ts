import type { Block } from "payload"

import { sectionSettings } from "@/components/fields/section"

export const PostsContent: Block = {
  slug: "posts-content",
  interfaceName: "PostsContentBlock",
  admin: {
    group: "Blog",
  },
  fields: [
    {
      type: "collapsible",
      label: "Display",
      fields: [
        {
          name: "showBreadcrumbs",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "showReadingProgress",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "showTableOfContents",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "showAuthorCard",
          type: "checkbox",
          defaultValue: true,
        },
      ],
    },
    {
      type: "collapsible",
      label: "Table of contents",
      admin: {
        condition: data => Boolean(data?.showTableOfContents),
      },
      fields: [
        {
          name: "tocHeading",
          type: "text",
          defaultValue: "On this page",
        },
        {
          name: "tocMode",
          type: "select",
          defaultValue: "auto",
          options: [
            { label: "Generate from headings", value: "auto" },
            { label: "Manual list", value: "manual" },
          ],
        },
        {
          name: "tocItems",
          type: "array",
          admin: {
            condition: (_, siblingData) => siblingData?.tocMode === "manual",
          },
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
            },
            {
              name: "anchorId",
              type: "text",
              required: true,
              admin: {
                description: "Matches the id attribute on the relevant heading.",
              },
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Layout",
      fields: [
        {
          name: "proseSize",
          type: "select",
          defaultValue: "lg",
          options: [
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
            { label: "Extra large", value: "xl" },
          ],
        },
      ],
    },
    sectionSettings(),
  ],
}
