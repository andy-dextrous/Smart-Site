import { CMSLink } from "@/payload/components/frontend/cms-link"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/utilities/ui"
import ArrowRightIcon from "@/components/icons/arrow-right"

/*************************************************************************/
/*  SECTION CTA COMPONENT
/*************************************************************************/

interface SectionCtaProps {
  text?: string
  button?: {
    variant?: ButtonProps["variant"] | null
    size?: ButtonProps["size"] | null
    layout?: ButtonProps["layout"] | null
    icon?: boolean | null
    link?: {
      type?: ("reference" | "custom") | null
      newTab?: boolean | null
      reference?: any | null
      url?: string | null
      label: string
    } | null
  } | null
  containerClassName?: string
}

export const SectionCta: React.FC<SectionCtaProps> = ({
  text,
  button,
  containerClassName,
}) => {
  if (!text && !button) return null

  return (
    <div
      className={cn(
        "gap-content container-sm flex flex-col items-start space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0",
        containerClassName
      )}
    >
      {text && <p className="text-current">{text}</p>}

      {button?.link && (
        <CMSLink
          {...button.link}
          appearance={button.variant || "default"}
          size={button.size || "lg"}
          className="md:shrink-0"
        >
          {button.link.label}
          {!button.icon && <ArrowRightIcon className="!h-[14px] !w-[24px]" />}
        </CMSLink>
      )}
    </div>
  )
}
