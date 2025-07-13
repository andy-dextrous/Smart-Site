"use client"

import { gsap, useGSAP } from "@/providers/gsap"
import React from "react"

/****************************************************
 * Timestamp Display Component
 ****************************************************/

export const TimestampDisplay: React.FC<{
  timestampDateRef: React.RefObject<HTMLDivElement | null>
  timestampTimeRef: React.RefObject<HTMLDivElement | null>
}> = ({ timestampDateRef, timestampTimeRef }) => {
  /****************************************************
   * Timestamp Animations
   ****************************************************/

  useGSAP(() => {
    let isUAE = true

    function getCurrentTimes() {
      const now = new Date()

      // UAE Time (GMT+4)
      const uaeDate = new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Dubai",
      }).format(now)

      const uaeTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Dubai",
      }).format(now)

      // Ireland Time (GMT+0/+1)
      const irelandDate = new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Europe/Dublin",
      }).format(now)

      const irelandTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Europe/Dublin",
      }).format(now)

      return {
        uae: {
          date: uaeDate,
          time: `${uaeTime} (GMT+4)`,
        },
        ireland: {
          date: irelandDate,
          time: `${irelandTime} (GMT+0)`,
        },
      }
    }

    function animateTimestamp() {
      const times = getCurrentTimes()
      const current = isUAE ? times.uae : times.ireland

      // Animate timestamp
      gsap.to(timestampDateRef.current, {
        duration: 2,
        scrambleText: {
          text: current.date,
          chars: "lowerCase",
          newClass: "text-sm text-white",
        },
      })

      gsap.to(timestampTimeRef.current, {
        duration: 2,
        scrambleText: {
          text: current.time,
          chars: "lowerCase",
          newClass: "text-sm text-white",
        },
      })

      isUAE = !isUAE
    }

    // Set initial timestamp with small delay
    gsap.delayedCall(0.1, () => {
      const initialTimes = getCurrentTimes()
      if (timestampDateRef.current && timestampTimeRef.current) {
        timestampDateRef.current.textContent = initialTimes.uae.date
        timestampTimeRef.current.textContent = initialTimes.uae.time
      }
    })

    // Master timeline for timestamp animations - start after initial setup
    gsap.delayedCall(3, () => {
      const masterTimeline = gsap.timeline({
        repeat: -1,
        repeatDelay: 8, // 10 seconds total (2 second animation + 8 second delay)
      })

      masterTimeline.call(animateTimestamp)
    })
  })

  return (
    <div>
      <div ref={timestampDateRef} className="text-sm">
        Mon, 16th May 2025
      </div>
      <div ref={timestampTimeRef} className="text-sm">
        02:00 AM (GMT+4)
      </div>
    </div>
  )
}
