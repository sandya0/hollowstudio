'use client'
import React, { useLayoutEffect, useRef } from 'react'
import Link from './template/Link'
import Text from './template/Text'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const Footer = () => {
  const footerRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animate footer elements staggering up
      gsap.from('.footer-item', {
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 90%', // Triggers when top of footer hits 90% of viewport height
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out'
      })
    }, footerRef)
    return () => ctx.revert()
  }, [])

  return (
    <footer 
      ref={footerRef}
      className="relative w-full bg-brand-black text-brand-white pt-16 md:pt-24 pb-8 md:pb-12 px-4 sm:px-6 md:px-12 overflow-hidden"
    >


      {/* Main Top Content */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-y-16 gap-x-0 mb-20 md:mb-32 lg:mb-48">
        
        {/* Left: Brand Logo */}
        <div className="footer-item md:col-span-4">
          <Link href="/" className="group block">
            <Text>
              <div className="text-3xl sm:text-4xl md:text-6xl font-headline uppercase tracking-normal flex items-center gap-1">
                Hollow Studio
              </div>
            </Text>
          </Link>
        </div>


        {/* Right: Navigation Columns - Side by side on mobile */}
        <div className="footer-item md:col-[10/span_2] grid grid-cols-2 gap-8 md:gap-0 md:grid-cols-2">
          
          {/* Menu Column */}
          <div className="flex flex-col">
            <Text>
              <h3 className="text-xs uppercase tracking-widest text-brand-grey font-medium mb-4">Menu</h3>
            </Text>
            <nav className="flex flex-col gap-3 md:gap-4">
              {['Index', 'Projects', 'Contact'].map((item) => (
                <Link 
                  key={item} 
                  href={item === 'Index' ? '/' : `/${item.toLowerCase()}`}
                  className="text-base md:text-lg lg:text-xl font-bold uppercase tracking-wide hover:text-brand-red transition-colors"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>

          {/* Socials Column */}
          <div className="flex flex-col">
            <Text>
              <h3 className="text-xs uppercase tracking-widest text-brand-grey font-medium mb-4">Socials</h3>
            </Text>
            <nav className="flex flex-col gap-3 md:gap-4">
              {['Instagram', 'LinkedIn', 'TikTok'].map((social) => (
                <Link 
                  key={social} 
                  href={social === 'Instagram' ? 'https://www.instagram.com/hollowstudioco' : '#'}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base md:text-lg lg:text-xl font-bold uppercase tracking-wide hover:text-brand-red transition-colors"
                >
                  {social}
                </Link>
              ))}
            </nav>
          </div>

        </div>
      </div>

      {/* Bottom Row: Copyright & Credits */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4 text-xs md:text-sm font-medium uppercase tracking-wide">
        
        <div className="footer-item text-brand-white/80">
          <Text>
            <span>2025 | Hollow Studio</span>
          </Text>
        </div>

        <div className="footer-item text-brand-white/80">
          <Text>
            <span>Created by Sandya Pradayan</span>
          </Text>
        </div>

      </div>
    </footer>
  )
}

export default Footer