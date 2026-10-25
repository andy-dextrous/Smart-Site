"use client"

import { useGSAP, gsap } from "@/components/providers/gsap"
import { cn } from "@/lib/ui"
import { useRef } from "react"

/*************************************************************************/
/*  HAMBURGER COMPONENT WITH ANIMATED STATE TRANSITIONS
/*************************************************************************/

interface HamburgerProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export function Hamburger({ isOpen, onClick, className }: HamburgerProps) {
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  useGSAP(
    () => {
      if (isOpen) {
        gsap.to(".hamburger-line-1", {
          rotation: 45,
          y: 8,
          duration: 0.15,
          ease: "power2.inOut",
        })
        gsap.to(".hamburger-line-2", {
          opacity: 0,
          duration: 0.1,
          ease: "power2.inOut",
        })
        gsap.to(".hamburger-line-3", {
          rotation: -45,
          y: -8,
          duration: 0.15,
          ease: "power2.inOut",
        })
      } else {
        gsap.to(".hamburger-line-1", {
          rotation: 0,
          y: 0,
          duration: 0.15,
          ease: "power2.inOut",
        })
        gsap.to(".hamburger-line-2", {
          opacity: 1,
          duration: 0.1,
          ease: "power2.inOut",
        })
        gsap.to(".hamburger-line-3", {
          rotation: 0,
          y: 0,
          duration: 0.15,
          ease: "power2.inOut",
        })
      }
    },
    { scope: hamburgerRef, dependencies: [isOpen] }
  )

  return (
    <button
      ref={hamburgerRef}
      onClick={onClick}
      className={cn(
        "relative z-[1001] flex h-12 w-12 flex-col items-center justify-center rounded-full transition-colors duration-200 lg:hidden",
        "hover:bg-neutral",
        className
      )}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <div className="flex flex-col justify-center">
        <span
          className={cn(
            "hamburger-line-1 mb-control-sm block h-0.5 w-6 transform transition-all duration-300",
            "bg-dark"
          )}
        />
        <span
          className={cn(
            "hamburger-line-2 mb-control-sm block h-0.5 w-6 transform transition-all duration-300",
            "bg-dark"
          )}
        />
        <span
          className={cn(
            "hamburger-line-3 block h-0.5 w-6 transform transition-all duration-300",
            "bg-dark"
          )}
        />
      </div>
    </button>
  )
}
