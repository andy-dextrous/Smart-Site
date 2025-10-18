import { CMSLink } from "@/components/fields/link"
import type { SectionCtaValue } from "./types"

interface SectionCtaComponentProps extends SectionCtaValue {
  containerClassName?: string
}

export function SectionCta(props: SectionCtaComponentProps) {
  const { text, button, containerClassName } = props

  if (!text && !button) {
    return null
  }

  return (
    <div className={containerClassName}>
      {text ? <p className="text-current">{text}</p> : null}

      {button ? (
        <CMSLink
          {...(button as any)}
          className="inline-flex items-center gap-content-sm md:shrink-0"
        />
      ) : null}
    </div>
  )
}
