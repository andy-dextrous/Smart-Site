import { CMSLink } from "@/components/fields/link"
import { normalizeLinkField } from "@/components/fields/link/normalize-link"
import { cn } from "@/utilities/ui"
import { ArrowRight } from "lucide-react"

/*************************************************************************/
/*  SECTION CTA COMPONENT
/*************************************************************************/

interface SectionCtaProps {
  text?: string
  button?: Record<string, unknown> | null
  containerClassName?: string
}

export const SectionCta: React.FC<SectionCtaProps> = ({ text, button, containerClassName }) => {
  if (!text && !button) return null

  const buttonLink = normalizeLinkField(button as Record<string, any>)
  const shouldRenderButton =
    buttonLink && (buttonLink.label || buttonLink.iconOnly || buttonLink.icon)
  const showArrow =
    shouldRenderButton && !buttonLink?.icon && !buttonLink?.iconOnly && Boolean(buttonLink?.label)

  const buttonChildren = showArrow
    ? (
        <>
          <span>{buttonLink?.label}</span>
          <ArrowRight className="ml-2 size-4" />
        </>
      )
    : undefined

  return (
    <div
      className={cn(
        "gap-content container-sm flex flex-col items-start space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0",
        containerClassName
      )}
    >
      {text && <p className="text-current">{text}</p>}

      {shouldRenderButton ? (
        <CMSLink
          {...(buttonLink as any)}
          className="md:shrink-0 inline-flex items-center gap-2"
        >
          {buttonChildren}
        </CMSLink>
      ) : null}
    </div>
  )
}
