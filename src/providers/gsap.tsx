"use client"

import canUseDOM from "@/utilities/canUseDOM"
import wildChildConfig from "@/wc.config"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { CustomEase } from "gsap/CustomEase"
import { ScrollSmoother } from "gsap/dist/ScrollSmoother"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { usePathname } from "next/navigation"
import { createContext, useRef } from "react"

/****************************************************
 * Setup GSAP Plugins and Defaults
 ****************************************************/

if (canUseDOM) {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, useGSAP, SplitText, CustomEase)
  gsap.defaults({
    ease: "power2.inOut",
    duration: 0.3,
  })
}

/****************************************************
 * Smooth Scroll Context
 ****************************************************/

interface GSAPContextType {
  smootherInstance: ScrollSmoother | null
}

const GSAPContext = createContext<GSAPContextType>({
  smootherInstance: null,
})

/****************************************************
 * Smooth Scroll Provider
 ****************************************************/

const SmoothScrollProvider = ({ children }: { children: React.ReactNode }) => {
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

export default SmoothScrollProvider
export * from "@gsap/react"
export * from "gsap"
