"use client"

import type { FullwidthCtaBlock, Media } from "@/admin/payload/payload-types"
import { CMSLink } from "@/components/fields/link"
import ArrowRightIcon from "@/components/icons/arrow-right"
import Image from "next/image"
import { Grid, GridLines } from "@/components/layout/grid"
import { Fragment, useRef } from "react"
import { cn } from "@/utilities/ui"
import { parseHeadingGradient } from "@/components/heading-gradient"
import { gsap, useGSAP } from "@/providers/gsap"

/*************************************************************************/
/*  FULLWIDTH CTA COMPONENT
/*************************************************************************/

export const FullwidthCtaComponent: React.FC<FullwidthCtaBlock> = props => {
  const { heading, description, textAlignment, colorScheme, backgroundImage, button } =
    props
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Parse heading and convert span tags to gradient elements if needed
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

  return (
    <section className="relative flex h-screen w-full flex-col justify-center overflow-hidden py-0">
      <div className="relative h-full w-full">
        <Grid className="h-full grid-rows-10">
          <div
            className={cn(
              "col-span-full row-span-6 row-start-3 flex flex-col justify-center",
              {
                "items-center": textAlignment === "center",
                "items-end text-right md:col-span-5 md:col-start-7 lg:col-span-5 lg:col-start-7 xl:col-span-3 xl:col-start-9":
                  textAlignment === "right",
                "md:col-span-5 md:col-start-2 lg:col-span-5 lg:col-start-2 xl:col-span-3 xl:col-start-2":
                  textAlignment === "left",
              }
            )}
          >
            <div
              className={cn("flex max-w-[500px] flex-col", {
                "items-center text-center": textAlignment === "center",
                "items-end": textAlignment === "right",
              })}
            >
              <h2 ref={titleRef} className="title-hidden text-white">
                {parsedHeading}
              </h2>
              <p className="mb-8 font-light text-white">{description}</p>
              {button && (
                <CMSLink
                  {...button.link}
                  appearance={button.variant || "white"}
                  size={button.size || "lg"}
                  className={cn({
                    "self-center": textAlignment === "center",
                    "self-start": textAlignment !== "center",
                  })}
                >
                  {button.link?.label}
                  <ArrowRightIcon className="!h-[14px] !w-[24px]" />
                </CMSLink>
              )}
            </div>
          </div>
        </Grid>
      </div>

      {/* Background */}
      <Background backgroundImage={backgroundImage} colorScheme={colorScheme} />
    </section>
  )
}

/*************************************************************************/
/*  BACKGROUND COMPONENT
/*************************************************************************/

const Background = ({
  backgroundImage,
  colorScheme,
}: {
  backgroundImage: string | Media
  colorScheme?: string
}) => {
  // Get image URL from Media object or use string directly
  const imageUrl =
    typeof backgroundImage === "object" && backgroundImage?.url
      ? backgroundImage.url
      : typeof backgroundImage === "string"
        ? backgroundImage
        : "https://res.cloudinary.com/wild-creative/image/upload/v1748834621/meeting_3_hbtmkr.jpg"

  return (
    <Fragment>
      <div className="inset-x-section-x absolute top-0 bottom-0">
        <GridLines />
      </div>
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

          {/* Conditional Overlays based on Color Scheme */}
          {colorScheme === "dark" ? (
            // Dark overlay (70% opacity)
            <div className="bg-dark/70 absolute inset-0 z-5" />
          ) : (
            // Gradient overlay (default)
            <Fragment>
              <div className="bg-primary/70 absolute inset-0 z-5" />
              <div className="from-secondary-600/80 to-primary-600/60 absolute inset-0 z-5 bg-linear-to-r opacity-80 mix-blend-hard-light" />
              <div className="cta-overlay-depth absolute inset-0 z-6 mix-blend-plus-darker" />
            </Fragment>
          )}
        </div>
      </div>
    </Fragment>
  )
}
