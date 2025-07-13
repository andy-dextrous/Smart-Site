"use client"

import type { HeadingLeftContentBlock } from "@/payload/payload-types"
import RichText from "@/payload/components/frontend/rich-text"
import { parseHeadingGradient } from "@/components/heading-gradient"
import { tv } from "tailwind-variants"
import { gsap, useGSAP } from "@/providers/gsap"
import { useRef } from "react"

/*************************************************************************/
/*  COMPONENT VARIANTS
/*************************************************************************/

const sectionVariants = tv({
  base: "side-border-dark relative",
  variants: {
    backgroundColorScheme: {
      dark: "bg-dark",
      light: "bg-light",
      neutral: "bg-neutral",
    },
  },
})

const textVariants = tv({
  base: "",
  variants: {
    backgroundColorScheme: {
      dark: "text-white",
      light: "text-dark",
      neutral: "text-dark",
    },
  },
})

const gridVariants = tv({
  base: "grid grid-cols-1 gap-16",
  variants: {
    ratio: {
      "1/2": "lg:grid-cols-3 lg:gap-24",
      "1/1": "lg:grid-cols-2 lg:gap-24",
      "2/1": "lg:grid-cols-3 lg:gap-24",
    },
  },
})

const headingColumnVariants = tv({
  base: "gap-content-lg flex flex-col justify-center",
  variants: {
    ratio: {
      "1/2": "lg:col-span-1",
      "1/1": "lg:col-span-1",
      "2/1": "lg:col-span-2",
    },
  },
})

const contentColumnVariants = tv({
  base: "flex flex-col justify-center",
  variants: {
    ratio: {
      "1/2": "lg:col-span-2",
      "1/1": "lg:col-span-1",
      "2/1": "lg:col-span-1",
    },
  },
})

/*************************************************************************/
/*  HEADING LEFT CONTENT COMPONENT
/*************************************************************************/

export const HeadingLeftContentComponent: React.FC<HeadingLeftContentBlock> = ({
  heading,
  backgroundColorScheme = "dark",
  ratio = "1/1",
  content,
}) => {
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Parse heading and convert span tags to gradient elements
  const parsedHeading = parseHeadingGradient(heading)

  const textColor = textVariants({ backgroundColorScheme })

  /*************************************************************************/
  /*  TITLE ANIMATION
  /*************************************************************************/

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

  return (
    <section className={sectionVariants({ backgroundColorScheme })}>
      <div className="container-md relative z-10">
        <div className={gridVariants({ ratio })}>
          {/* Heading Column - Left */}
          <div className={headingColumnVariants({ ratio })}>
            {heading && (
              <h2 ref={titleRef} className={`${textColor} title-hidden`}>
                {parsedHeading}
              </h2>
            )}
          </div>

          {/* Content Column - Right */}
          <div className={`${contentColumnVariants({ ratio })} ${textColor}`}>
            {content && (
              <div className="w-full">
                <RichText
                  data={content}
                  enableGutter={false}
                  className="prose max-w-none [&>p]:font-light"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
