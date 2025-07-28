import type { TextFieldSingleValidation } from "payload"
import {
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  InlineCodeFeature,
  SuperscriptFeature,
  SubscriptFeature,
  LinkFeature,
  ParagraphFeature,
  HeadingFeature,
  AlignFeature,
  IndentFeature,
  UnorderedListFeature,
  OrderedListFeature,
  ChecklistFeature,
  BlockquoteFeature,
  UploadFeature,
  HorizontalRuleFeature,
  RelationshipFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
  type LinkFields,
} from "@payloadcms/richtext-lexical"

export const defaultLexical = lexicalEditor({
  features: [
    // Structure
    ParagraphFeature(),
    HeadingFeature({
      enabledHeadingSizes: ["h1", "h2", "h3", "h4", "h5", "h6"],
    }),

    // Text Formatting
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    InlineCodeFeature(),
    SuperscriptFeature(),
    SubscriptFeature(),

    // Lists
    UnorderedListFeature(),
    OrderedListFeature(),
    ChecklistFeature(),

    // Blocks
    BlockquoteFeature(),
    HorizontalRuleFeature(),

    // Layout
    AlignFeature(),
    IndentFeature(),

    // Media & Links
    LinkFeature({
      enabledCollections: ["pages", "posts"],
      fields: ({ defaultFields }) => {
        const defaultFieldsWithoutUrl = defaultFields.filter(field => {
          if ("name" in field && field.name === "url") return false
          return true
        })

        return [
          ...defaultFieldsWithoutUrl,
          {
            name: "url",
            type: "text",
            admin: {
              condition: (_data, siblingData) => siblingData?.linkType !== "internal",
            },
            label: ({ t }) => t("fields:enterURL"),
            required: true,
            validate: ((value, options) => {
              if ((options?.siblingData as LinkFields)?.linkType === "internal") {
                return true // no validation needed, as no url should exist for internal links
              }
              return value ? true : "URL is required"
            }) as TextFieldSingleValidation,
          },
        ]
      },
    }),
    UploadFeature({
      collections: {
        media: {
          fields: [],
        },
      },
    }),
    RelationshipFeature({
      enabledCollections: ["pages", "posts"],
    }),

    // Toolbar
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
