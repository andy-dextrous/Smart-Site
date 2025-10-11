import type { HeroBlock, Media as MediaType } from "@/admin/payload/payload-types"
import { Section } from "@/components/fields/section"
import { Media } from "@/components/fields/media"
import { CMSLink } from "@/components/fields/link"
import { normalizeLinkField } from "@/components/fields/link/normalize-link"
import RichText from "@/components/fields/rich-text"
import { cn } from "@/utilities/ui"

type HeroAlignment = "left" | "center"
type HeroSize = "full" | "large" | "medium" | "small"

const sizeClassMap: Record<HeroSize, string> = {
  full: "min-h-[90vh] justify-center",
  large: "min-h-[70vh] justify-center",
  medium: "min-h-[60vh] justify-center",
  small: "gap-8 justify-center py-16",
}

const alignmentClassMap: Record<HeroAlignment, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
}

const overlayClass =
  "absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50"

export function HeroComponent(props: HeroBlock) {
  const {
    eyebrow,
    heading,
    supportingText,
    highlight,
    buttons,
    alignment = "left",
    size = "large",
    backgroundImage,
    sectionSettings,
  } = props

  const media =
    backgroundImage && typeof backgroundImage === "object"
      ? (backgroundImage as MediaType)
      : null

  const heroButtons = Array.isArray(buttons) ? buttons : []
  const buttonLinks = heroButtons
    .map((buttonItem: any, index) => {
      const buttonLink = normalizeLinkField(buttonItem?.button)

      if (!buttonLink) {
        return null
      }

      const hasRenderableContent =
        Boolean(buttonLink.label) || Boolean(buttonLink.iconOnly) || Boolean(buttonLink.icon)

      if (!hasRenderableContent) {
        return null
      }

      return (
        <CMSLink
          key={`hero-button-${index}`}
          {...buttonLink}
          className="inline-flex items-center gap-2"
        />
      )
    })
    .filter(Boolean)

  return (
    <Section
      sectionSettings={sectionSettings}
      className={cn("relative overflow-hidden", media ? "text-white" : "text-dark")}
      disableContainer
    >
      <div className="relative">
        {media ? (
          <div className="absolute inset-0">
            <Media resource={media} fill imgClassName="object-cover" />
            <div className={overlayClass} />
          </div>
        ) : null}

        <div
          className={cn(
            "container-md relative flex flex-col gap-6 py-24 sm:gap-8 sm:py-32",
            sizeClassMap[size as HeroSize] ?? sizeClassMap.large,
            alignmentClassMap[alignment as HeroAlignment] ?? alignmentClassMap.left
          )}
        >
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">{eyebrow}</p>
          ) : null}

          <div className="space-y-6">
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {heading}
            </h1>

            {supportingText ? (
              <RichText
                data={supportingText}
                variant="prose"
                enableGutter={false}
                className={cn(
                  "prose-lg max-w-2xl text-pretty",
                  media ? "prose-invert" : "text-dark-600"
                )}
              />
            ) : null}

            {highlight ? (
              <p className={cn("text-lg font-medium", media ? "text-white" : "text-dark")}>
                {highlight}
              </p>
            ) : null}
          </div>

          {buttonLinks.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">{buttonLinks}</div>
          ) : null}
        </div>
      </div>
    </Section>
  )
}
