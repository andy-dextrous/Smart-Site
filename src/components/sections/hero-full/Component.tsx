"use client"

import { Grid, GridLines } from "@/components/layout/grid"
import type { HeroFullBlock as HeroProps } from "@/payload/payload-types"
import { gsap, useGSAP } from "@/providers/gsap"
import { SplitText } from "gsap/SplitText"
import { parseHeadingGradient } from "@/components/heading-gradient"
import React, { useRef } from "react"
import { tv } from "tailwind-variants"
import { HeroLayout } from "./hero-layout"
import { ImageBackground } from "./image-background"

/****************************************************
 * Hero Container Variants Configuration
 ****************************************************/

const heroContainerVariants = tv({
  base: "pt-first-section-nav-offset relative flex w-full flex-col justify-between overflow-hidden border-b",
  variants: {
    size: {
      full: "h-screen",
      md: "min-h-[65vh]",
      sm: "min-h-[50vh]",
    },
    colorScheme: {
      "background-image": "bg-dark border-light-border",
      dark: "bg-dark border-light-border",
      white: "border-dark-border bg-white",
      primary: "bg-primary border-light-border",
      secondary: "bg-secondary border-light-border",
    },
  },
  defaultVariants: {
    size: "full",
    colorScheme: "background-image",
  },
})

/****************************************************
 * Hero Full Component
 ****************************************************/

export const HeroFullComponent: React.FC<HeroProps> = ({
  heading,
  content,
  backgroundImage,
  buttons,
  size = "full",
  colorScheme = "background-image",
}) => {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const backgroundContainerRef = useRef<HTMLDivElement>(null)
  const timestampDateRef = useRef<HTMLDivElement>(null)
  const timestampTimeRef = useRef<HTMLDivElement>(null)
  const heroContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const secondaryContentRef = useRef<HTMLDivElement>(null)
  const timestampRef = useRef<HTMLDivElement>(null)
  const contactButtonsRef = useRef<HTMLDivElement>(null)

  // Parse heading and convert span tags to gradient elements
  const parsedHeading = parseHeadingGradient(heading)

  /****************************************************
   * GSAP Animations
   ****************************************************/

  useGSAP(
    () => {
      // Custom title reveal animation - inlined for direct control
      if (titleRef.current) {
        // Create SplitText for title element
        const split = SplitText.create(titleRef.current, {
          type: "lines",
          mask: "lines",
          linesClass: "title-line",
        })

        // Set initial state for split lines
        gsap.set(split.lines, {
          xPercent: -100,
          autoAlpha: 0,
          onComplete: () => {
            titleRef.current?.classList.remove("title-hidden")
            gsap.set(titleRef.current, { autoAlpha: 1 })
          },
        })

        // Create timeline for title animation
        const titleTl = gsap.timeline()

        titleTl.fromTo(
          split.lines,
          {
            xPercent: -100,
            autoAlpha: 0,
          },
          {
            xPercent: 0,
            autoAlpha: 1,
            duration: 1.3,
            ease: "power3.out",
            immediateRender: false,
            stagger: 0.3,
            delay: 0.3,
          }
        )

        // Revert SplitText after animation completes
        titleTl.call(() => {
          gsap.delayedCall(0.1, () => {
            split.revert()
          })
        })

        // Staggered content animation after title completes
        const contentElements = [
          contentRef.current,
          secondaryContentRef.current,
          timestampRef.current,
          contactButtonsRef.current,
        ].filter(Boolean)

        if (contentElements.length > 0) {
          gsap.fromTo(
            contentElements,
            {
              autoAlpha: 0,
              y: 20,
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              stagger: 0.15,
              delay: 1.8, // Start after title animation
              onStart: () => {
                // Remove Tailwind classes when animation starts
                contentElements.forEach(el => {
                  el?.classList.remove("opacity-0", "translate-y-5")
                })
              },
            }
          )
        }
      }

      if (colorScheme === "background-image") {
        gsap.fromTo(
          backgroundContainerRef.current,
          {
            autoAlpha: 0,
          },
          {
            autoAlpha: 1,
            duration: 1,
            ease: "power4.inOut",
            delay: 0.4,
          }
        )
      }

      // Fade in and gentle continuous zoom on background image
      const heroImage = document.querySelector('[data-id="hero-background-image"]')

      if (heroImage) {
        gsap.to(heroImage, {
          scale: 1.2,
          duration: 20,
          repeat: -1,
          yoyo: true,
          ease: "linear",
          force3D: true,
        })
      }
    },
    {
      scope: heroContainerRef.current!,
    }
  )

  return (
    <section
      className={heroContainerVariants({ size, colorScheme })}
      ref={heroContainerRef}
    >
      <div className="relative h-full w-full">
        <Grid className="h-full grid-rows-10">
          <HeroLayout
            size={size}
            colorScheme={colorScheme}
            titleRef={titleRef}
            parsedHeading={parsedHeading}
            fallbackHeading={heading}
            content={content}
            buttons={buttons}
            timestampDateRef={timestampDateRef}
            timestampTimeRef={timestampTimeRef}
            contentRef={contentRef}
            secondaryContentRef={secondaryContentRef}
            timestampRef={timestampRef}
            contactButtonsRef={contactButtonsRef}
          />
        </Grid>
      </div>

      {/*************************************************************************/}
      {/*  GRID LINES                                         */}
      {/*************************************************************************/}
      <div className="pt-nav top-nav inset-x-section-x pointer-events-none absolute bottom-0">
        <GridLines />
      </div>

      {/*************************************************************************/}
      {/*  BACKGROUND IMAGE AND EFFECTS                                          */}
      {/*************************************************************************/}
      {colorScheme === "background-image" && (
        <ImageBackground
          backgroundImage={backgroundImage}
          containerRef={backgroundContainerRef}
        />
      )}
    </section>
  )
}
