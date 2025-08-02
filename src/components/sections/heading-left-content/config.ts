import type { Block } from "payload"
import { sectionIntro } from "@/components/fields/section-intro/section-intro"
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"

export const HeadingLeftContent: Block = {
  slug: "heading-left-content",
  imageURL: "/api/media/file/heading-left-content-600x333.png",
  admin: {
    group: "Content Sections",
  },
  interfaceName: "HeadingLeftContentBlock",
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      admin: {
        description:
          "Main heading for the section. Use <span> tags for gradient text: 'Our Vision for a <span>Better Digital Future</span>'",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "backgroundColorScheme",
          type: "select",
          enumName: "headingLeftContentBackgroundColorScheme",
          options: [
            { label: "Dark", value: "dark" },
            { label: "Light", value: "light" },
            { label: "Neutral", value: "neutral" },
          ],
          defaultValue: "dark",
          required: true,
          admin: {
            description: "Choose background color scheme for the section",
            width: "50%",
          },
        },
        {
          name: "ratio",
          type: "select",
          label: "Column Ratio",
          enumName: "headingLeftContentColumnRatio",
          options: [
            { label: "1:2 (Heading narrow, Content wide)", value: "1/2" },
            { label: "1:1 (Equal columns)", value: "1/1" },
            { label: "2:1 (Heading wide, Content narrow)", value: "2/1" },
          ],
          defaultValue: "1/1",
          required: true,
          admin: {
            description: "Control the width ratio between heading and content columns",
            width: "50%",
          },
        },
      ],
    },
    {
      name: "content",
      type: "richText",
      label: "Rich Text Content",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            HorizontalRuleFeature(),
          ]
        },
      }),
      admin: {
        description: "Rich text content to display in the right column",
      },
    },
  ],
}
