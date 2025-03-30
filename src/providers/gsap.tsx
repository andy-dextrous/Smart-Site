"use client"

import { ScrollSmoother } from "gsap/dist/ScrollSmoother"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { usePathname } from "next/navigation"
import { SplitText } from "gsap/SplitText"
import { CustomEase } from "gsap/CustomEase"
import gsap from "gsap"
import { createContext, useRef } from "react"
import wildChildConfig from "@/wild-child.config"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, useGSAP, SplitText, CustomEase)
}

interface GSAPContextType {
  smootherInstance: ScrollSmoother | null
}

const GSAPContext = createContext<GSAPContextType>({
  smootherInstance: null,
})

const GSAPProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const smootherRef = useRef<ScrollSmoother | null>(null)

  useGSAP(
    () => {
      if (wildChildConfig.smoothScroll) {
        smootherRef.current = ScrollSmoother.create({
          smooth: 1,
          effects: true,
          normalizeScroll: true,
        })
      }
    },
    {
      dependencies: [pathname],
      revertOnUpdate: true,
    }
  )

  return wildChildConfig.smoothScroll ? (
    <GSAPContext.Provider value={{ smootherInstance: smootherRef.current }}>
      <div id="smooth-wrapper">
        <div id="smooth-content">{children}</div>
      </div>
    </GSAPContext.Provider>
  ) : (
    children
  )
}

export default GSAPProvider
