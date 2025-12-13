'use client'
import React, { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Icon } from "@iconify/react";

const Works = () => {
  const [activeImage, setActiveImage] = useState(null);
  const overlayRefs = useRef([]);
  const previewRef = useRef(null);
  const moveX = useRef(null);
  const moveY = useRef(null);

  const projects = [
    {
      id: 1,
      name: "Project One",
      type: "Web Design",
      link: "#",
      image: "https://placehold.co/600x400/1a1a1a/white?text=Project+One",
      year: 2024,
    },
    {
      id: 2,
      name: "Project Two",
      type: "Web Development",
      link: "#",
      image: "https://placehold.co/600x400/1a1a1a/white?text=Project+Two",
      year: 2023,
    },
  ];

  useGSAP(() => {
    gsap.set(previewRef.current, { xPercent: -50, yPercent: -50 });

    moveX.current = gsap.quickTo(previewRef.current, "x", {
      duration: 0.5,
      ease: "power3.out",
    });
    moveY.current = gsap.quickTo(previewRef.current, "y", {
      duration: 0.5,
      ease: "power3.out",
    });

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

  const handleMouseMove = (e) => {
    if (moveX.current && moveY.current) {
      moveX.current(e.clientX);
      moveY.current(e.clientY);
    }
  };

  const handleMouseEnter = (index, projectImage) => {
    setActiveImage(projectImage);

    const el = overlayRefs.current[index];
    if (el) {
      gsap.to(el, { height: "100%", duration: 0.3, ease: "power2.out", overwrite: true });
    }

    if (previewRef.current) {
        gsap.to(previewRef.current, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.4,
            ease: "power3.out",
            overwrite: "auto", 
        })
    }
  };

  const handleMouseLeave = (index) => {
    const el = overlayRefs.current[index];
    if (el) {
      gsap.to(el, { height: "0%", duration: 0.3, ease: "power2.in", overwrite: true });
    }

    if (previewRef.current) {
        gsap.to(previewRef.current, {
            autoAlpha: 0,
            scale: 0.8,
            duration: 0.3,
            ease: "power3.out",
            overwrite: "auto",
        })
    }
  };

  return (
    <section 
      id="works" 
      onMouseMove={handleMouseMove}
      // UPDATED: 
      // 1. Removed inline style={{ paddingLeft: ... }}
      // 2. Added 'px-4' for Mobile (small gap)
      // 3. Added 'md:px-[var(--spacing-margin)]' for Desktop (custom large gap)
      className="flex flex-col min-h-screen bg-brand-black text-white relative px-4 sm:px-6 md:px-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end py-12">
        <div className="mb-4 md:mb-0 w-full md:w-auto text-left">
          <h2 className="text-4xl md:text-5xl font-headline uppercase text-white">Projects</h2>
        </div>
        <div className="max-w-md text-left md:text-right w-full md:w-auto">
          <p className="text-lg md:text-xl text-white/80">
            We help modern brands show up with clarity, presence, and purposeful digital design.
          </p>
        </div>
      </div>

      <div
        ref={previewRef}
        className="fixed top-0 left-0 w-[350px] h-[250px] z-50 pointer-events-none hidden md:block opacity-0"
      >
        {activeImage && (
            <img 
                src={activeImage}
                alt="preview"
                className="w-full h-full object-cover rounded-lg border border-white/20 shadow-2xl"
            />
        )}
      </div>

      {/* --- DESKTOP VIEW --- */}
      <div 
        id="works-list" 
        className="hidden md:flex flex-col w-full mt-10"
        onMouseLeave={() => {
            if (previewRef.current) {
                gsap.to(previewRef.current, {
                    autoAlpha: 0,
                    scale: 0.8,
                    duration: 0.3,
                    ease: "power3.out",
                    overwrite: "auto"
                });
            }
        }}
      >
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="project-item relative group w-full border-b border-brand-grey/30 cursor-pointer overflow-hidden"
            onMouseEnter={() => handleMouseEnter(index, project.image)}
            onMouseLeave={() => handleMouseLeave(index)}
            onClick={() => window.open(project.link, "_blank")}
          >
            <div
              ref={(el) => (overlayRefs.current[index] = el)}
              className="absolute top-0 left-0 w-full h-0 bg-brand-red -z-10"
            />
            
            <div className="relative z-10 pt-8 pb-2 md:pt-14 md:pb-3 grid grid-cols-12 gap-x-4 items-end">
              <div className="col-span-8">
                <h2 className="text-4xl md:text-6xl font-headline uppercase leading-none tracking-tight group-hover:text-white transition-colors duration-300">
                  {project.name}
                </h2>
              </div>
              <div className="col-span-2">
                <p className="text-sm md:text-base font-medium text-brand-grey group-hover:text-white transition-colors duration-300 pb-1">
                  {project.type || "Web Development"}
                </p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-sm md:text-base font-medium text-brand-grey group-hover:text-white transition-colors duration-300 pb-1">
                  {project.year}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MOBILE VIEW --- */}
      <div id="mobile-works-list" className="flex md:hidden flex-col gap-6 pb-12 mt-4">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="mobile-project-card flex flex-col gap-3"
            onClick={() => window.open(project.link, "_blank")}
          > 
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-start">
                 <h3 className="text-3xl font-headline uppercase leading-none text-white">{project.name}</h3>
                 <Icon icon="lucide:arrow-up-right" className="text-white/70 size-6 transition-colors duration-300" />
              </div>
              <div className="flex justify-between items-center">
                 <p className="text-sm text-brand-grey">{project.type || "Web Development"}</p>
                 <p className="text-sm text-brand-grey">{project.year}</p>
              </div>
            </div>
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-sm bg-gray-800">
              <img 
                src={project.image} 
                alt={project.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full h-[1px] bg-brand-grey/20 mt-1"></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Works;