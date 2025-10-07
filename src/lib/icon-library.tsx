import {
  AlignLeft,
  AlertTriangle,
  BarChart3,
  Layers,
  Rocket,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react"
import { FaChartLine, FaLightbulb, FaShieldAlt } from "react-icons/fa"
import { GiCircuitry } from "react-icons/gi"
import { MdInsights } from "react-icons/md"
import { RiStackFill } from "react-icons/ri"
import type { LucideIcon } from "lucide-react"
import type { IconType } from "react-icons"

/*************************************************************************/
/*  ICON LIBRARY
/*************************************************************************/

export type IconLibrarySource = "lucide" | "react-icons" | "custom"

export interface IconLibraryLucideOption {
  value: string
  label: string
  Icon: LucideIcon
}

export interface IconLibraryReactOption {
  value: string
  label: string
  Icon: IconType
}

export const lucideLibrary: IconLibraryLucideOption[] = [
  { value: "Sparkles", label: "Sparkles", Icon: Sparkles },
  { value: "AlignLeft", label: "Strategy", Icon: AlignLeft },
  { value: "AlertTriangle", label: "Risk", Icon: AlertTriangle },
  { value: "Rocket", label: "Launch", Icon: Rocket },
  { value: "Layers", label: "Layers", Icon: Layers },
  { value: "Workflow", label: "Systems", Icon: Workflow },
  { value: "Target", label: "Target", Icon: Target },
  { value: "BarChart3", label: "Insights", Icon: BarChart3 },
]

export const reactLibrary: IconLibraryReactOption[] = [
  { value: "fa/FaChartLine", label: "Performance", Icon: FaChartLine },
  { value: "fa/FaLightbulb", label: "Idea", Icon: FaLightbulb },
  { value: "fa/FaShieldAlt", label: "Shield", Icon: FaShieldAlt },
  { value: "ri/RiStackFill", label: "Stack", Icon: RiStackFill },
  { value: "gi/GiCircuitry", label: "Automation", Icon: GiCircuitry },
  { value: "md/MdInsights", label: "Insights", Icon: MdInsights },
]

export function findLucideIcon(value: string) {
  return lucideLibrary.find(icon => icon.value === value)
}

export function findReactIcon(value: string) {
  return reactLibrary.find(icon => icon.value === value)
}
