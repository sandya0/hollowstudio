'use client'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import FluidAnimation from './FluidAnimation'
import FluidText from './FluidText'
import Text from './template/Text'

export default function Hero() {
  const containerRef = useRef(null)
  const footerRef = useRef(null)

  useLayoutEffect(() => {
    if (!containerRef.current || !footerRef.current) return

    const ctx = gsap.context(() => {
      gsap.set(footerRef.current, {
        opacity: 0,
        y: 20
      })

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
      className="relative w-full min-h-[100svh] overflow-hidden bg-brand-black text-brand-white"
    >

      <div className="absolute inset-0 z-0">
        <FluidAnimation />
      </div>

      <div className="absolute inset-0 z-10 mix-blend-screen pointer-events-none">
        <FluidText text="HOLLOW STUDIO" />
      </div>

      <div className="relative z-20 w-full min-h-[100svh] flex flex-col justify-end">
        <div
          ref={footerRef}
          className="hero-footer w-full px-4 sm:px-6 md:px-12 pb-6 sm:pb-8 md:pb-12 flex flex-col-reverse md:flex-row md:justify-between md:items-end gap-4 md:gap-6"
        >
          <div className="max-w-full lg:max-w-[700px]">
            <Text>
              <p className="font-body text-[clamp(1rem,5vw,2.2rem)] leading-tight text-brand-white uppercase">
                We are a web studio that builds{" "}
                <span className="text-brand-red font-semibold">bold</span>{" "}
                digital experiences for brands that want to{" "}
                <span className="text-brand-red font-semibold">stand out</span>,
                not blend in.
              </p>
            </Text>
          </div>

          <div className="text-left md:text-right">
            <Text>
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-brand-grey">
                Scroll to explore
              </span>
            </Text>
          </div>
        </div>
      </div>

    </section>
  )
}
