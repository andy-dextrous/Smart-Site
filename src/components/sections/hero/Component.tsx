import type { HeroBlock } from "@/payload-types"
import { parseHeadingGradient } from "@/components/heading-gradient"
import { CMSLink } from "@/components/fields/link"
import { Media } from "@/components/fields/media"
import { Section } from "@/components/fields/section"
import { tv } from "tailwind-variants"

const heroVariants = tv({
  slots: {
    section: "relative isolate overflow-hidden",
    content: "relative z-10 w-full",
    wrapper: "gap-content flex flex-col",
    copy: "gap-content-sm flex flex-col",
    buttons: "gap-content-sm flex flex-wrap items-center",
    preheading: "text-xs tracking-widest uppercase",
    heading: "",
    supporting: "max-w-2xl text-pretty",
    buttonItem: "gap-content-xs inline-flex items-center",
  },
  variants: {
    size: {
      full: {
        wrapper: "min-h-[100dvh] justify-center",
      },
      large: {
        wrapper: "min-h-[70dvh] justify-center",
      },
      medium: {
        wrapper: "min-h-[60dvh] justify-center",
      },
      small: {
        wrapper: "gap-content py-section-md justify-center",
      },
    },
    alignment: {
      left: {
        wrapper: "items-start text-left",
      },
      center: {
        wrapper: "items-center text-center",
        copy: "items-center text-center",
        buttons: "justify-center",
        preheading: "mx-auto",
        supporting: "mx-auto text-center",
      },
    },
    tone: {
      light: {
        preheading: "text-dark-500",
        heading: "",
        supporting: "text-dark-600",
      },
      dark: {
        section: "text-white",
        preheading: "text-white/80",
        heading: "text-white",
        supporting: "text-white/80",
      },
    },
    container: {
      default: "",
      flush: "px-0",
    },
  },
  defaultVariants: {
    size: "large",
    alignment: "left",
    tone: "light",
    container: "default",
  },
})

export function HeroComponent(props: HeroBlock) {
  const {
    preheading,
    heading,
    supportingText,
    buttons = [],
    alignment = "left",
    size = "large",
    backgroundImage,
    visualStyle = "classic",
    sectionSettings,
  } = props

  const parsedHeading = parseHeadingGradient(heading) ?? heading

  /**
   * Payload Fields
   */

  const heroButtons = buttons?.filter(buttonItem => Boolean(buttonItem?.button)) ?? []
  const hasButtons = heroButtons.length > 0

  const hasBackground = Boolean(backgroundImage && typeof backgroundImage === "object")
  const styleVariant =
    visualStyle === "image-overlay" && !hasBackground ? "classic" : visualStyle
  const isGradient = styleVariant === "gradient"
  const isOverlay = styleVariant === "image-overlay" && hasBackground
  const showBackgroundImage = hasBackground && styleVariant !== "classic"
  const showBackgroundLayer = isGradient || isOverlay || showBackgroundImage
  const lightCopy = isOverlay || isGradient
  const isDarkScheme = sectionSettings?.colorScheme === "dark"
  const toneVariant = isDarkScheme || lightCopy ? "dark" : "light"
  const containerVariant = isOverlay || isGradient ? "flush" : "default"
  const gradientClassName = showBackgroundImage
    ? "absolute inset-0 bg-gradient-to-br from-primary-500/40 via-dark-900/70 to-dark-950/85"
    : "absolute inset-0 bg-gradient-to-br from-primary-500/70 via-dark-900/90 to-dark-950"

  /**
   * Tailwind Variants
   */

  const {
    section,
    content,
    wrapper,
    copy,
    buttons: buttonsSlot,
    preheading: preheadingSlot,
    heading: headingSlot,
    supporting: supportingSlot,
    buttonItem,
  } = heroVariants({
    size: (size ?? "large") as NonNullable<HeroBlock["size"]>,
    alignment: (alignment ?? "left") as NonNullable<HeroBlock["alignment"]>,
    tone: toneVariant,
    container: containerVariant,
  })

  const sectionClassName = section()
  const contentClassName = content()
  const wrapperClassName = wrapper()
  const copyClassName = copy()
  const buttonsClassName = buttonsSlot()
  const preheadingClassName = preheadingSlot()
  const headingClassName = headingSlot()
  const supportingClassName = supportingSlot()
  const buttonItemClassName = buttonItem()

  return (
    <Section sectionSettings={sectionSettings} className={sectionClassName}>
      {showBackgroundLayer ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          {showBackgroundImage ? (
            <Media resource={backgroundImage} fill imgClassName="object-cover" />
          ) : null}

          {isOverlay ? (
            <div className="from-dark/80 via-dark/60 to-dark/90 absolute inset-0 bg-gradient-to-b" />
          ) : null}

          {isGradient ? <div className={gradientClassName} /> : null}
        </div>
      ) : null}

      <div className={contentClassName}>
        <div
          className={wrapperClassName}
          data-animate="fade-up"
          data-animate-distance="24"
          data-animate-stagger="0.1"
          data-animate-target="[data-animate-child]"
        >
          <div className={copyClassName}>
            {preheading ? (
              <p className={preheadingClassName} data-animate-child>
                {preheading}
              </p>
            ) : null}

            <h1 className={headingClassName} data-animate-child>
              {parsedHeading}
            </h1>

            {supportingText ? (
              <p className={supportingClassName} data-animate-child>
                {supportingText}
              </p>
            ) : null}
          </div>

          {hasButtons ? (
            <div className={buttonsClassName} data-animate-child>
              {heroButtons.map((buttonItem, index) => {
                if (!buttonItem?.button) return null

                return (
                  <CMSLink
                    key={`hero-button-${index}`}
                    {...buttonItem.button}
                    className={buttonItemClassName}
                  />
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  )
}
