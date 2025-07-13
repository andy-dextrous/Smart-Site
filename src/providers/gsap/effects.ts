import { gsap } from "gsap"
import { SplitText } from "gsap/SplitText"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/****************************************************
 * Title Reveal Effect
 *
 * Reusable animation for h1/h2 elements that:
 * - Splits text into lines
 * - Adds mask reveal effect
 * - Slides lines in from left with stagger
 * - Slides lines back out on scroll up (scrubbed)
 * - Optionally reverts SplitText after animation (for non-scroll, e.g. hero h1)
 * - Auto-removes .title-hidden class to prevent flicker
 ****************************************************/

interface TitleRevealConfig {
  duration?: number // Duration for each line animation
  stagger?: number // Delay between each line
  ease?: string // Easing function
  slideDistance?: number // How far to slide from (negative = left, as percentage)
  trigger?: any // ScrollTrigger configuration
  timeline?: gsap.core.Timeline | null // Timeline to add to (if provided)
  startTime?: number // When to start in timeline
  hiddenClass?: string // Class to remove to prevent flicker
  revertOnComplete?: boolean // If true, revert SplitText after animation (non-scroll only)
}

gsap.registerEffect({
  name: "titleReveal",
  effect: (targets: gsap.TweenTarget, config: TitleRevealConfig = {}) => {
    const settings = {
      duration: 1.5,
      stagger: 0.2,
      ease: "power3.out",
      slideDistance: -100, // in percent
      trigger: null,
      timeline: null,
      startTime: 0,
      hiddenClass: "title-hidden",
      revertOnComplete: false,
      ...config,
    }

    // Convert targets to array
    const elements = gsap.utils.toArray(targets) as Element[]

    elements.forEach((element: Element) => {
      // Create SplitText for element with masking
      const split = SplitText.create(element, {
        type: "lines",
        mask: "lines",
        linesClass: "title-line",
      })

      // Set initial state for split lines - keep parent hidden for now
      gsap.set(split.lines, {
        xPercent: settings.slideDistance,
        autoAlpha: 0,
      })

      // If using scroll-based trigger, use scrubbed timeline for true in/out
      let tl: gsap.core.Timeline
      const timelineConfig: any = {}
      const isScroll = !!settings.trigger
      if (isScroll) {
        timelineConfig.scrollTrigger = {
          trigger: settings.trigger.trigger || settings.trigger,
          start: settings.trigger.start || "top 90%",
          end: settings.trigger.end || "bottom 80%",
          scrub: settings.trigger.scrub !== undefined ? settings.trigger.scrub : true,
          ...settings.trigger,
        }
      }

      tl = gsap.timeline(timelineConfig)

      // Remove hidden class and make element visible at the start of animation
      tl.call(
        () => {
          if (settings.hiddenClass) {
            element.classList.remove(settings.hiddenClass)
          }
        },
        undefined,
        0
      )

      tl.set(element, { autoAlpha: 1 }, 0)

      // Animate each line with stagger
      split.lines.forEach((line: Element, index: number) => {
        tl.fromTo(
          line,
          {
            xPercent: settings.slideDistance,
            autoAlpha: 0,
          },
          {
            xPercent: 0,
            autoAlpha: 1,
            duration: settings.duration,
            ease: settings.ease,
          },
          index * settings.stagger
        )
      })

      // If revertOnComplete is true and not using scrollTrigger, revert SplitText after animation
      if (settings.revertOnComplete) {
        tl.call(() => {
          gsap.delayedCall(0.1, () => {
            split.revert()
          })
        })
      }

      // If a parent timeline is provided, add to it
      if (settings.timeline) {
        settings.timeline.add(tl, settings.startTime)
        return settings.timeline
      }

      return tl
    })
  },
  defaults: {
    duration: 1.5,
    stagger: 0.2,
    ease: "power3.out",
    slideDistance: -100, // Now as percentage
    hiddenClass: "title-hidden",
    revertOnComplete: false,
  },
  extendTimeline: true,
})

export {}
