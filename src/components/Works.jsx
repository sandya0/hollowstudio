'use client'
import React, { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Icon } from "@iconify/react";

const Works = () => {
  const [currentIndex, setCurrentIndex] = useState(null);
  const overlayRefs = useRef([]);

  // Mock data - replace with your actual import if needed
  const projects = [
    {
      id: 1,
      name: "Project One",
      type: "Web Design",
      link: "#",
      image: "https://placehold.co/600x400/1a1a1a/white?text=Project+One", // Placeholder image
      year: 2024,
    },
    {
      id: 2,
      name: "Project Two",
      type: "Web Development",
      link: "#",
      image: "https://placehold.co/600x400/1a1a1a/white?text=Project+Two", // Placeholder image
      year: 2023,
    },
  ];

  // GSAP for entrance animation
  useGSAP(() => {
    // Desktop Animation
    gsap.from(".project-item", {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: "#works-list",
        start: "top 80%",
      },
    });

    // Mobile Animation (Simple fade up for cards)
    gsap.from(".mobile-project-card", {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#mobile-works-list",
        start: "top 85%",
      },
    });
  }, []);

  const handleMouseEnter = (index) => {
    setCurrentIndex(index);
    const el = overlayRefs.current[index];
    if (!el) return;

    gsap.to(el, {
      height: "100%",
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (index) => {
    setCurrentIndex(null);
    const el = overlayRefs.current[index];
    if (!el) return;

    gsap.to(el, {
      height: "0%",
      duration: 0.3,
      ease: "power2.in",
    });
  };

  return (
    <section id="works" className="flex flex-col min-h-screen bg-brand-black text-white">
      {/* Header Div */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end px-6 md:px-12 py-12">
        <div className="mb-4 md:mb-0 w-full md:w-auto text-left">
          <h2 className="text-4xl md:text-5xl font-headline uppercase text-white">Projects</h2>
        </div>
        <div className="max-w-md text-left md:text-right w-full md:w-auto">
          <p className="text-lg md:text-xl text-white/80">
            We help modern brands show up with clarity, presence, and purposeful digital design.
          </p>
        </div>
      </div>

      {/* --- DESKTOP VIEW (Hidden on Mobile) --- */}
      <div id="works-list" className="hidden md:flex flex-col w-full mt-10">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="project-item relative group w-full border-b border-brand-grey/30 cursor-pointer overflow-hidden"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={() => handleMouseLeave(index)}
            onClick={() => window.open(project.link, "_blank")}
          >
            {/* Orange Background Overlay */}
            <div
              ref={(el) => (overlayRefs.current[index] = el)}
              className="absolute top-0 left-0 w-full h-0 bg-brand-red -z-10"
            />

            {/* Content Container */}
            <div className="relative z-10 flex items-center justify-between w-full px-6 py-8 md:px-12 md:py-10">
              
              {/* Left: Project Name */}
              <div className="flex-1">
                <h2 className="text-4xl md:text-6xl font-headline uppercase leading-none tracking-tight group-hover:text-white transition-colors duration-300">
                  {project.name}
                </h2>
              </div>

              {/* Center: Type */}
              <div className="hidden md:block w-1/4 text-center">
                <p className="text-sm md:text-base font-medium text-brand-grey group-hover:text-white transition-colors duration-300">
                  {project.type || "Web Development"}
                </p>
              </div>

              {/* Right: Year */}
              <div className="w-1/4 text-right">
                <p className="text-sm md:text-base font-medium text-brand-grey group-hover:text-white transition-colors duration-300">
                  {project.year}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

{/* --- MOBILE VIEW (Visible only on Mobile) --- */}
      <div id="mobile-works-list" className="flex md:hidden flex-col gap-10 px-6 pb-20 mt-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="mobile-project-card flex flex-col gap-4" // increased gap for better spacing
            onClick={() => window.open(project.link, "_blank")}
          > 
            {/* 1. Text Info (Now at the top) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                 <h3 className="text-3xl font-headline uppercase leading-none text-white">{project.name}</h3>
                 <Icon icon="lucide:arrow-up-right" className="text-white/70 size-6 transition-colors duration-300" />
              </div>
              
              <div className="flex justify-between items-center">
                 <p className="text-sm text-brand-grey">{project.type || "Web Development"}</p>
                 <p className="text-sm text-brand-grey">{project.year}</p>
              </div>
            </div>

            {/* 2. Image Container (Now below the title) */}
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-sm bg-gray-800">
              <img 
                src={project.image} 
                alt={project.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Divider */}
            <div className="w-full h-[1px] bg-brand-grey/20 mt-2"></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Works;