"use client"

import { getSmartSiteConfig } from "@/admin/config"

/*************************************************************************/
/*  GSAP PLUGIN LOADER
/*************************************************************************/

export async function initializeGSAP() {
  const config = getSmartSiteConfig()
  const hasAnyPlugin = Object.values(config.gsap).some(enabled => enabled)

  if (!hasAnyPlugin) return null

  const gsapCore = await import("gsap")
  const { gsap } = gsapCore
  const plugins: any[] = []

  /*************************************************************************/
  /*  CONDITIONAL PLUGIN LOADING
  /*************************************************************************/

  if (config.gsap.scrollTrigger) {
    const { ScrollTrigger } = await import("gsap/ScrollTrigger")
    gsap.registerPlugin(ScrollTrigger)
    plugins.push(ScrollTrigger)
  }

  if (config.gsap.scrollSmoother && config.gsap.scrollTrigger) {
    const { ScrollSmoother } = await import("gsap/ScrollSmoother")
    gsap.registerPlugin(ScrollSmoother)
    plugins.push(ScrollSmoother)
  }

  if (config.gsap.flip) {
    const { Flip } = await import("gsap/Flip")
    gsap.registerPlugin(Flip)
    plugins.push(Flip)
  }

  if (config.gsap.draggable) {
    const { Draggable } = await import("gsap/Draggable")
    gsap.registerPlugin(Draggable)
    plugins.push(Draggable)
  }

  if (config.gsap.morphSVG) {
    const { MorphSVGPlugin } = await import("gsap/MorphSVGPlugin")
    gsap.registerPlugin(MorphSVGPlugin)
    plugins.push(MorphSVGPlugin)
  }

  if (config.gsap.drawSVG) {
    const { DrawSVGPlugin } = await import("gsap/DrawSVGPlugin")
    gsap.registerPlugin(DrawSVGPlugin)
    plugins.push(DrawSVGPlugin)
  }

  if (config.gsap.splitText) {
    const { SplitText } = await import("gsap/SplitText")
    gsap.registerPlugin(SplitText)
    plugins.push(SplitText)
  }

  if (config.gsap.customEase) {
    const { CustomEase } = await import("gsap/CustomEase")
    gsap.registerPlugin(CustomEase)
    plugins.push(CustomEase)
  }

  if (config.gsap.textPlugin) {
    const { TextPlugin } = await import("gsap/TextPlugin")
    gsap.registerPlugin(TextPlugin)
    plugins.push(TextPlugin)
  }

  /*************************************************************************/
  /*  SET DEFAULTS
  /*************************************************************************/

  gsap.defaults({
    ease: "power2.inOut",
    duration: 0.3,
  })

  return { gsap, plugins }
}
