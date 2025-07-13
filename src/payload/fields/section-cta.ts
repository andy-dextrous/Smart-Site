import type { Field } from "payload"
import { button } from "./buttons"
import { sectionCtaDefault } from "./default-values"

/*************************************************************************/
/*  SECTION CTA FIELD CONFIGURATION
/*************************************************************************/

export const sectionCta = (
  options: {
    textRequired?: boolean
    buttonRequired?: boolean
    textDescription?: string
    buttonDescription?: string
    collapsibleLabel?: string
    initCollapsed?: boolean
  } = {}
): Field => {
  const {
    textRequired = true,
    buttonRequired = true,
    textDescription = "Call-to-action text that appears on the left side",
    buttonDescription = "Button configuration including style, size, and link destination",
    collapsibleLabel = "Section CTA",
    initCollapsed = false,
  } = options

  return {
    type: "collapsible",
    label: collapsibleLabel,
    admin: {
      initCollapsed,
    },
    fields: [
      {
        name: "text",
        type: "text",
        required: textRequired,
        defaultValue: sectionCtaDefault.text,
        admin: {
          description: textDescription,
        },
      },
      button({
        name: "button",
        label: "CTA Button",
        required: buttonRequired,
        defaultValue: sectionCtaDefault.button,
        admin: {
          description: buttonDescription,
        },
      }),
    ],
  }
}
