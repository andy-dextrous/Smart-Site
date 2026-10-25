import type { ContentBlock } from "@/payload-types"
import { Section } from "@/components/fields/section"
import { Media } from "@/components/fields/media"
import RichText from "@/components/fields/rich-text"
import { CMSLink } from "@/components/fields/link"
import { tv } from "tailwind-variants"

const contentVariants = tv({
  slots: {
    container: "gap-content-lg flex flex-col",
    layout: "gap-content flex flex-col",
    copy: "gap-content flex flex-col text-pretty",
    media: "border-dark-border bg-neutral relative overflow-hidden border",
    richText: "[&>*+*]:mt-content",
    buttonContainer: "flex",
    button: "gap-content-sm inline-flex items-center",
  },
  variants: {
    layout: {
      stacked: {},
      split: {
        layout: "gap-grid-lg grid md:grid-cols-2 md:items-start",
      },
      columns: {
        layout: "gap-content lg:gap-content-lg flex flex-col",
        richText: "lg:columns-2",
      },
    },
    alignment: {
      start: {},
      center: {
        copy: "items-center text-center",
        richText: "text-center",
        buttonContainer: "justify-center",
      },
    },
    mediaPosition: {
      left: {},
      right: {},
    },
    mediaPresence: {
      with: {},
      without: {},
    },
  },
  compoundVariants: [
    {
      layout: "split",
      mediaPresence: "with",
      mediaPosition: "right",
      class: {
        copy: "md:pr-content md:order-1",
        media: "md:order-2",
      },
    },
    {
      layout: "split",
      mediaPresence: "with",
      mediaPosition: "left",
      class: {
        copy: "md:pl-content md:order-2",
        media: "md:order-1",
      },
    },
    {
      layout: "split",
      class: {
        media: "w-full",
      },
    },
  ],
  defaultVariants: {
    layout: "stacked",
    alignment: "start",
    mediaPosition: "right",
    mediaPresence: "without",
  },
})

export function ContentComponent(props: ContentBlock) {
  const {
    content,
    layout,
    alignment,
    showMedia,
    media,
    mediaPosition,
    showButton,
    button,
    sectionSettings,
  } = props

  const hasMedia = Boolean(showMedia && media)
  const requestedLayout = layout ?? "stacked"
  const effectiveLayout =
    requestedLayout === "split" && !hasMedia ? "stacked" : requestedLayout

  const resolvedAlignment = effectiveLayout === "split" ? "start" : (alignment ?? "start")
  const resolvedMediaPosition = hasMedia ? (mediaPosition ?? "right") : "right"
  const mediaPresence = hasMedia ? "with" : "without"

  const {
    container,
    layout: layoutSlot,
    copy,
    media: mediaSlot,
    richText,
    button: buttonSlot,
    buttonContainer,
  } = contentVariants({
    layout: effectiveLayout,
    alignment: resolvedAlignment,
    mediaPosition: resolvedMediaPosition,
    mediaPresence,
  })

  const containerClassName = container()
  const layoutClassName = layoutSlot()
  const copyClassName = copy()
  const mediaClassName = mediaSlot()
  const richTextClassName = richText()
  const buttonClassName = buttonSlot()
  const buttonContainerClassName = buttonContainer()

  return (
    <Section sectionSettings={sectionSettings} containerClassName={containerClassName}>
      <div className={layoutClassName}>
        <div className={copyClassName}>
          <RichText
            data={content}
            enableGutter={false}
            textColor="inherit"
            className={richTextClassName}
          />

          {showButton && button ? (
            <div className={buttonContainerClassName}>
              <CMSLink {...button} className={buttonClassName} />
            </div>
          ) : null}
        </div>

        {hasMedia ? (
          <Media
            resource={media}
            className={mediaClassName}
            imgClassName="h-full w-full object-cover"
          />
        ) : null}
      </div>
    </Section>
  )
}
