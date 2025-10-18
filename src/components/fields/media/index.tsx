import React, { Fragment } from "react"

import type { Props } from "./types"

import { ImageMedia } from "./image-media"
import { VideoMedia } from "./video-media"

export const Media: React.FC<Props> = props => {
  const { className, htmlElement = "div", resource, src } = props

  const mediaResource =
    resource && typeof resource === "object" ? resource : null

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
