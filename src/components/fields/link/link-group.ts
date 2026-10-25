import type { ArrayField, Field } from "payload"

import deepMerge from "@/lib/deep-merge"
import { link } from "@/components/fields/link/link"

type LinkGroupType = (options?: { overrides?: Partial<ArrayField> }) => Field

export const linkGroup: LinkGroupType = ({ overrides = {} } = {}) => {
  const generatedLinkGroup: Field = {
    name: "links",
    type: "array",
    fields: [link()],
    admin: {
      initCollapsed: true,
    },
  }

  return deepMerge(generatedLinkGroup, overrides)
}
