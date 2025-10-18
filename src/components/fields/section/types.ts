export type SectionColorScheme = "light" | "dark" | "neutral"

export type SectionContainerWidth = "sm" | "md" | "lg" | "full"

export type SectionPaddingValue =
  | "default"
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "xxl"

export interface SectionAttribute {
  id?: string | null
  key?: string | null
  value?: string | null
}

export interface SectionSettings {
  attributes?: SectionAttribute[] | null
  containerWidth?: SectionContainerWidth | null
  colorScheme?: SectionColorScheme | null
  paddingTop?: SectionPaddingValue | null
  paddingBottom?: SectionPaddingValue | null
  paddingLeft?: SectionPaddingValue | null
  paddingRight?: SectionPaddingValue | null
}
