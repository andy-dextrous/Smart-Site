import Envelope from "@/components/icons/envelope"
import SpeechBubble from "@/components/icons/speech-bubble"
import { Button } from "@/components/ui/button"
import type { HeroFullBlock as HeroProps } from "@/payload/payload-types"
import { tv } from "tailwind-variants"
import React from "react"
import { HeroContent } from "./hero-content"
import { TimestampDisplay } from "./timestamp-display"
import { cn } from "@/utilities/ui"

/****************************************************
 * Hero Layout Variants Configuration
 ****************************************************/

const heroLayoutVariants = tv({
  slots: {
    titleContainer: "gap-content flex h-full flex-col justify-center",
    title: "text-h1",
    content: "gap-content flex flex-col items-start justify-center xl:hidden",
    secondaryContent: "hidden flex-col justify-center space-y-12 xl:flex",
    timestamp:
      "z-10 col-span-1 col-start-1 row-span-2 row-start-9 hidden items-end xl:flex",
    contactButtons:
      "col-span-3 col-start-7 row-span-2 row-start-9 hidden items-end justify-end space-x-4 lg:flex",
  },
  variants: {
    size: {
      full: {
        title: "",
      },
      md: {
        title: "!text-h2",
      },
      sm: {
        title: "!text-h2",
      },
    },
    placement: {
      left: {
        titleContainer:
          "col-span-full row-span-12 row-start-1 pr-6 pl-6 md:col-span-5 md:col-start-2 md:pr-0 md:pl-0 lg:col-span-5 lg:col-start-1 lg:row-span-5 lg:row-start-4 xl:col-span-4 xl:col-start-1",
        title: "",
        secondaryContent:
          "col-span-full row-span-4 row-start-1 md:col-span-5 md:col-start-2 md:row-span-3 md:row-start-6 lg:col-span-2 lg:col-start-6 lg:row-span-6 lg:row-start-1 lg:justify-start xl:col-start-5",
      },
      center: {
        titleContainer: "",
        title: "",
      },
    },
    colorScheme: {
      "background-image": {
        title: "text-white",
        timestamp: "text-white",
      },
      dark: {
        title: "text-white",
        timestamp: "text-white",
      },
      white: {
        title: "text-dark",
        timestamp: "text-dark",
      },
      primary: {
        title: "text-white",
        timestamp: "text-white",
      },
      secondary: {
        title: "text-white",
        timestamp: "text-white",
      },
    },
  },
  defaultVariants: {
    size: "full",
    placement: "left",
    colorScheme: "background-image",
  },
})

/****************************************************
 * Hero Layout Component
 ****************************************************/

export const HeroLayout: React.FC<{
  size: HeroProps["size"]
  colorScheme: HeroProps["colorScheme"]
  titleRef: React.RefObject<HTMLHeadingElement | null>
  parsedHeading: React.ReactNode
  fallbackHeading?: string
  content?: string
  buttons?: HeroProps["buttons"]
  timestampDateRef: React.RefObject<HTMLDivElement | null>
  timestampTimeRef: React.RefObject<HTMLDivElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  secondaryContentRef: React.RefObject<HTMLDivElement | null>
  timestampRef: React.RefObject<HTMLDivElement | null>
  contactButtonsRef: React.RefObject<HTMLDivElement | null>
}> = ({
  size,
  colorScheme,
  titleRef,
  parsedHeading,
  fallbackHeading,
  content,
  buttons,
  timestampDateRef,
  timestampTimeRef,
  contentRef,
  secondaryContentRef,
  timestampRef,
  contactButtonsRef,
}) => {
  // Create slots from variants
  const {
    titleContainer,
    title,
    content: contentSlot,
    secondaryContent,
    timestamp,
    contactButtons,
  } = heroLayoutVariants({ size, colorScheme, placement: "left" })

  return (
    <>
      {/*************************************************************************/}
      {/*  MAIN HERO CONTENT - TITLE AND CTA BUTTONS                           */}
      {/*************************************************************************/}
      <div className={titleContainer()}>
        <h1 ref={titleRef} className={cn("title-hidden", title())}>
          {parsedHeading || fallbackHeading || "Strategy Powered by Technology"}
        </h1>
        <div ref={contentRef} className={cn("translate-y-5 opacity-0", contentSlot())}>
          <HeroContent content={content} buttons={buttons} colorScheme={colorScheme} />
        </div>
      </div>

      {/*************************************************************************/}
      {/*  SECONDARY CONTENT AREA - DESKTOP LAYOUT                             */}
      {/*************************************************************************/}
      <div
        ref={secondaryContentRef}
        className={cn("translate-y-5 opacity-0", secondaryContent())}
      >
        <HeroContent
          content={content}
          buttons={buttons}
          buttonAppearance="outlineGradient"
          colorScheme={colorScheme}
        />
      </div>

      {/*************************************************************************/}
      {/*  TIMESTAMP DISPLAY - DYNAMIC TIME ZONES                              */}
      {/*************************************************************************/}
      <div ref={timestampRef} className={cn("translate-y-5 opacity-0", timestamp())}>
        <TimestampDisplay
          timestampDateRef={timestampDateRef}
          timestampTimeRef={timestampTimeRef}
        />
      </div>

      {/*************************************************************************/}
      {/*  CONTACT ACTION BUTTONS                                               */}
      {/*************************************************************************/}
      <div
        ref={contactButtonsRef}
        className={cn("translate-y-5 opacity-0", contactButtons())}
      >
        <Button icon variant="ghost">
          <Envelope className="!h-6 !w-6" />
        </Button>
        <Button icon variant="ghost">
          <SpeechBubble className="!h-6 !w-6" />
        </Button>
      </div>
    </>
  )
}
