"use client"

import canUseDOM from "@/admin/utilities/can-use-dom"
import { getSmartSiteConfig } from "@/admin/config"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { ScrollSmoother } from "gsap/ScrollSmoother"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { usePathname } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"
import { initializeGSAP } from "@/providers/gsap/gsap-loader"

// Import effects to register them
import "./effects"

/****************************************************
 * Setup GSAP Plugins and Defaults
 ****************************************************/

if (canUseDOM) {
  initializeGSAP()
}

/****************************************************
 * Smooth Scroll Context
 ****************************************************/

interface GSAPContextType {
  smootherInstance: ScrollSmoother | null
  scrollToTop: () => void
}

const GSAPContext = createContext<GSAPContextType>({
  smootherInstance: null,
  scrollToTop: () => {},
})

/****************************************************
 * Smooth Scroll Provider
 ****************************************************/

const omittedPaths = [] as string[]

const SmoothScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const [smootherInstance, setSmootherInstance] = useState<ScrollSmoother | null>(null)
  const [gsapLoaded, setGsapLoaded] = useState(false)

  /*************************************************************************/
  /*  SCROLL TO TOP UTILITY FUNCTION
  /*************************************************************************/

  const scrollToTop = () => {
    if (smootherInstance) {
      smootherInstance.scrollTo(0, true)
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadGSAP() {
      await initializeGSAP()
      if (isMounted) {
        setGsapLoaded(true)
      }
    }

    if (canUseDOM) {
      loadGSAP()
    }

    return () => {
      isMounted = false
    }
  }, [])

  useGSAP(
    () => {
      const config = getSmartSiteConfig()
      if (!gsapLoaded || !config.gsap.scrollSmoother || omittedPaths.includes(pathname)) {
        return
      }

      // Ensure ScrollSmoother is available before creating
      if (typeof ScrollSmoother?.create !== "function") {
        console.warn("ScrollSmoother plugin not available; skipping smooth scroll initialization")
        return
      }

      const smoother = ScrollSmoother.create({
        smooth: 1.8,
        effects: true,
        normalizeScroll: true,
      })
      setSmootherInstance(smoother)

      // Scroll to top on route change
      smoother.scrollTo(0, true)

      return () => {
        smoother?.kill()
        setSmootherInstance(null)
      }
    },
    {
      dependencies: [pathname, gsapLoaded],
      revertOnUpdate: true,
    }
  )

  useGSAP(
    () => {
      ScrollTrigger.refresh()

      if (smootherInstance) {
        smootherInstance.refresh()
        // Also scroll to top when refreshing
        smootherInstance.scrollTo(0, false)
      }
    },
    {
      dependencies: [pathname],
      revertOnUpdate: true,
    }
  )

  const config = getSmartSiteConfig()
  return config.gsap.scrollSmoother ? (
    <GSAPContext.Provider value={{ smootherInstance, scrollToTop }}>
      {children}
    </GSAPContext.Provider>
  ) : (
    children
  )
}

export const useSmoothContext = () => {
  return useContext(GSAPContext)
}

/*************************************************************************/
/*  SCROLL TO TOP HOOK
/*************************************************************************/

export const useScrollToTop = () => {
  const { scrollToTop } = useContext(GSAPContext)
  return scrollToTop
}

export default SmoothScrollProvider

export { Draggable } from "gsap/Draggable"
export { EaselPlugin } from "gsap/EaselPlugin"
export { EasePack } from "gsap/EasePack"
export { Flip } from "gsap/Flip"
export { GSDevTools } from "gsap/GSDevTools"
export { InertiaPlugin } from "gsap/InertiaPlugin"
export { MorphSVGPlugin } from "gsap/MorphSVGPlugin"
export { MotionPathPlugin } from "gsap/MotionPathPlugin"
export { Observer } from "gsap/Observer"
export { PixiPlugin } from "gsap/PixiPlugin"
export { ScrollSmoother } from "gsap/ScrollSmoother"
export { ScrollToPlugin } from "gsap/ScrollToPlugin"
export { ScrollTrigger } from "gsap/ScrollTrigger"
export { TextPlugin } from "gsap/TextPlugin"
export { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
export { GSAPContext }

export * from "@gsap/react"
export * from "gsap"
