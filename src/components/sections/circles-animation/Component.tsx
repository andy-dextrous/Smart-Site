"use client"

import RichText from "@/payload/components/frontend/rich-text"
import type { CirclesAnimationBlock } from "@/payload/payload-types"
import { gsap, useGSAP } from "@/providers/gsap"
import { SplitText } from "gsap/SplitText"
import { parseHeadingGradient } from "@/components/heading-gradient"
import React, { useRef } from "react"

/*************************************************************************/
/*  CIRCLES ANIMATION COMPONENT
/*************************************************************************/

const CirclesAnimationComponent: React.FC<CirclesAnimationBlock> = props => {
  const { title, description, leftCircleWords, rightCircleWords, bottomText } = props

  const sectionRef = useRef<HTMLDivElement>(null)
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const textLeftRef = useRef<HTMLDivElement>(null)
  const textRightRef = useRef<HTMLDivElement>(null)
  const textBottomRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const paragraphRef = useRef<HTMLParagraphElement>(null)

  // Parse title and convert span tags to gradient elements
  const parsedTitle = parseHeadingGradient(title)

  useGSAP(() => {
    /*********************************************************
     * Constants
     ********************************************************/

    const TOTAL_DURATION = 5 // Can be any number, is used to make everything relative to it. Will be replaced by scrubbed duration
    const ROTATIONS_DURING_DRAW = 3 // Number of rotations while circles are being drawn
    const ANIMATION_START_TIME = 0.7 // When to start the animation (when top of section is 70% from the top of the viewport)
    const ANIMATION_DURATION = 3 // How long to pin (3 = 3x viewport height of scrolling)
    const PIN_DURATION = 2.3 // How long to pin the sction. Needs to account for animation headstart

    const DRAWSVG_START_TIME = 0 // Start revealing circles 14% into the animation
    const DRAWSVG_DURATION = TOTAL_DURATION * 0.6 // when circles finish drawing
    const CIRCLES_SPLIT_START = TOTAL_DURATION * 0.15 // at this time, circles start to split
    const CIRCLE_MOVEMENT_DURATION = DRAWSVG_DURATION // circles take same time as drawing to return
    const TEXT_APPEAR_TIME = TOTAL_DURATION * 0.3
    const TEXT_FADE_DURATION = TOTAL_DURATION * 0.2
    const TEXT_SCRAMBLE_DURATION = TOTAL_DURATION * 0.48
    const TEXT_END_STAGGER = 0.5 // Delay between each p element finishing
    const BOTTOM_TEXT_APPEAR_TIME = TOTAL_DURATION * 0.5 // Bottom text appears later
    const BOTTOM_TEXT_SCRAMBLE_DURATION = TOTAL_DURATION * 0.4 // Bottom text scramble duration
    const INSIDE_FADE_DURATION = TOTAL_DURATION * 0.4
    const END_DELAY = 0.5 // Fixed delay after inside animation
    const INSIDE_APPEAR_TIME = TOTAL_DURATION - INSIDE_FADE_DURATION - END_DELAY
    const TRAIL_FADE_DURATION = TOTAL_DURATION * 0.2

    const TITLE_START_TIME = 0
    const TITLE_REVEAL_DURATION = TOTAL_DURATION * 0.3
    const TITLE_LINE_STAGGER = 0.2
    const PARAGRAPH_START_TIME = TOTAL_DURATION * 0.4 // Paragraph appears after title starts
    const PARAGRAPH_FADE_DURATION = TOTAL_DURATION * 0.4 // Paragraph fade duration

    // Ease constants
    const DRAWSVG_EASE = "power1.inOut"
    const ROTATION_EASE = "none"
    const CIRCLE_MOVEMENT_EASE = "power3.inOut"
    const TEXT_FADE_EASE = "power1.out"
    const INSIDE_FADE_EASE = "power4.inOut"
    const TRAIL_FADE_EASE = "power4.out"
    const TITLE_REVEAL_EASE = "power3.out"
    const PARAGRAPH_FADE_EASE = "power1.out"

    /*********************************************************
     * Start by hiding all elements
     ********************************************************/

    gsap.set(
      [
        "#circle-right-trails circle",
        "#circle-left-trails circle",
        "#inside",
        textLeftRef.current,
        textRightRef.current,
        textBottomRef.current,
        titleRef.current,
        paragraphRef.current,
      ],
      {
        autoAlpha: 0,
      }
    )

    /*********************************************************
     *  Calculate dynamic positioning based on circle centers
     ********************************************************/

    // Get the actual circle center positions from the SVG elements
    const rightCircleElement = svgContainerRef.current?.querySelector(
      "#circle-right .lead-circle"
    )
    const leftCircleElement = svgContainerRef.current?.querySelector(
      "#circle-left .lead-circle"
    )

    const rightCircleCenter = parseFloat(rightCircleElement?.getAttribute("cx") || "0")
    const leftCircleCenter = parseFloat(leftCircleElement?.getAttribute("cx") || "0")

    // Calculate the distance between centers
    const totalDistance = rightCircleCenter - leftCircleCenter

    // Each circle should move half the distance toward the center
    const moveDistance = totalDistance / 2

    /*********************************************************
     *  Then position primary circles on top of each other
     ********************************************************/

    gsap.set("#circle-right #circle-right-group", {
      x: -moveDistance, // Move left by half distance
    })

    gsap.set("#circle-left #circle-left-group", {
      x: moveDistance, // Move right by half distance
    })

    /*********************************************************
     *  Elements are in place, now show the container
     ********************************************************/

    gsap.set(svgContainerRef.current, {
      autoAlpha: 1,
    })

    /*********************************************************
     *  Now set up drawSVG for the trails
     ********************************************************/

    gsap.set(["#circle-right .lead-circle", "#circle-left .lead-circle"], {
      drawSVG: "0%",
    })

    /*********************************************************
     *  Set the transform origin for the groups
     *  This is needed for the rotation to work
     ********************************************************/

    gsap.set(["#circle-left-group", "#circle-right-group"], {
      transformOrigin: "center",
    })

    gsap.set("#circle-left-group", {
      rotation: 180,
    })

    /*********************************************************
     * Master Timeline with Scroll Control
     ********************************************************/

    const tl = gsap.timeline({
      id: "circles-animation",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: `top ${ANIMATION_START_TIME * 100}%`,
        end: `+=${ANIMATION_DURATION * 100}%`,
        scrub: 1,
      },
    })

    /*********************************************************
     *  Pin the section
     ********************************************************/

    gsap.timeline({
      id: "circles-animation-pin",
      scrollTrigger: {
        trigger: sectionRef.current,
        pin: sectionRef.current,
        start: "top top",
        end: `+=${PIN_DURATION * 100}%`,
        scrub: true,
        anticipatePin: 1,
      },
    })

    /*********************************************************
     * Title and Paragraph Animations
     ********************************************************/

    // Create SplitText for title with masking
    const titleSplit = SplitText.create(titleRef.current, {
      type: "lines",
      mask: "lines",
      linesClass: "title-line",
    })

    titleSplit.lines.forEach((line: Element, index: number) => {
      tl.set(line, {
        autoAlpha: 0,
      })
    })

    // Make title element visible (parent needs to be visible for children to show)
    tl.set(
      titleRef.current,
      {
        autoAlpha: 1,
      },
      TITLE_START_TIME
    )

    // Animate title lines from left with mask reveal
    titleSplit.lines.forEach((line: Element, index: number) => {
      tl.fromTo(
        line,
        {
          x: -100,
          autoAlpha: 0,
        },
        {
          x: 0,
          autoAlpha: 1,
          duration: TITLE_REVEAL_DURATION,
          ease: TITLE_REVEAL_EASE,
        },
        TITLE_START_TIME + index * TITLE_LINE_STAGGER
      )
    })

    // Animate paragraph fade in
    tl.to(
      paragraphRef.current,
      {
        autoAlpha: 1,
        duration: PARAGRAPH_FADE_DURATION,
        ease: PARAGRAPH_FADE_EASE,
      },
      PARAGRAPH_START_TIME
    )

    /*********************************************************
     *  Now ready to animate
     ********************************************************/

    tl.to(
      ["#circle-left circle", "#circle-right circle"],
      {
        drawSVG: "0 100%",
        duration: DRAWSVG_DURATION,
        ease: DRAWSVG_EASE,
      },
      DRAWSVG_START_TIME
    )

    tl.to(
      "#circle-left-group, #circle-right-group",
      {
        rotation: `+=${360 * ROTATIONS_DURING_DRAW}`,
        duration: DRAWSVG_DURATION,
        ease: ROTATION_EASE,
      },
      DRAWSVG_START_TIME
    )

    /*********************************************************
     *  Calculate trailing circle reveal times
     *
     *  Calculate when left edge of leading circle reaches left edge of trailing circle
     *  Leading circle's left edge starts at: leftCircleCenter + moveDistance - radius
     *  Trailing circle's left edge is at: trailCx - trailRadius
     *  Distance leading circle needs to travel to reach this trailing circle:
     *
     ********************************************************/

    const leftTrails = Array.from(document.querySelectorAll("#circle-left-trails circle"))
    const rightTrails = Array.from(
      document.querySelectorAll("#circle-right-trails circle")
    )

    leftTrails.forEach(trail => {
      const trailCx = parseFloat(trail.getAttribute("cx") || "0")
      const trailRadius = parseFloat(trail.getAttribute("r") || "0")
      const trailOpacity = Number(trail.getAttribute("data-opacity"))

      const leadingCircleLeftEdgeStart = leftCircleCenter + moveDistance - trailRadius
      const trailLeftEdge = trailCx - trailRadius
      const distanceToTrail = leadingCircleLeftEdgeStart - trailLeftEdge

      // Convert to fraction of total movement
      const movementProgress = distanceToTrail / moveDistance
      const clampedProgress = Math.max(0, Math.min(1, movementProgress))
      const revealTime = CIRCLES_SPLIT_START + clampedProgress * CIRCLE_MOVEMENT_DURATION

      tl.to(
        trail,
        {
          autoAlpha: trailOpacity,
          duration: TRAIL_FADE_DURATION,
          ease: TRAIL_FADE_EASE,
        },
        revealTime
      )
    })

    rightTrails.forEach(trail => {
      const trailCx = parseFloat(trail.getAttribute("cx") || "0")
      const trailRadius = parseFloat(trail.getAttribute("r") || "0")
      const trailOpacity = Number(trail.getAttribute("data-opacity"))

      // Calculate when right edge of leading circle reaches right edge of trailing circle
      // Leading circle's right edge starts at: rightCircleCenter - moveDistance + radius
      // Trailing circle's right edge is at: trailCx + trailRadius
      // Distance leading circle needs to travel to reach this trailing circle:
      const leadingCircleRightEdgeStart = rightCircleCenter - moveDistance + trailRadius
      const trailRightEdge = trailCx + trailRadius
      const distanceToTrail = trailRightEdge - leadingCircleRightEdgeStart

      // Convert to fraction of total movement
      const movementProgress = distanceToTrail / moveDistance
      const clampedProgress = Math.max(0, Math.min(1, movementProgress))
      const revealTime = CIRCLES_SPLIT_START + clampedProgress * CIRCLE_MOVEMENT_DURATION

      tl.to(
        trail,
        {
          autoAlpha: trailOpacity,
          duration: TRAIL_FADE_DURATION,
          ease: TRAIL_FADE_EASE,
        },
        revealTime
      )
    })

    /*********************************************************
     *  Move circles back to their original positions
     ********************************************************/

    tl.to(
      ["#circle-left #circle-left-group", "#circle-right #circle-right-group"],
      {
        x: 0,
        duration: CIRCLE_MOVEMENT_DURATION,
        ease: CIRCLE_MOVEMENT_EASE,
      },
      CIRCLES_SPLIT_START
    )

    /*********************************************************
     *  Reveal text and scramble
     ********************************************************/

    tl.to(
      textLeftRef.current,
      {
        autoAlpha: 1,
        duration: TEXT_FADE_DURATION,
        ease: TEXT_FADE_EASE,
      },
      TEXT_APPEAR_TIME
    )

    tl.to(
      textRightRef.current,
      {
        autoAlpha: 1,
        duration: TEXT_FADE_DURATION,
        ease: TEXT_FADE_EASE,
      },
      TEXT_APPEAR_TIME
    )

    // Bottom text fade-in
    tl.to(
      textBottomRef.current,
      {
        autoAlpha: 1,
        duration: TEXT_FADE_DURATION,
        ease: TEXT_FADE_EASE,
      },
      BOTTOM_TEXT_APPEAR_TIME
    )

    // Left text scrambling
    const leftParagraphs = Array.from(textLeftRef.current?.querySelectorAll("p") || [])
    leftParagraphs.forEach((p, index) => {
      tl.to(
        p,
        {
          duration: TEXT_SCRAMBLE_DURATION,
          scrambleText: {
            text: "{original}",
            chars: "lowerCase",
            newClass: "text-white",
          },
        },
        TEXT_APPEAR_TIME + index * TEXT_END_STAGGER
      )
    })

    // Right text scrambling
    const rightParagraphs = Array.from(textRightRef.current?.querySelectorAll("p") || [])
    rightParagraphs.forEach((p, index) => {
      tl.to(
        p,
        {
          duration: TEXT_SCRAMBLE_DURATION,
          scrambleText: {
            text: "{original}",
            chars: "lowerCase",
            newClass: "text-white",
          },
        },
        TEXT_APPEAR_TIME + index * TEXT_END_STAGGER
      )
    })

    // Bottom text scrambling
    const bottomParagraphs = Array.from(
      textBottomRef.current?.querySelectorAll("p") || []
    )
    bottomParagraphs.forEach((p, index) => {
      tl.to(
        p,
        {
          duration: BOTTOM_TEXT_SCRAMBLE_DURATION,
          scrambleText: {
            text: "{original}",
            chars: "lowerCase",
            newClass: "text-white",
          },
        },
        BOTTOM_TEXT_APPEAR_TIME + index * TEXT_END_STAGGER
      )
    })

    /*********************************************************
     *  Now reveal the inside
     ********************************************************/

    tl.to(
      "#inside",
      {
        autoAlpha: 1,
        duration: INSIDE_FADE_DURATION,
        ease: INSIDE_FADE_EASE,
      },
      INSIDE_APPEAR_TIME
    )
  })

  return (
    <section
      className="bg-dark side-border-light flicker-mask-top flex min-h-screen items-center"
      ref={sectionRef}
    >
      <div className="container-md flex h-full w-full flex-col items-center lg:flex-row lg:items-center">
        <div className="order-2 flex w-full flex-col gap-1 px-4 text-center lg:order-1 lg:flex-5 lg:gap-10 lg:px-0 lg:text-left">
          <h2 ref={titleRef} className="text-white">
            {parsedTitle}
          </h2>
          <div ref={paragraphRef} className="mx-auto max-w-[460px] lg:mx-0">
            <RichText
              data={description}
              enableGutter={false}
              className="[&>p]:text-white"
            />
          </div>
        </div>
        <div className="order-1 w-full lg:order-2 lg:flex-7">
          <div
            ref={svgContainerRef}
            className="mt-nav relative flex w-full flex-1 items-center justify-center px-8 pt-8 pb-8 opacity-0 lg:mt-0 lg:h-full lg:px-0 lg:pt-0 lg:pb-0"
          >
            <div className="flex h-full w-full flex-col gap-6 lg:gap-10">
              <div className="relative">
                <SVGComponent />
                <div className="absolute inset-0 grid h-full w-full grid-cols-12 grid-rows-12">
                  <div
                    ref={textLeftRef}
                    className="gap-content col-span-3 col-start-2 row-span-6 row-start-4 flex flex-col items-center justify-center"
                  >
                    {leftCircleWords?.map((wordObj, index) => (
                      <p key={index} className="text-white">
                        {wordObj.word}
                      </p>
                    ))}
                  </div>
                  <div
                    ref={textRightRef}
                    className="gap-content col-span-3 col-start-9 row-span-6 row-start-4 flex flex-col items-center justify-center"
                  >
                    {rightCircleWords?.map((wordObj, index) => (
                      <p key={index} className="text-white">
                        {wordObj.word}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              <div ref={textBottomRef} className="flex w-full justify-center">
                <p className="text-white">{bottomText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CirclesAnimationComponent

const SVGComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    id="Layer_2"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 981.74 631.55"
    {...props}
  >
    <defs>
      <linearGradient
        id="circles-aniimation-linear-gradient"
        x1={350.68}
        y1={396.03}
        x2={629.6}
        y2={396.03}
        gradientTransform="translate(0 712.13) scale(1 -1)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#40f" />
        <stop offset={1} stopColor="#7944b3" />
      </linearGradient>
      <mask
        id="mask"
        x={430.15}
        y={211.5}
        width={119.57}
        height={209.19}
        maskUnits="userSpaceOnUse"
      >
        <g id="mask0_691_1574">
          <path
            className="fill-white"
            d="M481.33,341.3l68.39,79.4-119.55-55.94,51.17-23.46ZM481.47,341.23l49.73-22.8-1.86-106.93-47.89,129.73h.02Z"
          />
        </g>
      </mask>
    </defs>

    <g id="circle-reveal">
      {/* Circle Right */}
      <g id="circle-right">
        <g id="circle-right-group">
          <circle
            className="stroke-primary lead-circle transform-origin-center fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={664.46}
            cy={316.1}
            r={313.19}
          />
        </g>
        <g id="circle-right-trails">
          <circle
            className="stroke-primary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={580.78}
            cy={316.1}
            r={313.19}
            data-opacity={0.1}
          />
          <circle
            className="stroke-primary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={594.73}
            cy={316.1}
            r={313.19}
            data-opacity={0.2}
          />
          <circle
            className="stroke-primary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={608.68}
            cy={316.1}
            r={313.19}
            data-opacity={0.3}
          />
          <circle
            className="stroke-primary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={622.62}
            cy={316.1}
            r={313.19}
            data-opacity={0.4}
          />
          <circle
            className="stroke-primary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={636.57}
            cy={316.1}
            r={313.19}
            data-opacity={0.5}
          />
          <circle
            className="stroke-primary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={650.51}
            cy={316.1}
            r={313.19}
            data-opacity={0.6}
          />
        </g>
      </g>
      {/* Circle Left */}
      <g id="circle-left">
        <g id="circle-left-group">
          <circle
            className="stroke-secondary lead-circle fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={315.81}
            cy={316.1}
            r={313.19}
          />
        </g>
        <g id="circle-left-trails">
          <circle
            className="stroke-secondary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={329.76}
            cy={316.1}
            r={313.19}
            data-opacity={0.6}
          />
          <circle
            className="stroke-secondary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={343.7}
            cy={316.1}
            r={313.19}
            data-opacity={0.5}
          />
          <circle
            className="stroke-secondary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={357.65}
            cy={316.1}
            r={313.19}
            data-opacity={0.4}
          />
          <circle
            className="stroke-secondary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={371.6}
            cy={316.1}
            r={313.19}
            data-opacity={0.3}
          />
          <circle
            className="stroke-secondary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={385.54}
            cy={316.1}
            r={313.19}
            data-opacity={0.2}
          />
          <circle
            className="stroke-secondary isolate fill-none"
            style={{ strokeWidth: "1.19px" }}
            cx={399.49}
            cy={316.1}
            r={313.19}
            data-opacity={0.1}
          />
        </g>
      </g>
      {/* Inside */}
      <g id="inside">
        <path
          style={{ fill: "url(#circles-aniimation-linear-gradient)" }}
          d="M490.14,55.16c84.09,56.29,139.46,152.15,139.46,260.94s-55.37,204.65-139.46,260.94c-84.09-56.29-139.46-152.15-139.46-260.94s55.37-204.65,139.46-260.94Z"
        />
        <g style={{ mask: "url(#mask)" }}>
          <g id="logomark">
            <path
              className="fill-white"
              d="M549.71,211.5h-119.55v209.19h119.55v-209.19Z"
            />
          </g>
        </g>
      </g>
      {/* Frame */}
      <rect id="frame" className="fill-none" width={981.74} height={631.55} />
    </g>
  </svg>
)
