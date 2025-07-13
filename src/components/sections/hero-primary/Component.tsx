"use client"

import ArrowDownIcon from "@/components/icons/arrow-down"
import ArrowRightIcon from "@/components/icons/arrow-right"
import Envelope from "@/components/icons/envelope"
import SpeechBubble from "@/components/icons/speech-bubble"
import { Grid, GridLines } from "@/components/layout/grid"
import { Button } from "@/components/ui/button"
import { CMSLink } from "@/payload/components/frontend/cms-link"
import { Media as PayloadMedia } from "@/payload/components/frontend/media"
import type { HeroPrimaryBlock as HeroProps, Media } from "@/payload/payload-types"
import { gsap, useGSAP } from "@/providers/gsap"
import { cn } from "@/utilities/ui"
import React, { Fragment, useRef } from "react"

/****************************************************
 * Hero Content Component
 ****************************************************/

const HeroContent: React.FC<{
  content?: string
  buttons?: HeroProps["buttons"]
  buttonAppearance?: "default" | "outlineGradient"
}> = ({ content, buttons, buttonAppearance = "default" }) => {
  return (
    <Fragment>
      {content && <p className="font-light text-white">{content}</p>}

      {buttons && buttons.length > 0 && (
        <div className="space-y-4">
          {buttons.map((buttonItem, index) => (
            <CMSLink
              key={index}
              {...buttonItem.button.link}
              appearance={buttonAppearance}
              size="lg"
              className="w-full"
            >
              {buttonItem.button.link.label}
              <ArrowRightIcon className="!h-[14px] !w-[24px]" />
            </CMSLink>
          ))}
        </div>
      )}
    </Fragment>
  )
}

/****************************************************
 * Hero Scroll Indicator Component
 ****************************************************/

const HeroScrollIndicator: React.FC<{
  textRef: React.RefObject<HTMLDivElement | null>
}> = ({ textRef }) => {
  const arrowRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // Only arrow bounce animation here - continuous and independent
    const bounceTimeline = gsap.timeline({
      defaults: { duration: 0.7, ease: "power1.inOut" },
      yoyo: true,
      repeat: -1,
    })
    bounceTimeline.to(arrowRef.current, { y: 20 })
  })

  return (
    <div
      className={cn(
        // Base styles
        "flex flex-col items-center justify-end space-y-4 text-white",
        // Grid positioning
        "col-start-1 col-end-8 row-span-1 row-start-11",
        // Mobile
        "md:col-span-1 md:col-start-4 md:row-span-1 md:row-start-11",
        // Desktop
        "lg:col-span-1 lg:col-start-4 lg:row-span-1 lg:row-start-11"
      )}
    >
      <div ref={textRef} className="text-xs font-light tracking-[0.4em] uppercase">
        Scroll Down
      </div>
      <div ref={arrowRef}>
        <ArrowDownIcon />
      </div>
    </div>
  )
}

/****************************************************
 * Hero Component
 ****************************************************/

