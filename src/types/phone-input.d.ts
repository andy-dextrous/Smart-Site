declare module "react-phone-number-input/flags" {
  import { ComponentType } from "react"

  interface FlagProps {
    title?: string
  }

  const flags: Record<string, ComponentType<FlagProps>>
  export default flags
}
