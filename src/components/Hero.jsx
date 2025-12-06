'use client'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import FluidAnimation from './FluidAnimation'
import FluidText from './FluidText'

export default function Hero() {
  const containerRef = useRef(null)
  const footerRef = useRef(null)

  useLayoutEffect(() => {
    if (!containerRef.current || !footerRef.current) return

    const ctx = gsap.context(() => {

      // ✅ force hidden state on load (prevents flash)
      gsap.set(footerRef.current, {
        opacity: 0,
        y: 20
      })

      // ✅ animate to visible state
      gsap.to(footerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.2
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-brand-black text-brand-white"
    >

      {/* LAYER 1: Fluid Background */}
      <div className="absolute inset-0 z-0">
        <FluidAnimation />
      </div>

      {/* LAYER 2: Fluid Text */}
      <div className="absolute inset-0 z-10 mix-blend-screen pointer-events-none">
        <FluidText text="HOLLOW STUDIO" />
      </div>

      {/* LAYER 3: Footer Content */}
      <div className="relative z-20 w-full h-full flex flex-col justify-end">
        <div
          ref={footerRef}
          className="hero-footer w-full px-6 md:px-12 pb-8 md:pb-12 flex justify-between items-end"
        >
          <div className="max-w-[600px]">
            <p className="font-body text-h1 text-brand-white">
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
