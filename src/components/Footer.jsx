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
      className="relative w-full bg-brand-black text-brand-white pt-24 pb-12 px-6 md:px-12 overflow-hidden"
    >
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/noise.png')] mix-blend-overlay"></div>

      {/* Main Top Content */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-y-16 gap-x-0 mb-32 md:mb-48">
        
        {/* Left: Brand Logo */}
        <div className="footer-item md:col-span-4">
          <Link href="/" className="group block">
            <Text>
              <div className="text-4xl md:text-6xl font-headline uppercase tracking-normal flex items-center gap-1">
                Hollow Studio
              </div>
            </Text>
          </Link>
        </div>


        {/* Right: Navigation Columns */}
        
          
          {/* Menu Column */}
          <div className="footer-item flex flex-col md:col-[10/span_1]">
            <Text>
              <h3 className="text-xs uppercase tracking-widest text-brand-grey font-medium">Menu</h3>
            </Text>
            <nav className="flex flex-col gap-4">
              {['Index', 'Projects', 'Contact'].map((item) => (
                <Link 
                  key={item} 
                  href={item === 'Index' ? '/' : `/${item.toLowerCase()}`}
                  className="text-lg md:text-xl font-bold uppercase tracking-wide hover:text-brand-red transition-colors"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>

          {/* Socials Column */}
          <div className="footer-item flex flex-col md:col-[11/span_1]">
            <Text>
              <h3 className="text-xs uppercase tracking-widest text-brand-grey font-medium">Socials</h3>
            </Text>
            <nav className="flex flex-col gap-4">
              {['Instagram', 'LinkedIn', 'TikTok'].map((social) => (
                <Link 
                  key={social} 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lg md:text-xl font-bold uppercase tracking-wide hover:text-brand-red transition-colors"
                >
                  {social}
                </Link>
              ))}
            </nav>
          </div>

        
      </div>

      {/* Bottom Row: Copyright & Credits */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-4 text-sm font-medium uppercase tracking-wide">
        
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