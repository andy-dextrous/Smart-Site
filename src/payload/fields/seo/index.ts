import type { Field } from "payload"

/*************************************************************************/
/*  SEO FIELDS FACTORY FUNCTION
/*************************************************************************/

export function seoFields(options: { seoSchemaType?: string } = {}): Field[] {
  const { seoSchemaType } = options
  return [
    {
      name: "meta",
      label: "SEO Metadata",
      type: "group",
      fields: [
        {
          name: "title",
          label: "Meta Title",
          type: "text",
          admin: {
            description: "Custom title for search engines (50-60 characters recommended)",
          },
        },
        {
          name: "image",
          label: "Meta Image",
          type: "upload",
          relationTo: "media",
          admin: {
            description:
              "Image for search results and social media sharing (1200x630px recommended)",
          },
        },
        {
          name: "description",
          label: "Meta Description",
          type: "textarea",
          admin: {
            description:
              "Custom description for search engines (150-160 characters recommended)",
          },
        },
        {
          name: "noIndex",
          label: "No Index",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description: "Prevent this content from appearing in search engines",
          },
        },
        {
          name: "canonicalUrl",
          label: "Canonical URL",
          type: "text",
          admin: {
            description: "Override the default canonical URL for this content",
          },
        },
        {
          name: "focusKeywords",
          label: "Focus Keywords",
          type: "text",
          admin: {
            description: "Primary keywords for this content (comma-separated)",
          },
        },
        {
          name: "metaRobots",
          label: "Meta Robots",
          type: "select",
          hasMany: true,
          defaultValue: [],
          options: [
            { label: "No Follow", value: "nofollow" },
            { label: "No Archive", value: "noarchive" },
            { label: "No Snippet", value: "nosnippet" },
            { label: "No Image Index", value: "noimageindex" },
            { label: "No Cache", value: "nocache" },
            { label: "No Site Links Search Box", value: "nositelinkssearchbox" },
            { label: "No Translate", value: "notranslate" },
            { label: "Max Snippet Length", value: "max-snippet" },
            { label: "Max Image Preview", value: "max-image-preview" },
            { label: "Max Video Preview", value: "max-video-preview" },
          ],
          admin: {
            description: "Advanced robots directives for search engines",
          },
        },
      ],
    },
    {
      name: "socialMedia",
      label: "Social Media",
      type: "group",
      fields: [
        {
          name: "openGraph",
          label: "Open Graph",
          type: "group",
          fields: [
            {
              name: "title",
              label: "OG Title",
              type: "text",
              admin: {
                description: "Override title for Facebook/Open Graph sharing",
              },
            },
            {
              name: "description",
              label: "OG Description",
              type: "textarea",
              admin: {
                description: "Override description for Facebook/Open Graph sharing",
              },
            },
            {
              name: "image",
              label: "OG Image",
              type: "upload",
              relationTo: "media",
              admin: {
                description:
                  "Custom image for Facebook/Open Graph sharing (1200x630px recommended)",
              },
            },
            {
              name: "type",
              label: "OG Type",
              type: "select",
              defaultValue: "website",
              options: [
                { label: "Website", value: "website" },
                { label: "Article", value: "article" },
                { label: "Product", value: "product" },
                { label: "Video", value: "video" },
                { label: "Music", value: "music" },
                { label: "Book", value: "book" },
                { label: "Profile", value: "profile" },
              ],
            },
          ],
        },
        {
          name: "twitter",
          label: "Twitter",
          type: "group",
          fields: [
            {
              name: "title",
              label: "Twitter Title",
              type: "text",
              admin: {
                description: "Override title for Twitter sharing",
              },
            },
            {
              name: "description",
              label: "Twitter Description",
              type: "textarea",
              admin: {
                description: "Override description for Twitter sharing",
              },
            },
            {
              name: "image",
              label: "Twitter Image",
              type: "upload",
              relationTo: "media",
              admin: {
                description: "Custom image for Twitter sharing (1200x675px recommended)",
              },
            },
            {
              name: "cardType",
              label: "Twitter Card Type",
              type: "select",
              defaultValue: "summary_large_image",
              options: [
                { label: "Summary", value: "summary" },
                { label: "Summary Large Image", value: "summary_large_image" },
                { label: "App", value: "app" },
                { label: "Player", value: "player" },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "structuredData",
      label: "Structured Data",
      type: "group",
      fields: [
        {
          name: "enableStructuredData",
          label: "Enable Structured Data",
          type: "checkbox",
          defaultValue: true,
          admin: {
            description: "Generate schema.org structured data for this content",
          },
        },
        {
          name: "schemaType",
          label: "Schema Type",
          type: "select",
          defaultValue: seoSchemaType || "WebPage",
          options: [
            { label: "Web Page", value: "WebPage" },
            { label: "Article", value: "Article" },
            { label: "Service", value: "Service" },
            { label: "Person", value: "Person" },
            { label: "Organization", value: "Organization" },
            { label: "Local Business", value: "LocalBusiness" },
            { label: "Product", value: "Product" },
            { label: "Event", value: "Event" },
            { label: "FAQ Page", value: "FAQPage" },
            { label: "How-to", value: "HowTo" },
          ],
          admin: {
            condition: (_, siblingData) => siblingData?.enableStructuredData === true,
            description: "Choose the appropriate schema.org type for this content",
          },
        },
        {
          name: "customSchemaProperties",
          label: "Custom Schema Properties",
          type: "json",
          admin: {
            condition: (_, siblingData) => siblingData?.enableStructuredData === true,
            description:
              "Additional JSON properties to include in structured data (optional)",
          },
        },
      ],
    },
  ]
}

/*************************************************************************/
/*  MANDATORY TITLE FIELD
/*************************************************************************/

export function titleField(): Field {
  return {
    name: "title",
    label: "Title",
    type: "text",
    required: true,
  }
}
