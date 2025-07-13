import type { ArrayField, Field } from "payload"

import deepMerge from "@/utilities/deep-merge"
import { link } from "./link"

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
