'use client'
import { useLayoutEffect, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import imagesLoaded from 'imagesloaded'
import FluidAnimation from './FluidAnimation'
import FluidText from './FluidText'
import Text from './template/Text'

export default function Hero() {
  const containerRef = useRef(null)
  const footerRef = useRef(null)
  
  // Loader Refs
  const loaderRef = useRef(null)
  const percentRef = useRef(null)
  
  // State to track readiness
  const [webglReady, setWebglReady] = useState(false)
  const [isExitComplete, setIsExitComplete] = useState(false)

  // 1. Handle the Loading Logic
  useEffect(() => {
    const imgLoad = imagesLoaded(document.querySelectorAll('img'))
    const totalImages = imgLoad.images.length
    
    let loadedImages = 0
    let current = 0
    let target = 0

    // Image loading logic
    if (totalImages === 0) {
      target = 100
    } else {
      imgLoad.on('progress', () => {
        loadedImages++
        target = (loadedImages / totalImages) * 100
      })
    }

    let animationFrameId
    
    const updateProgress = () => {
      // Logic: If WebGL isn't ready, cap the target at 99%
      // This makes the loader hang at 99% until the fluid simulation is ready
      const effectiveTarget = webglReady ? target : Math.min(target, 99)

      // Lerp for smoothness
      current += (effectiveTarget - current) * 0.1

      // Update DOM
      if (percentRef.current) {
        percentRef.current.textContent = `${Math.floor(current)}%`
      }

      // Check for completion
      // Must be > 99.9 AND WebGL must be strictly true
      if (current >= 99.9 && webglReady) {
        current = 100
        if (percentRef.current) percentRef.current.textContent = "100%"
        
        // Trigger Exit Animation
        const tl = gsap.timeline({
            onComplete: () => setIsExitComplete(true)
        })

        tl.to(loaderRef.current, {
            duration: 1.6,
            opacity: 0,
            ease: "expo.inOut",
            pointerEvents: 'none'
        })
        .call(() => {
            playHeroEntrance()
        }, null, "-=1.0")

        cancelAnimationFrame(animationFrameId)
      } else {
        animationFrameId = requestAnimationFrame(updateProgress)
      }
    }

    updateProgress()

    return () => cancelAnimationFrame(animationFrameId)
  }, [webglReady]) // Rerun logic when webglReady changes


  // 2. The Hero Entrance Animation
  const playHeroEntrance = () => {
    if (!footerRef.current) return
    gsap.from(footerRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: 'power2.out',
    })
  }

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-[100svh] bg-brand-black text-brand-white"
    >
      {/* --- PRELOADER --- */}
      <div 
        ref={loaderRef}
        className="fixed inset-0 z-50 flex justify-center items-center bg-[#131417] text-white"
      >
        <span 
          ref={percentRef} 
          className="font-headline text-6xl md:text-8xl" 
        >
          0%
        </span>
      </div>

      <h1 className="sr-only">HOLLOW STUDIO - Web Design Agency</h1>

      {/* Layer 1: Background Animation */}
      <div className="absolute inset-0 z-0">
        {/* Pass the setter function to the component */}
        <FluidAnimation onReady={() => setWebglReady(true)} />
      </div>

      {/* Layer 2: Hero Text */}
      <div className="absolute inset-0 z-10 mix-blend-screen pointer-events-none select-none">
        <FluidText text="HOLLOW STUDIO" />
      </div>

      {/* Layer 3: Content/UI */}
      <div className="relative z-20 w-full min-h-[100svh] flex flex-col justify-end">
        <div
          ref={footerRef}
          className="hero-footer w-full px-4 sm:px-6 md:px-12 pb-6 sm:pb-8 md:pb-12 flex flex-col-reverse md:flex-row md:justify-between md:items-end gap-4 md:gap-6"
        >
          <div className="max-w-full lg:max-w-[700px]">
            <Text>
              <p className="font-body text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl leading-tight text-brand-white uppercase">
                We are a web studio that builds{" "}
                <span className="text-brand-red font-semibold">bold</span>{" "}
                digital experiences for brands that want to{" "}
                <span className="text-brand-red font-semibold">stand out</span>,
                not blend in.
              </p>
            </Text>
          </div>

          <div className="text-left lg:text-right">
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