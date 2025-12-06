'use client'
import React, { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
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
      gsap.from('.nav-brand', { y: -20, opacity: 0, duration: 0.8, ease: 'power3.out' })

      gsap.set(navOverlayRef.current, { xPercent: 100, autoAlpha: 0, pointerEvents: 'none' })
      gsap.set('.overlay-link', { x: 50, autoAlpha: 0 })
      gsap.set('.overlay-contact', { x: 20, autoAlpha: 0 })

      tl.current = gsap.timeline({ paused: true })
        .to(desktopLinksRef.current, { autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, 0)
        .to(navOverlayRef.current, { xPercent: 0, autoAlpha: 1, pointerEvents: 'auto', duration: 0.8, ease: 'power3.inOut' }, 0)
        .to('.overlay-link', { autoAlpha: 1, x: 0, stagger: 0.12, duration: 0.5, ease: 'power2.out' }, '-=0.4')
        .to('.overlay-contact', { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')

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
      gsap.to(topLineRef.current, { rotate: 45, y: 5, duration: 0.3 })
      gsap.to(bottomLineRef.current, { rotate: -45, y: -5, duration: 0.3 })
    } else {
      tl.current.reverse()
      gsap.to(topLineRef.current, { rotate: 0, y: 0, duration: 0.3 })
      gsap.to(bottomLineRef.current, { rotate: 0, y: 0, duration: 0.3 })
    }

    setIsOpen(!isOpen)
  }

  const navLinks = [
    { name: 'Index', href: '/' },
    { name: 'Projects', href: '/projects' },
    { name: 'Contact', href: '/contact' }
  ]

  return (
    <div ref={containerRef}>
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 py-6 md:py-9 font-sans mix-blend-difference text-white">
        <Link href="/" className="nav-brand cursor-pointer z-50">
          <span className="text-h1 uppercase text-[20px] md:text-[28px] tracking-tighter font-bold">

          </span>
        </Link>

        <div className="flex items-center gap-[60px]">
          <div ref={desktopLinksRef} className="hidden md:flex items-center gap-16 font-bold uppercase text-h4 tracking-wide">
            {navLinks.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className="hover:text-gray-300 transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <button onClick={toggleMenu} className="z-50 flex flex-col justify-center gap-[6px] w-8 h-8">
            <span ref={topLineRef} className="w-full h-[2px] bg-white block origin-center"></span>
            <span ref={bottomLineRef} className="w-full h-[2px] bg-white block origin-center"></span>
          </button>
        </div>
      </nav>

      <div
        ref={navOverlayRef}
        style={{ visibility: 'hidden' }}
        className="fixed inset-0 z-40 bg-black flex flex-col justify-center px-10 md:w-1/2 md:left-1/2 md:border-l md:border-white/10"
      >
        <div className="flex flex-col gap-6 mb-12">
          {navLinks.map(item => (
            <div key={item.name} className="overlay-link">
              <Link
                href={item.href}
                onClick={toggleMenu}
                className="text-5xl md:text-6xl font-bold uppercase text-white hover:text-gray-400 transition-colors tracking-tight"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="overlay-contact flex flex-col gap-6 pt-10 border-t border-white/20">
          <div className="font-light">
            <p className="tracking-wider text-white/50 text-xs uppercase mb-1">Get in touch</p>
            <p className="text-xl text-white tracking-widest">hello@hollowstudio.com</p>
          </div>

          <div className="flex gap-4">
            {['Instagram', 'Twitter', 'LinkedIn'].map(social => (
              <a key={social} href="#" className="text-sm text-white/70 uppercase tracking-widest hover:text-white transition-colors">
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