export const HeroPrimaryComponent: React.FC<HeroProps> = ({
  heading,
  content,
  backgroundImage,
  buttons,
  usp,
}) => {
  const timestampDateRef = useRef<HTMLDivElement>(null)
  const timestampTimeRef = useRef<HTMLDivElement>(null)
  const scrollTextRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const backgroundContainerRef = useRef<HTMLDivElement>(null)
  const uspRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    let isUAE = true

    function getCurrentTimes() {
      const now = new Date()

      // UAE Time (GMT+4)
      const uaeDate = new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Dubai",
      }).format(now)

      const uaeTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Dubai",
      }).format(now)

      // Ireland Time (GMT+0/+1)
      const irelandDate = new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Europe/Dublin",
      }).format(now)

      const irelandTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Europe/Dublin",
      }).format(now)

      return {
        uae: {
          date: uaeDate,
          time: `${uaeTime} (GMT+4)`,
        },
        ireland: {
          date: irelandDate,
          time: `${irelandTime} (GMT+0)`,
        },
      }
    }

    function animateElements() {
      const times = getCurrentTimes()
      const current = isUAE ? times.uae : times.ireland

      // Animate timestamp
      gsap.to(timestampDateRef.current, {
        duration: 2,
        scrambleText: {
          text: current.date,
          chars: "lowerCase",
          newClass: "text-sm text-white",
        },
      })

      gsap.to(timestampTimeRef.current, {
        duration: 2,
        scrambleText: {
          text: current.time,
          chars: "lowerCase",
          newClass: "text-sm text-white",
        },
      })

      // Animate scroll text
      gsap.to(scrollTextRef.current, {
        duration: 2,
        scrambleText: {
          text: "{original}",
          chars: "lowerCase",
          newClass: "text-xs font-light tracking-[0.4em] uppercase text-white",
        },
      })

      isUAE = !isUAE
    }

    // Set initial timestamp
    const initialTimes = getCurrentTimes()
    if (timestampDateRef.current && timestampTimeRef.current) {
      timestampDateRef.current.textContent = initialTimes.uae.date
      timestampTimeRef.current.textContent = initialTimes.uae.time
    }

    // Title reveal animation
    gsap.effects.titleReveal(titleRef.current, {
      duration: 1.3,
      stagger: 0.3,
      revertOnComplete: true,
    })

    // Usp reveal animation
    gsap.effects.titleReveal(uspRef.current, {
      trigger: {
        trigger: uspRef.current,
        start: "top 90%",
        end: "bottom 70%",
        scrub: false,
      },
      revertOnComplete: true,
    })

    // Gentle continuous zoom on background image
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

    // Single master timeline controlling both animations
    const masterTimeline = gsap.timeline({
      repeat: -1,
      repeatDelay: 8, // 10 seconds total (2 second animation + 8 second delay)
    })

    masterTimeline.call(animateElements)
  })

  return (
    <section
      className={cn(
        // Base styles
        "bg-dark relative flex w-full flex-col justify-between overflow-hidden py-0",
        // Mobile
        "h-auto",
        // Desktop
        "lg:h-[160vh]"
      )}
    >
      <div className="relative h-screen w-full">
        <Grid className="h-full grid-rows-10 pb-8">
          {/*************************************************************************/}
          {/*  MAIN HERO CONTENT - TITLE AND CTA BUTTONS                           */}
          {/*************************************************************************/}
          <div
            className={cn(
              // Base styles
              "gap-content flex h-full flex-col justify-center",
              // Mobile
              "col-span-full row-span-12 row-start-1 pr-6 pl-6",
              // Tablet
              "md:col-span-5 md:col-start-2 md:pr-0 md:pl-0",
              // Desktop
              "lg:col-span-5 lg:col-start-2 lg:row-span-10",
              // XL
              "xl:col-span-3 xl:col-start-2"
            )}
          >
            <h1 ref={titleRef} className="title-hidden max-w-[10ch] text-white">
              {heading || "Strategy Powered by Technology"}
            </h1>
            <div
              className={cn(
                // Base styles
                "gap-content flex flex-col items-start justify-center",
                // XL
                "xl:hidden"
              )}
            >
              <HeroContent content={content} buttons={buttons} />
            </div>
          </div>

          {/*************************************************************************/}
          {/*  SECONDARY CONTENT AREA - DESKTOP LAYOUT                             */}
          {/*************************************************************************/}
          <div
            className={cn(
              // Base styles
              "hidden flex-col justify-center space-y-12",
              // Mobile
              "col-span-full row-span-4 row-start-1",
              // Tablet
              "md:col-span-5 md:col-start-2 md:row-span-3 md:row-start-6",
              // Small Laptops
              "lg:col-span-2 lg:col-start-6 lg:row-span-6 lg:row-start-4",
              // Large Laptops +
              "xl:col-start-5 xl:flex"
            )}
          >
            <HeroContent
              content={content}
              buttons={buttons}
              buttonAppearance="outlineGradient"
            />
          </div>

          {/*************************************************************************/}
          {/*  TIMESTAMP DISPLAY - DYNAMIC TIME ZONES                              */}
          {/*************************************************************************/}
          <div
            className={cn(
              // Base styles
              "z-10 hidden items-end text-sm text-white",
              // Grid positioning
              "col-span-1 col-start-1 row-span-2 row-start-10",
              // XL
              "xl:flex"
            )}
          >
            <div>
              <div ref={timestampDateRef}>Mon, 16th May 2025</div>
              <div ref={timestampTimeRef}>02:00 AM (GMT+4)</div>
            </div>
          </div>

          {/*************************************************************************/}
          {/*  SCROLL INDICATOR WITH ANIMATION                                      */}
          {/*************************************************************************/}
          <HeroScrollIndicator textRef={scrollTextRef} />

          {/*************************************************************************/}
          {/*  CONTACT ACTION BUTTONS                                               */}
          {/*************************************************************************/}
          <div
            className={cn(
              // Base styles
              "hidden items-end justify-end space-x-4",
              // Grid positioning
              "col-span-3 col-start-7 row-span-2 row-start-10",
              // Desktop
              "lg:flex"
            )}
          >
            <Button icon variant="ghost">
              <Envelope className="!h-6 !w-6" />
            </Button>
            <Button icon variant="ghost">
              <SpeechBubble className="!h-6 !w-6" />
            </Button>
          </div>
        </Grid>
      </div>

      {/*************************************************************************/}
      {/*  USP SECTION - UNIQUE SELLING PROPOSITION                             */}
      {/*************************************************************************/}
      <Grid className="h-auto grid-rows-[1fr_auto_auto] py-8">
        <div
          className={cn(
            // Base styles
            "mb-section-y flex items-center border-l-1 border-white",
            // Mobile
            "col-span-7 col-start-1 mt-20",
            // Tablet
            "md:col-span-5 md:col-start-2 md:mt-0",
            // Small Laptops
            "lg:col-span-2 lg:col-start-6 lg:mt-0",
            // Desktop
            "lg:col-span-1 lg:col-start-4 lg:mt-0"
          )}
        >
          <p ref={uspRef} className="pr-10 pl-6 text-white/90 lg:pl-12">
            {usp}
          </p>
        </div>
      </Grid>

      {/*************************************************************************/}
      {/*  BACKGROUND IMAGE AND EFFECTS                                          */}
      {/*************************************************************************/}
      <Background
        backgroundImage={backgroundImage as Media}
        containerRef={backgroundContainerRef}
      />
    </section>
  )
}

