export type SectionColorScheme =
  | "light"
  | "dark"
  | "neutral"
  | "surface"
  | "transparent"

export type SectionContainerWidth = "sm" | "md" | "lg" | "full"

export type SectionPaddingX = "default" | "none" | "xs" | "sm" | "lg" | "xl"

export type SectionPaddingY =
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
  paddingX?: SectionPaddingX | null
  paddingY?: SectionPaddingY | null
}
