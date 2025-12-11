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
      // --- NAV BRAND & OVERLAY SETUP ---
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

      // --- BURGER MENU INITIAL STATE ---
      gsap.set(topLineRef.current, { y: -5 }) 
      gsap.set(bottomLineRef.current, { y: 5 }) 

      // --- TIMELINE SETUP ---
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
      gsap.to(topLineRef.current, { 
        rotate: 45, 
        y: 0, 
        duration: 0.25, 
        ease: 'power2.out' 
      })
      gsap.to(bottomLineRef.current, { 
        rotate: -45, 
        y: 0, 
        duration: 0.25, 
        ease: 'power2.out' 
      })
    } else {
      tl.current.reverse()
      gsap.to(topLineRef.current, { 
        rotate: 0, 
        y: -5, 
        duration: 0.25, 
        ease: 'power2.out' 
      })
      gsap.to(bottomLineRef.current, { 
        rotate: 0, 
        y: 5, 
        duration: 0.25, 
        ease: 'power2.out' 
      })
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
      {/* UPDATED: text-brand-white */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 py-6 md:py-9 mix-blend-difference text-brand-white">
        
        <div className="nav-brand-wrapper z-50">
          {/* UPDATED: Added hover:text-brand-red */}
          <Link href="/" aria-label="Home" className="cursor-pointer hover:text-brand-red transition-colors duration-300 block">
            <span className="text-[20px] md:text-[28px] tracking-tighter font-bold uppercase">
              Hollow Studio
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-[60px]">
          <div
            ref={desktopLinksRef}
            className="hidden md:flex items-center gap-16 font-bold uppercase tracking-wide"
          >
            {navLinks.map(item => (
              <div key={item.name}>
                {/* UPDATED: Removed Underline Span & Group logic. Added hover:text-brand-red */}
                <Link
                  href={item.href}
                  className="hover:text-brand-red transition-colors duration-300 block"
                >
                  {item.name}
                </Link>
              </div>
            ))}
          </div>

          <button
            onClick={toggleMenu}
            className="relative z-50 w-8 h-8 cursor-pointer block group"
            aria-label="Toggle Menu"
          >
            {/* UPDATED: bg-white -> bg-brand-white */}
            {/* Optional: If you want the lines to turn red on hover too, add group-hover:bg-brand-red */}
            <span 
              ref={topLineRef} 
              className="absolute top-1/2 left-0 w-full h-[2px] bg-brand-white group-hover:bg-brand-red transition-colors duration-300 block -translate-y-1/2 transform-gpu"
            ></span>
            <span 
              ref={bottomLineRef} 
              className="absolute top-1/2 left-0 w-full h-[2px] bg-brand-white group-hover:bg-brand-red transition-colors duration-300 block -translate-y-1/2 transform-gpu"
            ></span>
          </button>
        </div>
      </nav>

      <div
        ref={navOverlayRef}
        className="fixed inset-0 z-40 bg-black flex flex-col justify-center px-10 md:w-1/2 md:left-1/2 md:border-l md:border-brand-white/10"
      >
        <div className="flex flex-col gap-6 mb-12">
          {navLinks.map(item => (
            <div key={item.name} className="overlay-link-wrapper overflow-hidden">
              {/* UPDATED: text-brand-white, hover:text-brand-red */}
              <Link
                href={item.href}
                onClick={toggleMenu} 
                className="text-5xl md:text-6xl font-bold uppercase text-brand-white hover:text-brand-red transition-colors duration-300 tracking-tight block"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>

        {/* UPDATED: Border color */}
        <div className="overlay-contact flex flex-col gap-6 pt-10 border-t border-brand-white">
          <div>
            {/* UPDATED: text colors */}
            <p className="tracking-wider text-brand-white text-xs uppercase mb-1">Get in touch</p>
            <p className="text-xl text-brand-white tracking-widest">hello@hollowstudio.com</p>
          </div>
          <div className="flex gap-4">
            {['Instagram', 'Twitter', 'LinkedIn'].map(social => (
              // UPDATED: text-brand-white/70, hover:text-brand-red
              <Link 
                key={social} 
                href="#" 
                className="text-sm text-brand-white uppercase tracking-widest hover:text-brand-red transition-colors duration-300"
              >
                [{social}]
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar