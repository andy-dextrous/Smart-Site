import React from "react"
import type { StaticImageData } from "next/image"

import type { MediaBlock as MediaBlockProps } from "@/payload-types"
import { Media } from "@/components/fields/media"
import { cn } from "@/lib/ui"

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  disableInnerContainer?: boolean
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
}

export function MediaBlock({
  captionClassName,
  className,
  enableGutter = true,
  imgClassName,
  media,
  staticImage,
  disableInnerContainer,
}: Props) {
  const caption = media && typeof media === "object" ? media.caption : null

  return (
    <div className={cn(enableGutter ? "container" : undefined, className)}>
      {(media || staticImage) && (
        <Media
          imgClassName={cn("rounded-[0.8rem] border border-dark-border", imgClassName)}
          resource={media}
          src={staticImage}
        />
      )}

      {caption ? (
        <div
          className={cn(
            "mt-content",
            disableInnerContainer ? undefined : "container",
            captionClassName
          )}
          dangerouslySetInnerHTML={{ __html: caption }}
        />
      ) : null}
    </div>
  )
}
