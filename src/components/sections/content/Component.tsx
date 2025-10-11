import type { ContentBlock, Media as MediaType } from "@/admin/payload/payload-types"
import { Section } from "@/components/fields/section"
import { Media } from "@/components/fields/media"
import RichText from "@/components/fields/rich-text"
import { CMSLink } from "@/components/fields/link"
import { normalizeLinkField } from "@/components/fields/link/normalize-link"
import { cn } from "@/utilities/ui"

type ContentLayout = "stacked" | "split" | "columns"
type ContentAlignment = "start" | "center"

interface ExtendedContentBlock extends ContentBlock {
  layout?: ContentLayout
  alignment?: ContentAlignment
  showMedia?: boolean
  mediaPosition?: "left" | "right"
  showButton?: boolean
}

export function ContentComponent(props: ContentBlock) {
  const {
    content,
    layout = "stacked",
    alignment = "start",
    showMedia = false,
    media,
    mediaPosition = "right",
    showButton = false,
    button: buttonConfig,
    sectionSettings,
  } = props as ExtendedContentBlock

  const resolvedMedia =
    showMedia && media && typeof media === "object" ? (media as MediaType) : null

  const isSplitLayout = layout === "split"
  const isColumnLayout = layout === "columns"

  const buttonLink = normalizeLinkField(buttonConfig as Record<string, unknown>)
  const shouldRenderButton =
    showButton && buttonLink && (buttonLink.label || buttonLink.iconOnly || buttonLink.icon)

  const contentWrapperClass = cn({
    "grid gap-10 md:grid-cols-2 md:items-start": isSplitLayout,
    "lg:columns-2 lg:gap-12 space-y-6": isColumnLayout,
    "flex flex-col gap-8": layout === "stacked",
  })

  const mediaWrapperClass = cn(
    "relative overflow-hidden rounded-2xl border border-dark-border bg-neutral",
    isSplitLayout ? "w-full" : ""
  )

  return (
    <Section sectionSettings={sectionSettings} containerClassName="space-y-10">
      <div className={contentWrapperClass}>
        <div
          className={cn(
            "prose prose-lg max-w-none",
            isSplitLayout ? "md:pr-6" : "",
            alignment === "center" && !isSplitLayout ? "mx-auto text-center" : "",
            isColumnLayout ? "lg:columns-2" : "",
            isSplitLayout && mediaPosition === "left" ? "md:order-2" : isSplitLayout ? "md:order-1" : ""
          )}
        >
          <RichText
            data={content}
            enableGutter={false}
            textColor="inherit"
            className="space-y-6"
          />

          {shouldRenderButton ? (
            <div
              className={cn(
                "mt-8 flex",
                alignment === "center" ? "justify-center" : "justify-start"
              )}
            >
              <CMSLink {...(buttonLink as any)} className="inline-flex items-center gap-2" />
            </div>
          ) : null}
        </div>

        {resolvedMedia ? (
          <div
            className={cn(
              mediaWrapperClass,
              isSplitLayout && mediaPosition === "left" ? "md:order-1" : isSplitLayout ? "md:order-2" : ""
            )}
          >
            <Media resource={resolvedMedia} className="h-full w-full object-cover" />
          </div>
        ) : null}
      </div>
    </Section>
  )
}
