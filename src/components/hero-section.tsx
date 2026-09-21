import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

// Trusted brand logos for Layer 2
const logos = [
  { name: "Marriott", url: "https://upload.wikimedia.org/wikipedia/commons/4/44/Marriott_Logo.svg" },
  { name: "Redington", url: "https://res.cloudinary.com/dq4rkqz1l/image/upload/v1694760205/Adaptsmedia%20Tesam/Client%20Logo/Redington_wfujoj.png" },
  { name: "NBK", url: "https://res.cloudinary.com/dq4rkqz1l/image/upload/v1694760199/Adaptsmedia%20Tesam/Client%20Logo/NBK_wwy7dz.png" },
  { name: "Midea", url: "https://res.cloudinary.com/dq4rkqz1l/image/upload/v1694760194/Adaptsmedia%20Tesam/Client%20Logo/Midea_m0a6df.png" },
  { name: "Godiva", url: "https://res.cloudinary.com/dq4rkqz1l/image/upload/v1694760188/Adaptsmedia%20Tesam/Client%20Logo/Godiva_egsd3m.png" },
  { name: "Adres", url: "https://res.cloudinary.com/dq4rkqz1l/image/upload/v1694759968/Adaptsmedia%20Tesam/Client%20Logo/AM_Client-Logos_Adres_qyqhnp.png" },
  { name: "Khaleej Times", url: "https://res.cloudinary.com/dq4rkqz1l/image/upload/v1694760172/Adaptsmedia%20Tesam/Client%20Logo/AM_Client-Logos_KhaleejTimes_kae5xl.png" },
  { name: "Adidas", url: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" },
];

export function HeroSection() {
  // --- References for Parallax Layers ---
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bgGridRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null); // ADD THIS: Spotlight ref
  const logosRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLDivElement | null>(null);
  const subtitleRef = useRef<HTMLDivElement | null>(null);
  const badgesRef = useRef<HTMLDivElement | null>(null);
  const ctasRef = useRef<HTMLDivElement | null>(null);

  // --- Hover State for Spotlight Fade ---
  const [isHovered, setIsHovered] = useState(false); // ADD THIS: Hover state

  // --- Animation loop coordinates ---
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  // --- Dynamic Keyword Typing State ---
  const words = ["marketing", "technology", "development", "consulting"];
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Search & Matcher State ---
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleGetMatched = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate({
      to: "/confirm-service/",
      search: { q: searchQuery }
    });
  };

  useEffect(() => {
    const currentWord = words[activeWordIndex];
    let timer: any;

    if (!isDeleting) {
      if (displayText !== currentWord) {
        timer = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        }, 100);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 1500);
      }
    } else {
      if (displayText !== "") {
        timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 50);
      } else {
        setIsDeleting(false);
        setActiveWordIndex((prev) => (prev + 1) % words.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, activeWordIndex]);

  // --- Mouse Parallax Effect Logic ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;

    const handleMouseMove = (event: MouseEvent) => {
      setIsHovered(true); // ADD THIS: Activate hover on mouse move/enter
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Keep targets unclamped so spotlight tracks mouse to extreme edges
      targetPos.current.x = event.clientX - centerX;
      targetPos.current.y = event.clientY - centerY;
    };

    const handleMouseLeave = () => {
      setIsHovered(false); // ADD THIS: Deactivate hover on mouse leave
      // Smoothly reset back to center when mouse leaves
      targetPos.current.x = 0;
      targetPos.current.y = 0;
    };

    // Lerp loop animation
    const updateParallax = () => {
      // Lerp logic: current = current + (target - current) * lerpFactor (0.08)
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.08;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.08;

      const { x, y } = currentPos.current;

      // Clamp coordinates specifically for parallax layers to keep them within limits
      const clampedX = Math.max(-500, Math.min(500, x));
      const clampedY = Math.max(-300, Math.min(300, y));

      // Apply transforms using depth multipliers
      if (bgGridRef.current) {
        bgGridRef.current.style.transform = `translate3d(${clampedX * 0.04}px, ${clampedY * 0.04}px, 0)`;
      }
      if (spotlightRef.current) {
        // Spotlight calculation relative to top-left of container (uses unclamped coordinates for full reach)
        const centerX = container.clientWidth / 2;
        const centerY = container.clientHeight / 2;
        const spotlightX = centerX + x - 500;
        const spotlightY = centerY + y - 500;
        spotlightRef.current.style.transform = `translate3d(${spotlightX}px, ${spotlightY}px, 0)`;
      }
      if (logosRef.current) {
        logosRef.current.style.transform = `translate3d(${clampedX * 0.025}px, ${clampedY * 0.025}px, 0)`;
      }
      if (headlineRef.current) {
        headlineRef.current.style.transform = `translate3d(${clampedX * 0.02}px, ${clampedY * 0.02}px, 0)`;
      }
      if (subtitleRef.current) {
        subtitleRef.current.style.transform = `translate3d(${clampedX * 0.015}px, ${clampedY * 0.015}px, 0)`;
      }
      if (badgesRef.current) {
        badgesRef.current.style.transform = `translate3d(${clampedX * 0.008}px, ${clampedY * 0.008}px, 0)`;
      }
      if (ctasRef.current) {
        ctasRef.current.style.transform = `translate3d(${clampedX * 0.003}px, ${clampedY * 0.003}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(updateParallax);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    animationFrameId = requestAnimationFrame(updateParallax);

    // Cleanup listeners and animations on unmount
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative z-0 overflow-hidden px-6 pt-20 pb-36 md:pt-28 md:pb-48 bg-background flex flex-col items-center justify-center min-h-[620px] w-full"
    >
      {/* ========================================== */}
      {/* LAYER 1: Background Grid Pattern (Moves MOST, 0.04) (z-index: 1) */}
      {/* ========================================== */}
      <div
        ref={bgGridRef}
        className="architectural-grid absolute -inset-x-12 -inset-y-10 pointer-events-none opacity-40 z-1"
        style={{ willChange: "transform" }}
      />

      {/* ========================================== */}
      {/* LAYER 2.5: Spotlight Glow Layer (z-index: 2) */}
      {/* ========================================== */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 w-[1000px] h-[1000px] pointer-events-none rounded-full z-2"
        style={{
          willChange: "transform",
          opacity: isHovered ? 1 : 0,
          transition: `opacity ${isHovered ? "0.3s" : "0.6s"} ease`,
          background: `
            radial-gradient(circle, rgba(0, 59, 179, 0.05) 0%, rgba(0, 59, 179, 0) 60%),
            radial-gradient(circle, rgba(0, 59, 179, 0.01) 0%, rgba(0, 59, 179, 0) 100%)
          `,
        }}
      />

      <div className="relative z-3 mx-auto max-w-4xl flex flex-col items-center text-center w-full">
        {/* Pill Switcher */}
        <div className="inline-flex rounded-full bg-slate-100/80 p-0.5 border border-slate-200/80 mb-6 shadow-xs backdrop-blur-md select-none relative z-6">
          <Link
            to="/"
            className="rounded-full bg-obsidian px-5.5 py-2 text-xs font-bold text-white shadow-xs transition-all"
          >
            I'm looking for an agency
          </Link>
          <Link
            to="/for-agencies/"
            className="rounded-full bg-transparent px-5 py-1.5 text-xs font-bold text-slate-500 hover:text-obsidian transition-colors"
          >
            List my agency
          </Link>
        </div>

        {/* ========================================== */}
        {/* LAYER 3: Headline (Moves Subtly, 0.02) (z-index: 3) */}
        {/* ========================================== */}
        <div
          ref={headlineRef}
          className="w-full select-none relative z-3 pt-6"
          style={{ willChange: "transform" }}
        >
          <h1 className="text-balance text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] tracking-tight text-obsidian flex flex-col items-center">
            <span className="flex flex-col sm:flex-row items-center justify-center gap-y-1 sm:gap-x-2 whitespace-nowrap">
              <span>Find the right</span>
              <span className="text-hyperblue inline-block w-[180px] sm:w-[245px] md:w-[310px] text-center sm:text-left">
                {displayText}
                <span className="animate-blink text-hyperblue">|</span>
              </span>
            </span>
            <span>agency globally.</span>
          </h1>
        </div>

        {/* ========================================== */}
        {/* LAYER 4: Subtitle (Moves slightly less than Headline, 0.015) (z-index: 4) */}
        {/* ========================================== */}
        <div
          ref={subtitleRef}
          className="mt-6 w-full select-none relative z-4"
          style={{ willChange: "transform" }}
        >
          <p className="max-w-[50ch] mx-auto text-lg font-semibold text-steel-dark leading-relaxed">
            Vetted marketing, tech, and creative agencies globally.
          </p>
        </div>

        {/* ========================================== */}
        {/* LAYER 5: Badge Row (Barely moves, 0.008) (z-index: 5) */}
        {/* ========================================== */}
        <div
          ref={badgesRef}
          className="mt-8 w-full select-none relative z-5"
          style={{ willChange: "transform" }}
        >
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-bold text-steel-dark">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-hyperblue" />
              <span>100% Free search</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-hyperblue" />
              <span>Matched within 24 hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-hyperblue" />
              <span>Zero commitment</span>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* LAYER 6: Search Matcher Bar (Moves LEAST, 0.003) (z-index: 6) */}
        {/* ========================================== */}
        <div
          ref={ctasRef}
          className="mt-10 w-full max-w-xl select-none relative z-6 px-4"
          style={{ willChange: "transform" }}
        >
          <form onSubmit={handleGetMatched} className="flex flex-col sm:flex-row gap-3 w-full bg-white p-2 rounded-2xl border border-neutral-200 shadow-md focus-within:ring-2 focus-within:ring-hyperblue/20 focus-within:border-hyperblue transition-all">
            <input
              type="text"
              placeholder="What do you need help with? (e.g. web development, SEO...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 bg-transparent text-sm text-obsidian placeholder:text-neutral-400 focus:outline-none min-w-0"
              required
            />
            <button
              type="submit"
              className="cta-ripple rounded-xl bg-obsidian hover:bg-neutral-900 text-white px-6 py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-300 min-w-[125px] flex items-center justify-center cursor-pointer"
            >
              Get Matched
            </button>
          </form>
        </div>
      </div>

      {/* ========================================== */}
      {/* LAYER 2: Trusted Network Logos Strip (Moves Slightly, 0.025) (z-index: 2) */}
      {/* ========================================== */}
      <div
        ref={logosRef}
        className="absolute bottom-10 left-0 right-0 w-full pointer-events-none select-none z-2"
        style={{ willChange: "transform" }}
      >
        <div className="mx-auto max-w-7xl px-6 mb-3 flex flex-col items-center text-center">
          <span className="text-[10px] font-bold tracking-widest uppercase text-steel-dark/50">
            Trusted Network
          </span>
        </div>

        <div className="w-full relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

          <div className="flex w-max animate-marquee-hero items-center py-2">
            {[...logos, ...logos, ...logos].map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="mx-8 md:mx-12 shrink-0 flex items-center justify-center"
              >
                <img
                  src={logo.url}
                  alt={logo.name}
                  className="h-8 md:h-10 w-auto max-w-[140px] object-contain opacity-75"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Styles for Scrolling Logo Marquee */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marqueeHero {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee-hero {
          animation: marqueeHero 35s linear infinite;
        }
        @keyframes slideDown {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}} />
    </section>
  );
}
