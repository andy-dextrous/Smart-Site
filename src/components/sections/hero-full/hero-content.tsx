import ArrowRightIcon from "@/components/icons/arrow-right"
import { CMSLink } from "@/payload/components/frontend/cms-link"
import type { HeroFullBlock as HeroProps } from "@/payload/payload-types"
import { cn } from "@/utilities/ui"
import { tv } from "tailwind-variants"
import React, { Fragment } from "react"

/****************************************************
 * Hero Content Text Variants Configuration
 ****************************************************/

const heroContentTextVariants = tv({
  variants: {
    colorScheme: {
      "background-image": "text-white",
      dark: "text-white",
      white: "text-dark",
      primary: "text-white",
      secondary: "text-white",
    },
  },
  defaultVariants: {
    colorScheme: "background-image",
  },
})

/****************************************************
 * Hero Content Component
 ****************************************************/

export const HeroContent: React.FC<{
  content?: string
  buttons?: HeroProps["buttons"]
  buttonAppearance?: "default" | "outlineGradient"
  colorScheme?: HeroProps["colorScheme"]
}> = ({
  content,
  buttons,
  buttonAppearance = "default",
  colorScheme = "background-image",
}) => {
  return (
    <Fragment>
      {content && (
        <p className={cn("font-light", heroContentTextVariants({ colorScheme }))}>
          {content}
        </p>
      )}

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
