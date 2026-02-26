'use client'
import React, { useLayoutEffect, useRef } from 'react'
import Link from './template/Link'
import Text from './template/Text'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin' // 1. Import ScrollTo

// Register Plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)
}

const Footer = () => {
  const footerRef = useRef(null)

  // 2. Smooth Scroll Handler
  const handleScroll = (e, id) => {
    e.preventDefault();
    if (id === 'homepage') {
      gsap.to(window, { duration: 1.5, scrollTo: 0, ease: "power4.inOut" });
    } else {
      gsap.to(window, { 
        duration: 1.5, 
        scrollTo: { y: `#${id}`, offsetY: 0 }, 
        ease: "power4.inOut" 
      });
    }
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.footer-item', {
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 90%',
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
      className="relative w-full min-h-[50vh] bg-brand-black text-brand-white pt-16 md:pt-24 pb-8 md:pb-12 overflow-hidden px-4 sm:px-6 md:px-12"
    >
      <div className="relative z-10 mb-20 md:mb-32 lg:mb-48 grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-y-0">
        
        {/* Left: Brand Logo */}
        <div className="footer-item md:col-start-1 md:col-span-4">
          <Link 
            href="/" 
            onClick={(e) => handleScroll(e, 'homepage')} 
            className="group block"
          >
            <Text>
              <div className="text-3xl sm:text-4xl md:text-6xl font-headline uppercase tracking-normal flex items-center gap-1">
                Hollo Studio
              </div>
            </Text>
          </Link>

          <div className="mt-6 md:mt-8">
            <Text>
               <p className="text-sm md:text-sm lg:text-base  max-w-sm uppercase tracking-wide leading-relaxed">
                 Based in Gading Serpong.<br/>
                 Serving clients across Jakarta<br/>
                 and worldwide.
               </p>
            </Text>
          </div>
        </div>

        {/* Right: Navigation Columns */}
        <div className="footer-item grid grid-cols-2 gap-8 md:col-start-7 md:col-span-6">
          <div className="flex flex-col">
            <Text>
              <h3 className="text-xs uppercase tracking-widest text-brand-grey font-medium mb-4">Menu</h3>
            </Text>
            <nav className="flex flex-col gap-3 md:gap-4">
              {['Homepage', 'Projects', 'Contact'].map((item) => (
                <Link 
                  key={item} 
                  // 3. Updated Href to Anchors
                  href={`#${item.toLowerCase()}`}
                  onClick={(e) => handleScroll(e, item.toLowerCase())}
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
                  href={
                  social === 'Instagram' ? 'https://www.instagram.com/hollowebstudio' :
                    social === 'LinkedIn' ? 'https://www.linkedin.com/in/sandya-pradayan-baa04b213/' :
                    'https://x.com/sandyaporto'
                  }
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

      {/* Bottom Row */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4 text-xs md:text-sm font-medium uppercase tracking-wide">
        <div className="footer-item text-brand-white/80">
          <Text><span>2026 | Hollo Studio</span></Text>
        </div>
        <div className="footer-item text-brand-white/80">
          <Text><span>Created by Sandya Pradayan</span></Text>
        </div>
      </div>
    </footer>
  )
}

export default Footer