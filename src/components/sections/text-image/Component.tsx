"use client"

import RichText from "@/components/fields/rich-text"
import { cn } from "@/utilities/ui"
import { CMSLink } from "@/components/fields/link"
import { Media as PayloadMedia } from "@/components/fields/media"
import { Button } from "@/components/ui/button"
import type {
  Media,
  TextImageBlock as TextImageBlockProps,
} from "@/admin/payload/payload-types"
import { gsap, useGSAP } from "@/providers/gsap"
import { useRef } from "react"

export const TextImageComponent: React.FC<TextImageBlockProps> = props => {
  const { heading, content, image: imageProp, imagePosition, buttons } = props
  const image = imageProp as Media
  const titleRef = useRef<HTMLHeadingElement>(null)

  /****************************************************
   * GSAP Animation
   ****************************************************/

  useGSAP(() => {
    if (titleRef.current) {
      gsap.effects.titleReveal(titleRef.current, {
        trigger: {
          trigger: titleRef.current,
          start: "top 90%",
          end: "bottom 40%",
        },
      })
    }
  })

  return (
    <section>
      <div
        className={cn(
          "container flex gap-8",
          imagePosition === "right" ? "flex-row" : "flex-row-reverse"
        )}
      >
        <div className="flex flex-1 flex-col items-start gap-4">
          <h2 ref={titleRef} className="title-hidden text-2xl font-bold">
            {heading}
          </h2>
          <div className="prose max-w-none">
            <RichText data={content} />
          </div>

          {buttons && (
            <div className="flex gap-4">
              {buttons.map((button: any) => {
                const appearance = button.link.appearance || "default"

                return (
                  <CMSLink key={button.id} {...button.link}>
                    <Button variant={appearance}>{button.link.label}</Button>
                  </CMSLink>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col items-start gap-4">
          <div className="relative h-full max-h-[400px] min-h-[400px] w-full">
            <PayloadMedia
              resource={image}
              alt={image?.alt || ""}
              fill
              imgClassName="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
