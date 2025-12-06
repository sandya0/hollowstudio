'use client'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import FluidAnimation from './FluidAnimation'
import FluidText from './FluidText'

export default function Hero() {
  const containerRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 })

      tl.from(".hero-footer", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out"
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-brand-black text-brand-white"
    >
      
      {/* LAYER 1: The Colorful Background Animation */}
      <div className="absolute inset-0 z-0">
        <FluidAnimation />
      </div>

      {/* LAYER 2: The Fluid Text 
          mix-blend-screen: Black background becomes transparent, 
          White text stays visible.
      */}
      <div className="absolute inset-0 z-10 mix-blend-screen">
        <FluidText text="HOLLOW STUDIO" />
      </div>

      {/* LAYER 3: The Content Overlay */}
      <div className="relative z-20 w-full h-full flex flex-col justify-end pointer-events-none">
        <div className="hero-footer pointer-events-auto w-full px-12 pb-12 flex justify-between items-end">
          <div className="max-w-[500px]">
            <p className="font-body text-h2 text-brand-white">
              We are a web studio that builds{" "}
              <span className="text-brand-red font-semibold">bold</span>{" "}
              digital experiences for brands that want to{" "}
              <span className="text-brand-red font-semibold">stand out</span>,
              not blend in.
            </p>
          </div>

          <div className="hidden md:block">
            <span className="text-h5 uppercase tracking-widest text-brand-grey">
              Scroll to explore
            </span>
          </div>
        </div>
      </div>

    </section>
  )
}