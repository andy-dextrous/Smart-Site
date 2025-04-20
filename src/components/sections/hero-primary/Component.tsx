"use client"

import { Button } from "@/components/ui/button"
import { CMSLink } from "@/payload/components/cms-link"
import type { HeroPrimaryBlock as HeroProps } from "@/payload/payload-types"
import { gsap, useGSAP } from "@/providers/gsap"
import Image from "next/image"
import React, { useRef } from "react"

/****************************************************
 * Hero Component
 ****************************************************/

export const HeroPrimaryComponent: React.FC<HeroProps> = ({
  heading,
  content,
  backgroundImage,
  buttons,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const bgWrapperRef = useRef<HTMLDivElement>(null)
  const bgImageMotionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const buttonRefs = useRef<HTMLButtonElement[]>([])

  buttonRefs.current = []

  const getBgUrl = (): string | null => {
    if (!backgroundImage) return null
    return typeof backgroundImage === "string"
      ? backgroundImage
      : backgroundImage.url || null
  }

  useGSAP(
    () => {
      gsap.set(
        [
          titleRef.current,
          descriptionRef.current,
          ...buttonRefs.current,
          bgWrapperRef.current,
        ].filter(Boolean),
        { opacity: 0 }
      )

      /* timeline */
      const tl = gsap.timeline()

      /* background fade‑in */
      tl.fromTo(
        bgWrapperRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: 0.2, ease: "power2.inOut" }
      )

      /* subtle perpetual zoom */
      tl.to(
        bgImageMotionRef.current,
        { scale: 1.2, duration: 20, yoyo: true, repeat: -1, ease: "none" },
        0
      )

      /* title */
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power1.inOut" },
        0.4
      )

      /* description */
      tl.fromTo(
        descriptionRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power1.out" },
        0.65
      )

      /* buttons */
      tl.fromTo(
        buttonRefs.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power1.inOut", stagger: 0.05 },
        0.75
      )
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      className="relative z-10 flex h-[calc(100vh-var(--nav-height))] items-center overflow-hidden bg-black"
    >
      <div ref={bgWrapperRef} className="absolute inset-0 z-0 overflow-hidden">
        <div className="relative h-full w-full">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-purple-950/70 lg:from-purple-950 ltr:to-purple-950/60 lg:ltr:bg-gradient-to-r lg:ltr:to-purple-950/10 rtl:to-purple-950/80 lg:rtl:bg-gradient-to-l lg:rtl:to-purple-950/10" />

          <div className="bg-radial-home-hero absolute inset-y-0 left-0 z-10 w-[200%]" />

          <div ref={bgImageMotionRef} className="absolute inset-0 rtl:scale-x-[-1]">
            <Image
              src={getBgUrl() || "/assets/images/hero-default.jpg"}
              alt={heading || "Hero Background"}
              className="absolute inset-0 h-full w-full object-cover object-[80%_50%]"
              fill
              priority
              quality={100}
              sizes="100vw"
              loading="eager"
            />
          </div>
        </div>
      </div>

      <div className="relative z-20 container">
        <div className="gap-content-lg flex w-full flex-col items-start text-white">
          <div className="lg:gap-content flex flex-col gap-6">
            <h1 ref={titleRef} className="w-full text-white md:max-w-[20ch]">
              {heading}
            </h1>

            <p ref={descriptionRef} className="max-w-[70ch] text-white">
              {content}
            </p>
            <div className="flex gap-4">
              {buttons?.map(({ button }, i) => (
                <CMSLink key={i} {...button.link} className="hover:cursor-pointer">
                  <Button
                    ref={el => {
                      if (el) buttonRefs.current[i] = el
                    }}
                    variant={button.buttonType === "primary" ? "default" : "secondary"}
                    size="lg"
                  >
                    {button.link.label}
                  </Button>
                </CMSLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
