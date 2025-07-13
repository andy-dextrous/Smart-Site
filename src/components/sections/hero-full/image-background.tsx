import { Media as PayloadMedia } from "@/payload/components/frontend/media"
import type { Media } from "@/payload/payload-types"
import { cn } from "@/utilities/ui"
import React from "react"

/****************************************************
 * Image Background Component
 ****************************************************/

export const ImageBackground: React.FC<{
  backgroundImage: string | Media | null | undefined
  containerRef: React.RefObject<HTMLDivElement | null>
}> = ({ backgroundImage, containerRef }) => {
  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="relative h-full w-full">
        {/* Top Down Fade */}
        <div
          className={cn(
            // Base styles
            "absolute inset-0 z-10",
            // Mobile
            "from-dark-950 to-dark-950 via-dark/20 bg-gradient-to-b via-50% to-100%"
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
            "absolute z-50 h-[700px] w-[800px] blur-[350px]",
            "-bottom-[148px] -left-[370px]",
            // Mobile
            "bg-primary/30",
            // Desktop
            "lg:bg-primary/60"
          )}
          data-speed="0.8"
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
            "lg:bg-secondary/40"
          )}
          data-speed="1.2"
        />
      </div>
    </div>
  )
}
