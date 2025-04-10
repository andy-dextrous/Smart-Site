import { HeroPrimaryBlock } from "./hero-primary/Component"
import { HeroPrimary } from "./hero-primary/config"

export const sectionBlocks = [HeroPrimary]

export const blockComponents: Record<string, React.ComponentType<any>> = {
  "hero-primary": HeroPrimaryBlock,
}
