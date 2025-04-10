import RichText from "@/payload/components/rich-text"
import type { HeroPrimaryBlock as HeroPrimaryBlockProps } from "@/payload/payload-types"
import React from "react"

export const HeroPrimaryBlock: React.FC<HeroPrimaryBlockProps> = ({
  heading,
  content,
}) => {
  return (
    <section className="flex h-screen w-full items-center justify-center bg-red-500">
      <div className="container">
        <h1 className="text-4xl font-bold">{heading}</h1>
        <RichText data={content} enableGutter={false} enableProse={false} />
      </div>
    </section>
  )
}
