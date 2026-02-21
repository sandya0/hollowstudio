'use client'
import React, { useLayoutEffect, useRef, useState } from 'react'
import Link from './template/Link' 
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

// Register GSAP Plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)
}

const Navbar = () => {
  const containerRef = useRef(null)
  const navOverlayRef = useRef(null)
  const desktopLinksRef = useRef(null) 
  const logoTextRef = useRef(null);
  const tl = useRef(null)

  const [isOpen, setIsOpen] = useState(false)

  // --- SMOOTH SCROLL LOGIC ---
  const handleScroll = (e, id) => {
    e.preventDefault();
    
    // If we're on mobile/tablet and the menu is open, close it first
    if (isOpen) {
      toggleMenu();
    }

    // Determine target: 'homepage' goes to top (0), others go to #id
    const target = id === 'homepage' ? 0 : `#${id}`;
    
    gsap.to(window, { 
      duration: 1.5, 
      scrollTo: {
        y: target,
        autoKill: true // Allows user to interrupt scroll by wheeling
      }, 
      ease: 'power4.inOut' 
    });
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // --- INITIAL ANIMATIONS & SETTINGS ---
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

      // Burger Menu Initial State
      gsap.set('.burger-line-top', { y: -5 }) 
      gsap.set('.burger-line-bottom', { y: 5 }) 

      // --- OVERLAY TIMELINE ---
      tl.current = gsap.timeline({ paused: true })

      tl.current
        .to('.desktop-nav-link', {
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

  // --- LOGO VISIBILITY ON SCROLL ---
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const heroSection = document.querySelector('#hero-section');
    if (heroSection) {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroSection,
          start: 'bottom top',
          toggleActions: 'play none none reverse',
        },
      });

      scrollTl.to(logoTextRef.current, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
      });
    }
  }, []);

  const toggleMenu = () => {
    if (!tl.current) return

    if (!isOpen) {
      tl.current.play()
      gsap.to('.burger-line-top', { 
        rotate: 45, 
        y: 0, 
        duration: 0.25, 
        ease: 'power2.out' 
      })
      gsap.to('.burger-line-bottom', { 
        rotate: -45, 
        y: 0, 
        duration: 0.25, 
        ease: 'power2.out' 
      })
    } else {
      tl.current.reverse()
      gsap.to('.burger-line-top', { 
        rotate: 0, 
        y: -5, 
        duration: 0.25, 
        ease: 'power2.out' 
      })
      gsap.to('.burger-line-bottom', { 
        rotate: 0, 
        y: 5, 
        duration: 0.25, 
        ease: 'power2.out' 
      })
    }
    setIsOpen(prev => !prev)
  }

  const navLinks = [
    { name: 'Homepage', id: 'homepage' },
    { name: 'Projects', id: 'projects' },
    { name: 'Contact', id: 'contact' }
  ]

  return (
    <div ref={containerRef}>
      <nav className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 md:px-12 py-6 md:py-9 text-brand-white pointer-events-none">
        
        {/* Brand Logo */}
        <div className="nav-brand-wrapper z-50 absolute left-6 md:left-12 top-6 md:top-9 pointer-events-auto">
          <a 
            href="#homepage" 
            onClick={(e) => handleScroll(e, 'homepage')} 
            aria-label="Home" 
            className="cursor-pointer hover:text-brand-red transition-colors duration-300 block"
          >
            <span ref={logoTextRef} className="text-[20px] md:text-[28px] font-headline tracking-wider font-bold uppercase opacity-0">
              Hollo Studio
            </span>
          </a>
        </div>

        {/* Desktop Links Container */}
        <div
          ref={desktopLinksRef}
          className="hidden md:block fixed top-6 md:top-9 left-0 right-0 z-40 pointer-events-none"
          style={{
            paddingLeft: 'var(--spacing-margin)',
            paddingRight: 'var(--spacing-margin)'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '0 var(--spacing-gutter)',
              alignItems: 'center'
            }}
          >
            {/* Nav Mapping (Columns 9, 10, 11) */}
            {navLinks.map((link, index) => (
              <div 
                key={link.id}
                style={{ gridColumn: `${9 + index} / ${10 + index}` }} 
                className="desktop-nav-link pointer-events-auto"
              >
                <Link 
                  href={`#${link.id}`} 
                  onClick={(e) => handleScroll(e, link.id)}
                  className="hover:text-brand-red transition-colors duration-300 block font-bold uppercase tracking-wide"
                >
                  {link.name}
                </Link>
              </div>
            ))}

            {/* Desktop Burger - Column 12 */}
            <div 
              style={{ gridColumn: '12 / 13' }} 
              className="flex justify-end pointer-events-auto"
            >
              <button
                onClick={toggleMenu}
                className="relative w-8 h-8 cursor-pointer block group"
                aria-label="Toggle Menu"
              >
                <span className="burger-line-top absolute top-1/2 left-0 w-full h-[2px] bg-brand-white group-hover:bg-brand-red transition-colors duration-300 block -translate-y-1/2 transform-gpu"></span>
                <span className="burger-line-bottom absolute top-1/2 left-0 w-full h-[2px] bg-brand-white group-hover:bg-brand-red transition-colors duration-300 block -translate-y-1/2 transform-gpu"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Burger Menu */}
        <div className="md:hidden absolute right-6 top-6 z-50 pointer-events-auto">
          <button
            onClick={toggleMenu}
            className="relative w-8 h-8 cursor-pointer block group"
            aria-label="Toggle Menu"
          >
            <span className="burger-line-top absolute top-1/2 left-0 w-full h-[2px] bg-brand-white group-hover:bg-brand-red transition-colors duration-300 block -translate-y-1/2 transform-gpu"></span>
            <span className="burger-line-bottom absolute top-1/2 left-0 w-full h-[2px] bg-brand-white group-hover:bg-brand-red transition-colors duration-300 block -translate-y-1/2 transform-gpu"></span>
          </button>
        </div>
      </nav>

      {/* NAV OVERLAY */}
      <div
        ref={navOverlayRef}
        className="fixed inset-0 z-40 bg-black flex flex-col justify-center px-10 md:w-1/2 md:left-1/2 md:border-l md:border-brand-white/10"
      >
        <div className="flex flex-col gap-6 mb-12">
          {navLinks.map(item => (
            <div key={item.id} className="overlay-link-wrapper overflow-hidden">
              <Link
                href={`#${item.id}`}
                onClick={(e) => handleScroll(e, item.id)} 
                className="text-5xl md:text-6xl font-bold uppercase text-brand-white hover:text-brand-red transition-colors duration-300 tracking-tight block"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="overlay-contact flex flex-col gap-6 pt-10 border-t border-brand-white">
          <div>
            <p className="tracking-wider text-brand-white text-xs uppercase mb-1">Get in touch</p>
            <p className="text-xl text-brand-white tracking-widest">hello@hollostudio.com</p>
          </div>
          <div className="flex gap-4">
            {['Instagram', 'Twitter', 'LinkedIn'].map(social => (
              <Link 
                key={social} 
                href={social === 'Instagram' ? 'https://www.instagram.com/hollowebstudio' : '#'}
                target="_blank" 
                rel="noopener noreferrer"
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