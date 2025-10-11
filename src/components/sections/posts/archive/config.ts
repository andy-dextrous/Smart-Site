import type { Block } from "payload"

import { sectionSettings } from "@/components/fields/section"

export const PostsArchive: Block = {
  slug: "posts-archive",
  interfaceName: "PostsArchiveBlock",
  admin: {
    group: "Blog",
  },
  fields: [
    {
      type: "collapsible",
      label: "Display",
      fields: [
        {
          name: "postsPerPage",
          type: "number",
          defaultValue: 9,
          min: 1,
          max: 48,
        },
        {
          name: "layout",
          type: "select",
          defaultValue: "grid",
          options: [
            { label: "Grid", value: "grid" },
            { label: "List", value: "list" },
          ],
        },
        {
          name: "columns",
          type: "select",
          defaultValue: "three",
          admin: {
            condition: data => data?.layout === "grid",
          },
          options: [
            { label: "Two columns", value: "two" },
            { label: "Three columns", value: "three" },
            { label: "Four columns", value: "four" },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "showExcerpt",
              type: "checkbox",
              defaultValue: true,
              label: "Show excerpt",
              admin: {
                width: "33%",
              },
            },
            {
              name: "showCategories",
              type: "checkbox",
              defaultValue: true,
              label: "Show categories",
              admin: {
                width: "33%",
              },
            },
            {
              name: "showPublishedDate",
              type: "checkbox",
              defaultValue: true,
              label: "Show publish date",
              admin: {
                width: "33%",
              },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "showReadingTime",
              type: "checkbox",
              defaultValue: false,
              label: "Show reading time",
              admin: {
                width: "33%",
              },
            },
            {
              name: "showPagination",
              type: "checkbox",
              defaultValue: true,
              label: "Show pagination",
              admin: {
                width: "33%",
              },
            },
            {
              name: "showPageRange",
              type: "checkbox",
              defaultValue: true,
              label: "Show page range",
              admin: {
                width: "33%",
                condition: data => data?.showPagination,
              },
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Filtering & ordering",
      fields: [
        {
          name: "categoryFilter",
          type: "relationship",
          relationTo: "categories",
          hasMany: true,
        },
        {
          name: "offset",
          type: "number",
          admin: {
            description:
              "Skip the first N posts (useful when a hero post leads the page).",
          },
        },
        {
          name: "sort",
          type: "select",
          defaultValue: "-publishedAt",
          options: [
            { label: "Newest first", value: "-publishedAt" },
            { label: "Oldest first", value: "publishedAt" },
            { label: "Title (A–Z)", value: "title" },
            { label: "Title (Z–A)", value: "-title" },
          ],
        },
      ],
    },
    sectionSettings(),
  ],
}
