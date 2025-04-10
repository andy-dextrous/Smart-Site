import { HeroPrimaryBlock } from "./hero-primary/Component"
import { HeroPrimary } from "./hero-primary/config"
import { TextImage as TextImageBlock } from "./text-image/config"
import { TextImageComponent } from "./text-image/Component"

/**
 *  Paste Config Files Here
 */

export const sectionBlocks = [HeroPrimary, TextImageBlock]

/**
 * Mapping of block slugs to their corresponding React components
 * This is used to map the block slugs to the correct component for rendering
 */

export const mapping: Record<string, React.ComponentType<any>> = {
  "hero-primary": HeroPrimaryBlock,
  "text-image": TextImageComponent,
}
