import type { Block } from "payload"

import { formVariant } from "@/components/fields/form/form"
import { defaultLexical } from "@/components/fields/rich-text/default-lexical"
import { sectionSettings } from "@/components/fields/section"

export const ContactForm: Block = {
  slug: "contact-form",
  interfaceName: "ContactFormBlock",
  admin: {
    group: "Forms",
  },
  fields: [
    {
      name: "supportingContent",
      type: "richText",
      editor: defaultLexical,
      admin: {
        description: "Optional copy displayed alongside the form.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "layout",
          type: "select",
          defaultValue: "split",
          options: [
            { label: "Form beside content", value: "split" },
            { label: "Form stacked", value: "stacked" },
          ],
        },
      ],
    },
    formVariant({
      admin: {
        description: "Select the Payload form and variant to render.",
      },
    }),
    sectionSettings(),
  ],
}
