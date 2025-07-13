import type { Block } from "payload"
import { sectionIntro } from "@/payload/fields/section-intro"

export const PostsArchive: Block = {
  slug: "posts-archive",
  admin: {
    group: "Blog Sections",
  },
  interfaceName: "PostsArchiveBlock",
  fields: [
    sectionIntro({
      collapsibleLabel: "Section Content",
      headingDescription:
        "Main heading for the blog archive. Use <span> tags for gradient text: 'Latest <span>Articles</span>'",
      descriptionDescription: "Brief description that appears below the heading",
    }),
    {
      type: "collapsible",
      label: "Display Options",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "postsPerPage",
          type: "number",
          defaultValue: 12,
          min: 1,
          max: 50,
          admin: {
            description: "Number of posts to display per page",
          },
        },
        {
          name: "layout",
          type: "select",
          defaultValue: "grid",
          options: [
            {
              label: "Grid Layout",
              value: "grid",
            },
            {
              label: "List Layout",
              value: "list",
            },
          ],
          admin: {
            description: "Choose how posts are displayed",
          },
        },
        {
          name: "columns",
          type: "select",
          defaultValue: "three",
          options: [
            {
              label: "Two Columns",
              value: "two",
            },
            {
              label: "Three Columns",
              value: "three",
            },
            {
              label: "Four Columns",
              value: "four",
            },
          ],
          admin: {
            condition: data => data.layout === "grid",
            description: "Number of columns for grid layout",
          },
        },
        {
          name: "showPagination",
          type: "checkbox",
          defaultValue: true,
          admin: {
            description: "Show pagination controls",
          },
        },
        {
          name: "showPageRange",
          type: "checkbox",
          defaultValue: true,
          admin: {
            description: "Show page range information (e.g., 'Showing 1-12 of 24 posts')",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Filtering",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "categoryFilter",
          type: "relationship",
          relationTo: "categories",
          hasMany: true,
          admin: {
            description: "Filter posts by specific categories (leave empty to show all)",
          },
        },
      ],
    },
  ],
}
