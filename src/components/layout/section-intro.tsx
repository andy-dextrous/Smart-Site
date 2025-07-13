"use client"

import RichText from "@/payload/components/frontend/rich-text"
import { cn } from "@/utilities/ui"
import { parseHeadingGradient } from "@/components/heading-gradient"
import { gsap, useGSAP } from "@/providers/gsap"
import { useRef } from "react"

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
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Parse heading and convert span tags to gradient elements
  const parsedHeading = parseHeadingGradient(heading)

  /****************************************************
   * GSAP Animation
   ****************************************************/

  useGSAP(() => {
    if (titleRef.current) {
      gsap.effects.titleReveal(titleRef.current, {
        trigger: {
          trigger: titleRef.current,
          start: "top 90%",
          end: "bottom 40%",
        },
      })
    }
  })

  if (!heading && !description) return null

  return (
    <div
      className={cn(
        "container-sm gap-content-lg mb-section-x flex flex-col",
        align === "center" ? "items-center" : "items-start",
        containerClassName
      )}
    >
      {heading && (
        <h2 ref={titleRef} className={cn("title-hidden", headingClassName)}>
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
