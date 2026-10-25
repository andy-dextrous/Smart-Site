import { sectionCtaDefault } from "@/components/fields/section-cta/defaults"

type DefaultValue = typeof sectionCtaDefault

export interface SectionCtaValue {
  text?: DefaultValue["text"]
  button?: DefaultValue["button"] | null
}
