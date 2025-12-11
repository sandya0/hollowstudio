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
      className="relative w-full min-h-screen bg-brand-black text-brand-white overflow-hidden flex flex-col justify-center"
    >

      {/* Main Container with 36px side margins */}
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-[36px]">
        
        {/* ROW 1: Headline and Buttons */}
        <div className="flex flex-col md:flex-row items-center md:items-end w-full gap-6 md:gap-[36px]">
          
          {/* LEFT BLOCK (Main Headline) */}
                              <div className="contact-reveal flex-1 w-full flex flex-col items-center md:items-end text-center md:text-right">
                                <Text>
                                  <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-[6rem] font-headline uppercase tracking-leading-[0.9] leading-none">
                                    MAKE AN IMPACT.
                                  </h2>
                                </Text>
                              </div>
          {/* RIGHT BLOCK (Buttons) */}
          <div className="contact-reveal flex-1 w-full flex flex-col items-center md:items-start text-center md:text-left pb-1 md:pb-3">
            <div className="flex justify-center md:justify-start gap-3">
              <button 
                onClick={() => handleTabChange('project')}
                className={`group flex items-center gap-1.5 px-4 py-2.5 md:px-8 md:py-4 rounded-full transition-all duration-300 ${
                  activeTab === 'project' 
                    ? 'bg-brand-red text-brand-black hover:bg-white' 
                    : 'bg-transparent border border-brand-grey/30 text-brand-grey hover:border-brand-white hover:text-brand-white'
                }`}
              >
                <AnimatedButtonText>
                  <span className="uppercase font-bold tracking-wide text-sm md:text-lg lg:text-xl">Start a Project</span>
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

              <button 
                onClick={() => handleTabChange('follow')}
                className={`group flex items-center gap-1.5 px-4 py-2.5 md:px-8 md:py-4 rounded-full transition-all duration-300 ${
                  activeTab === 'follow' 
                    ? 'bg-brand-white text-brand-black' 
                    : 'bg-transparent border border-brand-grey/30 text-brand-grey hover:border-brand-white hover:text-brand-white'
                }`}
              >
                <AnimatedButtonText>
                  <span className="uppercase font-bold tracking-wide text-sm md:text-lg lg:text-xl">Follow</span>
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
        {/* We use items-start to align tops */}
        <div className="flex flex-col md:flex-row items-start w-full gap-[36px] mt-4">
          
          {/* LEFT BLOCK (Sub-text) */}
          <div className="contact-reveal flex-1 w-full flex flex-col items-center md:items-end text-center md:text-right">
            <Text>
              <p className="text-brand-white text-sm md:text-base uppercase tracking-widest pl-1 mt-1">
                Let's build something remarkable.
              </p>
            </Text>
          </div>

          {/* RIGHT BLOCK (Dynamic Content) */}
          <div className="contact-reveal flex-1 w-full flex flex-col items-center md:items-start text-center md:text-left">
            <div ref={contentRef} className="min-h-[60px] pl-2 mt-1">
              {activeTab === 'project' ? (
                <div className="flex flex-col gap-1 items-center md:items-start">
                  <Link 
                    href="mailto:dhimassandya@gmail.com" 
                    // Added leading-none to remove top whitespace from the larger font
                    className="text-xl md:text-2xl font-medium hover:text-brand-red transition-colors leading-none"
                  >
                    dhimassandya@gmail.com
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-1 items-center md:items-start">
                    {/* Added leading-none */}
                    <div className="flex gap-6 text-xl md:text-2xl font-medium leading-none">
                      <Link href="https://www.instagram.com/hollostudioco" className="hover:text-brand-red transition-colors">Instagram</Link>
                      <Link href="#" className="hover:text-brand-red transition-colors">LinkedIn</Link>
                      <Link href="#" className="hover:text-brand-red transition-colors">Twitter</Link>
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