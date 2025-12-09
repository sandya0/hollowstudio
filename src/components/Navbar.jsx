'use client'
import React, { useLayoutEffect, useRef, useState } from 'react'
import Link from './template/Link'
import gsap from 'gsap'

const Navbar = () => {
  const containerRef = useRef(null)
  const navOverlayRef = useRef(null)
  const desktopLinksRef = useRef(null)
  const topLineRef = useRef(null)
  const bottomLineRef = useRef(null)
  const tl = useRef(null)

  const [isOpen, setIsOpen] = useState(false)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Target the WRAPPER (.nav-brand-wrapper), not the Link component directly
      gsap.from('.nav-brand-wrapper', {
        y: -20,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out'
      })

      gsap.set(navOverlayRef.current, {
        xPercent: 100,
        autoAlpha: 0,
        pointerEvents: 'none',
        visibility: 'visible'
      })

      gsap.set('.overlay-link-wrapper', { x: 50, autoAlpha: 0 })
      gsap.set('.overlay-contact', { x: 20, autoAlpha: 0 })

      tl.current = gsap.timeline({ paused: true })

      tl.current
        .to(desktopLinksRef.current, {
          autoAlpha: 0,
          duration: 0.3,
          ease: 'power1.out'
        }, 0)
        .to(navOverlayRef.current, {
          xPercent: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: 'power3.inOut',
          pointerEvents: 'auto'
        }, 0)
        // 2. Animate the wrappers in the overlay
        .to('.overlay-link-wrapper', {
          autoAlpha: 1,
          x: 0,
          stagger: 0.12,
          duration: 0.5,
          ease: 'power2.out'
        }, '-=0.4')
        .to('.overlay-contact', {
          autoAlpha: 1,
          x: 0,
          duration: 0.5,
          ease: 'power2.out'
        }, '-=0.3')

      tl.current.eventCallback('onReverseComplete', () => {
        gsap.set(navOverlayRef.current, { pointerEvents: 'none' })
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const toggleMenu = () => {
    if (!tl.current) return

    if (!isOpen) {
      tl.current.play()
      gsap.to(topLineRef.current, { rotate: 45, y: 6, duration: 0.25, ease: 'power2.out' })
      gsap.to(bottomLineRef.current, { rotate: -45, y: -6, duration: 0.25, ease: 'power2.out' })
    } else {
      tl.current.reverse()
      gsap.to(topLineRef.current, { rotate: 0, y: 0, duration: 0.25, ease: 'power2.out' })
      gsap.to(bottomLineRef.current, { rotate: 0, y: 0, duration: 0.25, ease: 'power2.out' })
    }

    setIsOpen(prev => !prev)
  }

  const navLinks = [
    { name: 'Index', href: '/' },
    { name: 'Projects', href: '/projects' },
    { name: 'Contact', href: '/contact' }
  ]

  return (
    <div ref={containerRef}>
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 py-6 md:py-9 mix-blend-difference text-white">
        
        {/* FIX 1: Wrapped the Brand Link. GSAP targets .nav-brand-wrapper */}
        <div className="nav-brand-wrapper z-50">
          <Link href="/" className="cursor-pointer">
             {/* Assuming the Link renders children, otherwise pass label as prop */}
            <span className="text-[20px] md:text-[28px] tracking-tighter font-bold uppercase">
               {/* Add your logo text here if needed, currently empty in your code */}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-[60px]">
          {/* FIX 2: Desktop Links Container. 
              The GSAP opacity animation targets 'desktopLinksRef' (the parent div), 
              so it won't conflict with internal Link animations. */}
          <div
            ref={desktopLinksRef}
            className="hidden md:flex items-center gap-16 font-bold uppercase tracking-wide"
          >
            {navLinks.map(item => (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className="hover:text-gray-300 transition-colors block"
                >
                  {item.name}
                </Link>
                {/* Moved the underline effect to a standalone span to avoid conflict with Link component styles */}
                <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
              </div>
            ))}
          </div>

          <button
            onClick={toggleMenu}
            className="z-50 flex flex-col justify-center gap-[6px] w-8 h-8 cursor-pointer"
          >
            <span ref={topLineRef} className="w-full h-[2px] bg-white block"></span>
            <span ref={bottomLineRef} className="w-full h-[2px] bg-white block"></span>
          </button>
        </div>
      </nav>

      <div
        ref={navOverlayRef}
        className="fixed inset-0 z-40 bg-black flex flex-col justify-center px-10 md:w-1/2 md:left-1/2 md:border-l md:border-white/10"
      >
        <div className="flex flex-col gap-6 mb-12">
          {navLinks.map(item => (
            // FIX 3: Wrapper for Overlay Links.
            // GSAP animates '.overlay-link-wrapper', leaving <Link> alone.
            <div key={item.name} className="overlay-link-wrapper overflow-hidden">
               {/* NOTE: If your Link component has an internal onClick, 
                  passing onClick={toggleMenu} might override it. 
                  If navigation breaks, move toggleMenu to the wrapper div (with limitations)
                  or ensure your Custom Link forwards the onClick prop.
               */}
              <Link
                href={item.href}
                onClick={toggleMenu} 
                className="text-5xl md:text-6xl font-bold uppercase text-white hover:text-gray-400 transition-colors tracking-tight block"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="overlay-contact flex flex-col gap-6 pt-10 border-t border-white/20">
          <div>
            <p className="tracking-wider text-white/50 text-xs uppercase mb-1">Get in touch</p>
            <p className="text-xl text-white tracking-widest">hello@hollowstudio.com</p>
          </div>
          <div className="flex gap-4">
            {['Instagram', 'Twitter', 'LinkedIn'].map(social => (
              <a key={social} href="#" className="text-sm text-white/70 uppercase tracking-widest hover:text-white">
                [{social}]
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar