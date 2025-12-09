'use client'
import React, { useState, useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/noise.png')] mix-blend-overlay"></div>

      {/* Main Container with 36px side margins */}
      <div className="relative z-10 w-full px-[36px]">
        
        {/* Flex Container 
            - items-center: Vertically aligns the two blocks.
            - gap-[36px]: Creates the specific center gap you asked for.
        */}
        <div className="flex flex-col md:flex-row items-center w-full gap-[36px]">
          
          {/* LEFT BLOCK 
             - flex-1: Forces this to take up exactly 50% of the available space.
             - items-end / text-right: Pushes all content to the right edge (towards the center gap).
          */}
          <div className="contact-reveal flex-1 w-full flex flex-col items-center md:items-end text-center md:text-right">
            <h2 className="text-5xl md:text-7xl lg:text-[6rem] font-headline  uppercase tracking leading-[0.9]">
              READY TO BE LOUD?
            </h2>
            <p className="text-brand-white text-sm md:text-base uppercase tracking-widest pl-1 mt-2">
              Let's make something unforgettable
            </p>
          </div>

          {/* RIGHT BLOCK 
             - flex-1: Forces this to take up exactly 50% of the available space.
             - items-start / text-left: Pushes all content to the left edge (towards the center gap).
          */}
          <div className="contact-reveal flex-1 w-full flex flex-col items-center md:items-start text-center md:text-left gap-8">
            
            {/* Buttons */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button 
                onClick={() => handleTabChange('project')}
                className={`group flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-full transition-all duration-300 ${
                  activeTab === 'project' 
                    ? 'bg-brand-red text-brand-black hover:bg-white' 
                    : 'bg-transparent border border-brand-grey/30 text-brand-grey hover:border-brand-white hover:text-brand-white'
                }`}
              >
                <span className="uppercase font-bold tracking-wide text-sm md:text-base">Start a Project</span>
                <svg 
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="transition-transform duration-300 group-hover:rotate-45"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </button>

              <button 
                onClick={() => handleTabChange('follow')}
                className={`group flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-full transition-all duration-300 ${
                  activeTab === 'follow' 
                    ? 'bg-brand-white text-brand-black' 
                    : 'bg-transparent border border-brand-grey/30 text-brand-grey hover:border-brand-white hover:text-brand-white'
                }`}
              >
                <span className="uppercase font-bold tracking-wide text-sm md:text-base">Follow</span>
                <svg 
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="transition-transform duration-300 group-hover:rotate-45"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </button>
            </div>

            {/* Dynamic Content */}
            <div ref={contentRef} className="min-h-[60px] pl-2">
              {activeTab === 'project' ? (
                <div className="flex flex-col gap-1 items-center md:items-start">
                  <span className="text-xs uppercase text-brand-grey tracking-widest">Drop us a line at</span>
                  <a 
                    href="mailto:dhimassandya@gmail.com" 
                    className="text-xl md:text-2xl font-medium hover:text-brand-red transition-colors"
                  >
                    dhimassandya@gmail.com
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-1 items-center md:items-start">
                   <span className="text-xs uppercase text-brand-grey tracking-widest">Stalk us on</span>
                   <div className="flex gap-6 text-xl md:text-2xl font-medium">
                      <a href="#" className="hover:text-brand-red transition-colors">Instagram</a>
                      <a href="#" className="hover:text-brand-red transition-colors">LinkedIn</a>
                      <a href="#" className="hover:text-brand-red transition-colors">Twitter</a>
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