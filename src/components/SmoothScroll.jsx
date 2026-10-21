// src/components/SmoothScroll.jsx
'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth easing
      smoothWheel: true,
    })

    window.lenis = lenis

    lenis.on('scroll', ScrollTrigger.update)

    // Keep a reference so cleanup removes the same function it added
    const update = (time) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(update)

    gsap.ticker.lagSmoothing(0, 0)

    // 5. Cleanup on unmount
    return () => {
      gsap.ticker.remove(update)
      lenis.off('scroll', ScrollTrigger.update)
      lenis.destroy()
      delete window.lenis
    }
  }, [])

  return <>{children}</>
}