const Background = ({
  backgroundImage,
  containerRef,
}: {
  backgroundImage: Media | null
  containerRef: React.RefObject<HTMLDivElement | null>
}) => {
  return (
    <Fragment>
      <div className="pt-nav top-nav inset-x-section-x pointer-events-none absolute bottom-0">
        <GridLines />
      </div>
      <div
        ref={containerRef}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="relative h-full w-full">
          {/* Top Down Fade */}
          <div
            className={cn(
              // Base styles
              "from-dark-950 absolute inset-0 z-10 bg-gradient-to-b to-transparent",
              // Mobile
              "from-10% to-100%",
              // Desktop
              "lg:from-30% lg:to-60%"
            )}
          />

          {/* Background Image */}
          <div
            className="absolute inset-x-0 bottom-0 size-full"
            data-id="hero-background-image"
            data-speed="0.9"
          >
            <PayloadMedia
              resource={backgroundImage}
              alt="Hero Background"
              fill
              priority
              imgClassName={cn(
                // Base styles
                "absolute inset-0 h-full w-full object-cover",
                // Mobile
                "object-[50%_50%]",
                // Desktop
                "lg:object-[80%_50%]"
              )}
              size="100vw"
              loading="eager"
            />
          </div>

          {/* Spotlight 1 - Royal Purple Spotlight */}
          <div
            className={cn(
              // Base styles
              "absolute z-5 h-[700px] w-[700px] blur-[350px]",
              "-bottom-[148px] -left-[370px]",
              // Mobile
              "bg-primary/30",
              // Desktop
              "lg:bg-primary/70"
            )}
            data-speed="0.8"
          />

          {/* Spotlight 2 - Chrysler Blue Spotlight */}
          <div
            className={cn(
              // Base styles
              "absolute z-5 h-[1200px] w-[495.05px] -rotate-[15deg] blur-[350px]",
              "-right-[80.43px] -bottom-[405.61px]",
              // Mobile
              "bg-secondary/30",
              // Desktop
              "lg:bg-secondary/60"
            )}
            data-speed="1.2"
          />
        </div>
      </div>
    </Fragment>
  )
}
