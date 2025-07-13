"use client"

import { Grid, GridLines } from "@/components/layout/grid"
import { Media } from "@/payload/components/frontend/media"
import type { Post, Media as MediaType } from "@/payload/payload-types"
import { gsap, useGSAP } from "@/providers/gsap"
import { SplitText } from "gsap/SplitText"
import { formatAuthors } from "@/utilities/format-authors"
import React, { useRef } from "react"
import { tv } from "tailwind-variants"
import { cn } from "@/utilities/ui"

/****************************************************
 * Post Hero Container Variants Configuration
 ****************************************************/

const postHeroVariants = tv({
  base: "pt-first-section-nav-offset flicker-mask-bottom relative z-20 flex min-h-[80vh] w-full flex-col justify-center overflow-hidden",
  variants: {
    hasBackground: {
      true: "bg-dark border-light-border",
      false: "bg-dark border-light-border",
    },
  },
  defaultVariants: {
    hasBackground: false,
  },
})

/*************************************************************************/
/*  POST HERO COMPONENT
/*************************************************************************/

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { categories, heroImage, populatedAuthors, publishedAt, title } = post

  const titleRef = useRef<HTMLHeadingElement>(null)
  const backgroundContainerRef = useRef<HTMLDivElement>(null)
  const heroContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)

  const hasAuthors =
    populatedAuthors &&
    populatedAuthors.length > 0 &&
    formatAuthors(populatedAuthors) !== ""

  const hasBackground = !!(heroImage && typeof heroImage === "object")

  /****************************************************
   * GSAP Animations
   ****************************************************/

  useGSAP(
    () => {
      // Custom title reveal animation
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
        const contentElements = [contentRef.current, metaRef.current].filter(Boolean)

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

      if (hasBackground && backgroundContainerRef.current) {
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

        // Fade in and gentle continuous zoom on background image
        const heroImageEl = backgroundContainerRef.current.querySelector(
          '[data-id="post-hero-background-image"] img'
        )

        if (heroImageEl) {
          gsap.to(heroImageEl, {
            scale: 1.2,
            duration: 20,
            repeat: -1,
            yoyo: true,
            ease: "linear",
            force3D: true,
          })
        }
      }
    },
    {
      scope: heroContainerRef.current!,
    }
  )

  return (
    <section className={postHeroVariants({ hasBackground })} ref={heroContainerRef}>
      {/*************************************************************************/}
      {/*  BACKGROUND IMAGE                                                     */}
      {/*************************************************************************/}

      <div ref={backgroundContainerRef} className="absolute inset-0 z-10 overflow-hidden">
        <div className="relative h-full w-full">
          {/* Dark Gradient */}
          <div
            className={cn(
              // Base styles
              "absolute inset-0 z-10",
              // Gradient
              "from-dark-950 to-dark-950 via-dark/20 bg-gradient-to-b via-50% to-100%"
            )}
          />

          {/* Background Image */}
          <div
            className="absolute inset-0 z-0 size-full"
            data-id="post-hero-background-image"
          >
            <Media
              resource={heroImage as MediaType}
              fill
              priority
              imgClassName="absolute size-full inset-0 object-cover"
            />
          </div>

          {/* Spotlight 1 - Royal Purple Spotlight */}
          <div
            className={cn(
              // Base styles
              "absolute z-50 h-[700px] w-[800px] blur-[350px]",
              "-bottom-[148px] -left-[370px]",
              // Mobile
              "bg-primary/30",
              // Desktop
              "lg:bg-primary/30"
            )}
          />

          {/* Spotlight 2 - Chrysler Blue Spotlight */}
          <div
            className={cn(
              // Base styles
              "absolute z-50 h-[1200px] w-[495.05px] -rotate-[15deg] blur-[350px]",
              "-right-[80.43px] -bottom-[405.61px]",
              // Mobile
              "bg-secondary/30",
              // Desktop
              "lg:bg-secondary/20"
            )}
          />
        </div>
      </div>

      <div className="relative z-10 h-full w-full">
        <Grid className="h-full grid-rows-10">
          {/*************************************************************************/}
          {/*  POST TITLE AND META                                                 */}
          {/*************************************************************************/}
          <div className="gap-content col-span-full row-span-12 row-start-1 flex h-full flex-col justify-center">
            {/* Categories */}
            <div ref={contentRef} className={cn("translate-y-5 opacity-0")}>
              {categories && categories.length > 0 && (
                <div className="mb-6 text-sm text-white/80 uppercase">
                  {categories.map((category, index) => {
                    if (typeof category === "object" && category !== null) {
                      const { title: categoryTitle } = category
                      const titleToUse = categoryTitle || "Untitled category"
                      const isLast = index === categories.length - 1

                      return (
                        <React.Fragment key={index}>
                          {titleToUse}
                          {!isLast && <React.Fragment>, &nbsp;</React.Fragment>}
                        </React.Fragment>
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </div>

            {/* Title */}
            <h1 ref={titleRef} className={cn("!text-h2 text-white")}>
              {title}
            </h1>

            {/* Author Meta */}
            <div ref={metaRef} className={cn("translate-y-5 opacity-0")}>
              {hasAuthors && (
                <div className="flex flex-col gap-4 md:flex-row md:gap-16">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-white/60">Author</p>
                      <p className="text-white">{formatAuthors(populatedAuthors)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Grid>
      </div>

      {/*************************************************************************/}
      {/*  GRID LINES                                                           */}
      {/*************************************************************************/}
      <div className="pt-nav top-nav inset-x-section-x pointer-events-none absolute bottom-0 z-20">
        <GridLines />
      </div>
    </section>
  )
}
