"use client"

import type { CtaFormBlock, Media } from "@/admin/payload/payload-types"
import { CMSForm } from "@/components/fields/form"
import RichText from "@/components/fields/rich-text"
import { parseHeadingGradient } from "@/components/heading-gradient"
import { tv } from "tailwind-variants"
import { gsap, useGSAP } from "@/providers/gsap"
import Image from "next/image"
import { Fragment, useRef } from "react"

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
      image: "bg-dark overflow-hidden",
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
      image: "text-white",
    },
  },
})

/*************************************************************************/
/*  CTA FORM COMPONENT
/*************************************************************************/

export const CtaFormComponent: React.FC<CtaFormBlock> = ({
  heading,
  description,
  backgroundColorScheme = "dark",
  variant = "neutral",
  backgroundImage,
  form,
}) => {
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Parse heading and convert span tags to gradient elements
  const parsedHeading = parseHeadingGradient(heading)

  const textColor = textVariants({ backgroundColorScheme })

  // Auto-set form variant to transparent when background image is used
  const formVariant = backgroundColorScheme === "image" ? "transparent" : variant

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
      {/* Background Image */}
      {backgroundColorScheme === "image" && backgroundImage && (
        <Background backgroundImage={backgroundImage} />
      )}

      <div className="container-md relative z-10">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Text Column - Left */}
          <div className="gap-content-lg flex flex-col justify-center">
            {heading && (
              <h2 ref={titleRef} className={`${textColor} title-hidden`}>
                {parsedHeading}
              </h2>
            )}
            {description && (
              <div className={textColor}>
                <RichText
                  data={description}
                  enableGutter={false}
                  className="[&>p]:font-light"
                />
              </div>
            )}
          </div>

          {/* Form Column - Right */}
          <div className="flex flex-col justify-center">
            {form && <CMSForm form={form} variant={formVariant as any} />}
          </div>
        </div>
      </div>
    </section>
  )
}

/*************************************************************************/
/*  BACKGROUND COMPONENT
/*************************************************************************/

const Background = ({ backgroundImage }: { backgroundImage: string | Media }) => {
  // Get image URL from Media object or use string directly
  const imageUrl =
    typeof backgroundImage === "object" && backgroundImage?.url
      ? backgroundImage.url
      : typeof backgroundImage === "string"
        ? backgroundImage
        : ""

  return (
    <Fragment>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="relative h-full w-full">
          {/* Background Image */}
          <div className="absolute inset-0 size-full">
            <Image
              src={imageUrl}
              alt="Background Image"
              className="absolute inset-[-10%] h-[110%] w-[110%] object-cover"
              fill
              priority
              quality={100}
              sizes="110vw"
              data-speed="0.8"
            />
          </div>

          {/* Dark overlay for better text readability */}
          <div className="bg-dark/70 absolute inset-0 z-5" />
        </div>
      </div>
    </Fragment>
  )
}
