'use client';

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const AnimatedButtonText = ({ children }) => {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const innerWrapper = wrapper.querySelector(".inner-wrapper");

    const handleEnter = () => {
      gsap.to(innerWrapper, {
        y: "-100%",
        duration: 0.3,
        ease: "power2.inOut",
      });
    };

    const handleLeave = () => {
      gsap.to(innerWrapper, {
        y: "0%",
        duration: 0.3,
        ease: "power2.inOut",
      });
    };

    const button = wrapper.closest('button');
    if (button) {
      button.addEventListener("mouseenter", handleEnter);
      button.addEventListener("mouseleave", handleLeave);

      return () => {
        button.removeEventListener("mouseenter", handleEnter);
        button.removeEventListener("mouseleave", handleLeave);
      };
    }
  }, []);

  return (
    <span
      ref={wrapperRef}
      className="slot-link relative overflow-hidden block"
    >
      <span className="inner-wrapper block relative">
        <span className="inner-text block">{children}</span>
        <span className="inner-text block absolute top-full">{children}</span>
      </span>
    </span>
  );
};

export default AnimatedButtonText;
