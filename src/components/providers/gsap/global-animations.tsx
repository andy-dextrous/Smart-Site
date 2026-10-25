"use client"

import site from "@/site.config"
import { useGSAP } from "@gsap/react"
import { gsap, ScrollTrigger } from "@/components/providers/gsap"
import { usePathname } from "next/navigation"

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  if (value === "false") return false
  if (value === "0") return false
  if (value === "true") return true
  if (value === "1") return true
  return fallback
}

let textPluginRegistered = false
let splitTextRegistered = false

export default function GlobalAnimationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const config = site
  const pathname = usePathname()
  const animationsEnabled = config.gsap.globalAnimations

  useGSAP(
    () => {
      if (!animationsEnabled || typeof window === "undefined") {
        return
      }

      const cleanups: Array<() => void> = []
      let isActive = true
      const ctx = gsap.context(() => {
        if (ScrollTrigger) {
          const elements = gsap.utils.toArray<HTMLElement>("[data-animate]")

          elements.forEach(element => {
            const direction = element.dataset.animate || "fade-up"
            const distance = toNumber(element.dataset.animateDistance, 24)
            const duration = toNumber(element.dataset.animateDuration, 0.6)
            const delay = toNumber(element.dataset.animateDelay, 0)
            const stagger = toNumber(element.dataset.animateStagger, 0)
            const ease = element.dataset.animateEase || "power2.out"
            const offset = element.dataset.animateOffset || "80%"
            const repeat = toBoolean(element.dataset.animateRepeat, false)
            const once = !repeat
            const targetSelector = element.dataset.animateTarget
            const targets = targetSelector
              ? Array.from(element.querySelectorAll<HTMLElement>(targetSelector))
              : [element]

            let x = 0
            let y = 0

            switch (direction) {
              case "fade-down":
                y = -distance
                break
              case "fade-left":
                x = distance
                break
              case "fade-right":
                x = -distance
                break
              case "fade-in":
                y = 0
                break
              default:
                y = distance
                break
            }

            const tween = gsap.from(targets, {
              opacity: 0,
              x,
              y,
              delay,
              duration,
              ease,
              stagger,
              scrollTrigger: {
                trigger: element,
                start: `top ${offset}`,
                toggleActions: once
                  ? "play none none none"
                  : "restart pause resume pause",
              },
              onComplete: () => {
                targets.forEach(target => target.classList.remove("transition-none"))
              },
              onStart: () => {
                targets.forEach(target => target.classList.add("transition-none"))
              },
            })

            cleanups.push(() => {
              tween.kill()
              if (tween.scrollTrigger) {
                tween.scrollTrigger.kill()
              }
            })
          })
        }

        if (ScrollTrigger) {
          const elements = gsap.utils.toArray<HTMLElement>("[data-parallax]")

          elements.forEach(element => {
            const speed = toNumber(element.dataset.parallaxSpeed, 0.2)
            const start = element.dataset.parallaxStart || "top bottom"
            const end = element.dataset.parallaxEnd || "bottom top"
            const scrub = toNumber(element.dataset.parallaxScrub, 1)

            const tween = gsap.to(element, {
              yPercent: speed * -100,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start,
                end,
                scrub,
              },
            })

            cleanups.push(() => {
              tween.kill()
              if (tween.scrollTrigger) {
                tween.scrollTrigger.kill()
              }
            })
          })
        }

        if (ScrollTrigger) {
          const elements = gsap.utils.toArray<HTMLElement>("[data-rotate]")

          elements.forEach(element => {
            const rotations = toNumber(element.dataset.rotateTurns, 1)
            const start = element.dataset.rotateStart || "top bottom"
            const end = element.dataset.rotateEnd || "bottom top"
            const scrub = toNumber(element.dataset.rotateScrub, 1)

            const tween = gsap.to(element, {
              rotate: rotations * 360,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start,
                end,
                scrub,
              },
            })

            cleanups.push(() => {
              tween.kill()
              if (tween.scrollTrigger) {
                tween.scrollTrigger.kill()
              }
            })
          })
        }

        if (ScrollTrigger) {
          const elements = gsap.utils.toArray<HTMLElement>("[data-typewriter]")

          if (elements.length) {
            void (async () => {
              if (!textPluginRegistered) {
                const { TextPlugin } = await import("gsap/TextPlugin")
                if (!isActive) return
                gsap.registerPlugin(TextPlugin)
                textPluginRegistered = true
              }

              elements.forEach(element => {
                const original = element.textContent || ""
                if (!original.length) return

                const speed = toNumber(element.dataset.typewriterSpeed, 0.05)
                const delay = toNumber(element.dataset.typewriterDelay, 0)
                const ease = element.dataset.typewriterEase || "none"
                const start = element.dataset.typewriterStart || "top bottom"
                const repeat = toBoolean(element.dataset.typewriterRepeat, false)
                const once = !repeat
                const duration = Math.max(original.length * speed, 0.2)

                element.textContent = ""

                const tween = gsap.to(element, {
                  text: original,
                  duration,
                  delay,
                  ease,
                  scrollTrigger: {
                    trigger: element,
                    start,
                    toggleActions: once
                      ? "play none none none"
                      : "restart pause resume pause",
                  },
                })

                cleanups.push(() => {
                  tween.kill()
                  if (tween.scrollTrigger) {
                    tween.scrollTrigger.kill()
                  }
                  element.textContent = original
                })
              })
            })()
          }
        }

        {
          const elements = gsap.utils.toArray<HTMLElement>("[data-pulse]")

          elements.forEach(element => {
            const scale = toNumber(element.dataset.pulseScale, 1.05)
            const duration = toNumber(element.dataset.pulseDuration, 1.2)

            const tween = gsap.to(element, {
              scale,
              duration,
              ease: "power1.inOut",
              repeat: -1,
              yoyo: true,
            })

            cleanups.push(() => {
              tween.kill()
            })
          })
        }

        if (ScrollTrigger) {
          const elements = gsap.utils.toArray<HTMLElement>("[data-split]")

          if (elements.length) {
            void (async () => {
              const { SplitText } = await import("gsap/SplitText")

              if (!isActive) {
                return
              }

              if (!splitTextRegistered) {
                gsap.registerPlugin(SplitText)
                splitTextRegistered = true
              }

              elements.forEach(element => {
                const type = element.dataset.split || "lines"
                const stagger = toNumber(element.dataset.splitStagger, 0.08)
                const duration = toNumber(element.dataset.splitDuration, 0.6)
                const ease = element.dataset.splitEase || "power3.out"
                const offset = element.dataset.splitOffset || "80%"
                const splitInstance = new SplitText(element, { type })
                const targets =
                  type === "chars"
                    ? splitInstance.chars
                    : type === "words"
                      ? splitInstance.words
                      : splitInstance.lines

                const tween = gsap.from(targets, {
                  opacity: 0,
                  y: 24,
                  duration,
                  stagger,
                  ease,
                  scrollTrigger: {
                    trigger: element,
                    start: `top ${offset}`,
                    toggleActions: "play none none none",
                  },
                  onComplete: () => {
                    splitInstance.revert()
                  },
                })

                cleanups.push(() => {
                  tween.kill()
                  if (tween.scrollTrigger) {
                    tween.scrollTrigger.kill()
                  }
                  splitInstance.revert()
                })
              })
            })()
          }
        }
      })

      return () => {
        isActive = false
        cleanups.forEach(clean => clean())
        ctx.revert()
      }
    },
    {
      dependencies: [pathname, animationsEnabled],
      revertOnUpdate: true,
    }
  )

  return <>{children}</>
}
