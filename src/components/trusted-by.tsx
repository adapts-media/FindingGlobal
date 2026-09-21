import React from "react";

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

export function TrustedBy() {
  return (
    <section className="bg-background py-10 border-b border-border/10 relative overflow-hidden">
      {/* Upper Border Line - Centered and Faded */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      {/* Header Info */}
      <div className="mx-auto max-w-7xl px-6 mb-16 flex flex-col items-center text-center">
        <span className="text-[10px] font-bold tracking-widest uppercase text-steel-dark/60">
          Trusted Network
        </span>
      </div>

      {/* Slider Container */}
      <div className="w-full relative">
        {/* Left & Right Fade Masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

        {/* Scrolling Track */}
        <div className="flex w-max animate-marquee items-center py-2">
          {/* Double list of logo card elements */}
          {[...logos, ...logos, ...logos].map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="mx-8 md:mx-12 shrink-0 flex items-center justify-center transition-all duration-300 hover:scale-105"
            >
              <img
                src={logo.url}
                alt={logo.name}
                className="h-8 md:h-10 w-auto max-w-[140px] object-contain opacity-80 transition-all duration-300 hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </section>
  );
}



