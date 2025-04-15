"use client"

import RichText from "@/payload/components/rich-text"
import type { HeroPrimaryBlock as HeroPrimaryBlockProps } from "@/payload/payload-types"
import { useGSAP, gsap } from "@/providers/gsap"
import React, { useRef } from "react"

export const HeroPrimaryComponent: React.FC<HeroPrimaryBlockProps> = ({
  heading,
  content,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.fromTo(
        "h1",
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.inOut" }
      )
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      className="flex h-screen w-full items-center justify-center bg-red-500"
    >
      <div className="container">
        <h1 className="text-4xl font-bold">{heading}</h1>
        <RichText data={content} enableGutter={false} enableProse={false} />
      </div>
    </section>
  )
}
