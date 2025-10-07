import { LucideIcon } from "lucide-react"
import { IconType } from "react-icons/lib"

/*************************************************************************/
/*  ICON CONFIGURATION TYPES
/*************************************************************************/

export type IconSource = "lucide" | "react-icons" | "custom"

export interface BaseIconConfig {
  type: IconSource
}

export interface LucideIconConfig extends BaseIconConfig {
  type: "lucide"
  name: string // e.g., "Home", "Settings", "Users"
}

export interface ReactIconConfig extends BaseIconConfig {
  type: "react-icons"
  name: string // e.g., "fa/FaHome", "ri/RiTeamFill", "md/MdSettings"
}

export interface CustomIconConfig extends BaseIconConfig {
  type: "custom"
  mediaId: string
  url?: string
  alt?: string
  width?: number
  height?: number
}

export type IconConfig = LucideIconConfig | ReactIconConfig | CustomIconConfig

/*************************************************************************/
/*  ICON COMPONENT TYPE
/*************************************************************************/

export type IconComponent = LucideIcon | IconType | React.ComponentType<{ className?: string }>

/*************************************************************************/
/*  COLLECTION CUSTOM METADATA WITH ICON
/*************************************************************************/

export interface CollectionCustomMetadata {
  icon?: IconConfig
  [key: string]: any // Allow other custom properties
}
