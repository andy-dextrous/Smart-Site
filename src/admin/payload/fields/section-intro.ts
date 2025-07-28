import type { Field } from "payload"
import { richContent } from "./content"

/*************************************************************************/
/*  SECTION INTRO FIELD CONFIGURATION
/*************************************************************************/

export const sectionIntro = (
  options: {
    headingRequired?: boolean
    descriptionRequired?: boolean
    headingDescription?: string
    descriptionDescription?: string
    collapsibleLabel?: string
    initCollapsed?: boolean
  } = {}
): Field => {
  const {
    headingRequired = true,
    descriptionRequired = true,
    headingDescription = "Use <span> tags to designate text that should have the purple gradient effect. Example: 'Commercial, Operational <span>& Technology Services</span>'",
    descriptionDescription = "Brief description that appears below the heading",
    collapsibleLabel = "Section Introduction",
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
        name: "heading",
        type: "text",
        required: headingRequired,
        admin: {
          description: headingDescription,
        },
      },
      richContent({
        name: "description",
        label: "Description",
        required: descriptionRequired,
        admin: {
          description: descriptionDescription,
        },
      }),
    ],
  }
}
