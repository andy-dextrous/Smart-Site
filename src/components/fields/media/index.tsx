import React, { Fragment } from "react"

import type { Props } from "@/components/fields/media/types"

import { ImageMedia } from "@/components/fields/media/image-media/index"
import { VideoMedia } from "@/components/fields/media/video-media/index"

export const Media: React.FC<Props> = props => {
  const { className, htmlElement = "div", resource, src } = props

  const mediaResource = resource && typeof resource === "object" ? resource : null

  if (!mediaResource && !src) {
    return null
  }

  const mediaProps: Props = {
    ...props,
    resource: mediaResource,
  }

  const isVideo = mediaResource?.mimeType?.includes("video")
  const Tag = htmlElement || Fragment

  return (
    <Tag
      {...(htmlElement !== null
        ? {
            className,
          }
        : {})}
    >
      {isVideo ? <VideoMedia {...mediaProps} /> : <ImageMedia {...mediaProps} />}
    </Tag>
  )
}
