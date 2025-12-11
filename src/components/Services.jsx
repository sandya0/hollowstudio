'use client'
import React, { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Text from './template/Text'

// Register ScrollTrigger (Safety check)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const servicesData = [
  {
    title: 'Strategy',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    ),
    description: "We start by aligning your website with your business goals before touching any design. This involves understanding your business and audience, structuring content and pages, defining what the website needs to achieve, and planning features along with user flow. The result is a website built with clear direction, not guesswork."
  },
  {
    title: 'Design',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    description: "Our design process is driven by clarity and intention. We focus on layout and visual direction, typography and spacing systems, UI design in Figma, and responsive design thinking. The outcome is a website that not only looks good but also feels intuitive and enjoyable to use."
  },
  {
    title: 'Development',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="4 4"/>
      </svg>
    ),
    description: "We build websites that perform, not just exist. This includes clean development, mobile-first implementation, speed and performance optimization, SEO-ready structure, and deployment setup. The end result is a website that works fast, smooth, and reliably for your users."
  }
]

const Services = () => {
  const containerRef = useRef(null)
  const gridRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // We only need manual GSAP here for the LINES and the ICONS.
      // The TEXT is now handled by the <Text> component.

      // 1. Animate Horizontal Lines
      gsap.from('.service-divider', {
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 85%',
        },
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.2,
        ease: 'expo.out'
      })

      // 2. Animate Service Icons and Titles Container
      gsap.from('.service-header', {
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 75%',
        },
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out'
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-screen w-full bg-brand-black text-brand-white px-6 md:px-12 py-24 flex flex-col justify-between"
    >


      {/* Main Headline */}
      <div className="relative z-10 mb-20 xl:mb-32 min-w-[100%] mx-auto">
        <Text delay={0.1}>
          <h2 className="text-xl md:text-3xl lg:text-[32px] xl:text-[48px] 2xl:text-[64px] leading-[1.1] font-bold uppercase tracking-tight">
            {/* Indentation Spacer */}
            <span className="inline-block w-16 md:w-32 lg:w-[15%] h-1 align-middle"></span>
            
            FROM FIRST IDEA TO FINAL BUILD, OUR PROCESS IS SIMPLE AND INTENTIONAL. WE START WITH <span className="text-brand-red">STRATEGY</span>, <span className="text-brand-red">DESIGN WITH PURPOSE</span>, AND <span className="text-brand-red">DEVELOP FOR PERFORMANCE</span>. EVERY STEP EXISTS FOR A REASON — TO CREATE WEBSITES THAT DON’T JUST LOOK GOOD, BUT WORK WELL.
          </h2>
        </Text>
      </div>

      {/* Services Grid */}
      <div ref={gridRef} className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16">
        
        {servicesData.map((service, index) => (
          <div key={index} className="flex flex-col gap-6">
            {/* Divider Line */}
            <div className="service-divider w-full h-[1px] bg-brand-white mb-2"></div>
            
            {/* Header (Icon + Title) */}
            <div className="service-header flex items-center gap-3 text-brand-white">
              {service.icon}
              <Text>
                <h3 className="text-base md:text-xl xl:text-2xl font-bold uppercase tracking-wide">
                  {service.title}
                </h3>
              </Text>
            </div>
            
            {/* Description - CHANGED TO WHITE */}
            <div className="text-brand-white text-xs md:text-base xl:text-base leading-relaxed">
              <Text delay={0.2 + (index * 0.1)}>
                <p>{service.description}</p>
              </Text>
            </div>
          </div>
        ))}

      </div>


    </section>
  )
}

export default Services