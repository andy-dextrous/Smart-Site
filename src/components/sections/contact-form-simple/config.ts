import type { Block } from "payload"

/*************************************************************************/
/*  CONTACT FORM SIMPLE - MINIMAL
/*************************************************************************/

export const ContactFormSimple: Block = {
  slug: "contact-form-simple",
  interfaceName: "ContactFormSimpleBlock",
  admin: {
    group: "Forms",
  },
  fields: [
    {
      name: "form",
      type: "relationship",
      relationTo: "forms",
      required: true,
    },
  ],
}

