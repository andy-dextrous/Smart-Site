"use client"

import RichText from "@/components/fields/rich-text"
import { cn } from "@/lib/ui"
import { parseHeadingGradient } from "@/components/heading-gradient"

/*************************************************************************/
/*  SECTION INTRO COMPONENT
/*************************************************************************/

interface SectionIntroProps {
  heading?: string
  description?: any // Rich text from Payload
  align?: "center" | "start"
  headingClassName?: string
  descriptionClassName?: string
  containerClassName?: string
}

export const SectionIntro: React.FC<SectionIntroProps> = ({
  heading,
  description,
  align = "start",
  headingClassName,
  descriptionClassName,
  containerClassName,
}) => {
  const parsedHeading = parseHeadingGradient(heading)

  if (!heading && !description) return null

  return (
    <div
      className={cn(
        "container-sm mb-content-xl flex flex-col gap-content-lg",
        align === "center" ? "items-center" : "items-start",
        containerClassName
      )}
    >
      {heading && (
        <h2 className={cn("text-balance", headingClassName)}>
          {parsedHeading}
        </h2>
      )}

      {description && (
        <RichText
          data={description}
          enableGutter={false}
          textColor="inherit"
          className={cn("w-full", descriptionClassName)}
        />
      )}
    </div>
  )
}
