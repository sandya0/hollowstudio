'use client'
import React, { useState, useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Text from './template/Text'
import Link from './template/Link'
import AnimatedButtonText from './template/AnimatedButtonText'

// Register ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const Contact = () => {
  const [activeTab, setActiveTab] = useState('project')
  const contentRef = useRef(null)
  const containerRef = useRef(null)

  const handleTabChange = (tab) => {
    if (activeTab === tab) return

    gsap.to(contentRef.current, {
      y: 10,
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        setActiveTab(tab)
        gsap.to(contentRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.3,
          delay: 0.1
        })
      }
    })
  }

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.contact-reveal', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%',
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out'
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section 
      ref={containerRef}
      className="relative w-full min-h-screen bg-brand-black text-brand-white overflow-hidden flex flex-col justify-center py-10 md:py-0 px-4 sm:px-6 md:px-12"
    >
      {/* Main Container */}
      <div className="relative z-10 w-full flex flex-col gap-8 md:gap-4">
        
        {/* ROW 1: Headline and Buttons */}
        <div 
          className="w-full flex flex-col items-center md:grid md:grid-cols-12 md:items-end"
          style={{
            columnGap: 'var(--spacing-gutter)'
          }}
        >
          
          {/* LEFT BLOCK (Main Headline) - Spans 6 columns */}
          <div className="contact-reveal w-full md:col-span-6 flex flex-col items-center md:items-end text-center md:text-right mb-6 md:mb-0">
            <Text>
              <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-[4rem] xl:text-[5rem] 2xl:text-[6rem] font-headline uppercase leading-[0.9] break-words max-w-full">
                MAKE AN IMPACT.
              </h2>
            </Text>
          </div>

          {/* RIGHT BLOCK (Buttons Wrapper) - Spans remaining 6 columns */}
          {/* CHANGE 1: flex-col -> flex-row, added justify-center for mobile centering */}
          <div className="w-full md:col-span-6 flex flex-row md:flex-wrap lg:flex-nowrap items-center md:items-end justify-center md:justify-start gap-4 mb-3 md:mb-0">
            
            {/* Button 1 */}
            {/* CHANGE 2: w-full -> w-auto */}
            <div className="contact-reveal w-auto">
              <button 
                onClick={() => handleTabChange('project')}
                // CHANGE 3: w-full -> w-auto
                className={`w-auto group flex justify-center md:justify-start items-center gap-1.5 px-5 py-2 md:px-8 md:py-4 rounded-full transition-all duration-300 ${
                  activeTab === 'project' 
                    ? 'bg-brand-red text-brand-black hover:bg-white' 
                    : 'bg-transparent border border-brand-grey/30 text-brand-grey hover:border-brand-white hover:text-brand-white'
                }`}
              >
                <AnimatedButtonText>
                  <span className="uppercase font-bold tracking-wide text-xs md:text-lg lg:text-xl whitespace-nowrap">Start a Project</span>
                </AnimatedButtonText>
                <svg 
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="md:w-4 md:h-4"
                  aria-hidden="true"
                >
                  <path d="M7 7L17 17" />
                  <path d="M17 7v10h-10" />
                </svg>
              </button>
            </div>

            {/* Button 2 */}
            {/* CHANGE 2: w-full -> w-auto */}
            <div className="contact-reveal w-auto">
              <button 
                onClick={() => handleTabChange('follow')}
                // CHANGE 3: w-full -> w-auto
                className={`w-auto group flex justify-center md:justify-start items-center gap-1.5 px-5 py-2 md:px-8 md:py-4 rounded-full transition-all duration-300 ${
                  activeTab === 'follow' 
                    ? 'bg-brand-white text-brand-black' 
                    : 'bg-transparent border border-brand-grey/30 text-brand-grey hover:border-brand-white hover:text-brand-white'
                }`}
              >
                <AnimatedButtonText>
                  <span className="uppercase font-bold tracking-wide text-xs md:text-lg lg:text-xl">Follow</span>
                </AnimatedButtonText>
                <svg 
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="md:w-4 md:h-4"
                  aria-hidden="true"
                >
                  <path d="M7 7L17 17" />
                  <path d="M17 7v10h-10" />
                </svg>
              </button>
            </div>
            
          </div>
        </div>

        {/* ROW 2: Sub-text and Dynamic Content */}
        <div 
          className="w-full flex flex-col items-center md:grid md:grid-cols-12 md:items-start"
          style={{
            columnGap: 'var(--spacing-gutter)'
          }}
        >
          {/* LEFT BLOCK (Sub-text) */}
          <div className="contact-reveal w-full md:col-span-6 flex flex-col items-center md:items-end text-center md:text-right mb-6 md:mb-0">
            <Text>
              <p className="text-brand-white text-sm md:text-base uppercase tracking-widest mt-1">
                Let's build something remarkable.
              </p>
            </Text>
          </div>

          {/* RIGHT BLOCK (Dynamic Content) */}
          <div className="contact-reveal w-full md:col-span-6 flex flex-col items-center md:items-start text-center md:text-left">
            <div ref={contentRef} className="min-h-[60px] mt-1">
              {activeTab === 'project' ? (
                <div className="flex flex-col gap-1 items-center md:items-start w-full">
                  <Link 
                    href="mailto:dhimassandya@gmail.com" 
                    className="text-xl md:text-2xl font-medium hover:text-brand-red transition-colors leading-none break-all sm:break-normal"
                  >
                    dhimassandya@gmail.com
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-1 items-center md:items-start w-full">
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-xl md:text-2xl font-medium leading-none">
                    <Link href="https://www.instagram.com/hollowebstudio" target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-colors">Instagram</Link>
                    <Link href="#" target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-colors">LinkedIn</Link>
                    <Link href="#" target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-colors">Twitter</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Contact