import { sectionCtaDefault } from "./defaults"

type DefaultValue = typeof sectionCtaDefault

export interface SectionCtaValue {
  text?: DefaultValue["text"]
  button?: DefaultValue["button"] | null
}
