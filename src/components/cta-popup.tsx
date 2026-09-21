import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Briefcase, Sparkles, ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function CTAPopup() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0: Options, 1: Client, 2: Agency

  useEffect(() => {
    if (user) return;

    const hasShown = sessionStorage.getItem("cta_popup_shown");
    if (hasShown) return;

    const handleScroll = () => {
      if (window.scrollY > 1300) {
        setIsOpen(true);
        sessionStorage.setItem("cta_popup_shown", "true");
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/30 backdrop-blur-[6px] animate-in fade-in duration-500">
      <div className="relative w-full max-w-[480px] overflow-hidden rounded-[28px] border border-black/[0.06] bg-white/95 backdrop-blur-xl p-8 md:p-9 shadow-2xl transition-all duration-500">
        
        {/* Soft background glows inspired by contact page */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-36 bg-hyperblue/5 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-[#4f46e5]/5 rounded-full blur-[60px] pointer-events-none" />

        {/* Upper Header spacer / back button */}
        {step !== 0 && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setStep(0)}
              className="flex size-7 items-center justify-center rounded-full border border-black/5 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-obsidian transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="size-3" />
            </button>
          </div>
        )}

        {/* Brand Logo Centered */}
        {step === 0 && (
          <div className="flex justify-center mb-2 mt-4">
            <img
              src="/minimallogo"
              alt="Finding Global Logo"
              className="h-20 scale-110 w-auto object-contain"
            />
          </div>
        )}

        {/* Step 0: Initial Screen */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <h3 className="text-[25px] sm:text-[28px] font-black text-obsidian tracking-tight leading-[1.1] text-center">
              How can we help you <span className="text-transparent bg-clip-text bg-gradient-to-r from-obsidian via-hyperblue to-obsidian">grow?</span>
            </h3>
            <p className="mt-3 text-sm font-semibold text-neutral-500 text-center leading-relaxed max-w-[340px] mx-auto">
              Select your path to find premium service providers or receive vetted project briefs.
            </p>

            <div className="mt-9 flex flex-col gap-3 items-center">
              {/* Client Path */}
              <button
                onClick={() => setStep(1)}
                className="max-w-[310px] w-full bg-obsidian hover:bg-neutral-800 hover:shadow-lg transition-all duration-300 py-2.5 px-4 rounded-xl text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 text-white border border-obsidian"
              >
                <span className="font-extrabold text-[12px] uppercase tracking-wider">Find an agency</span>
                <span className="text-[10px] text-neutral-300 font-medium">Find & connect with vetted partners</span>
              </button>

              {/* Agency Path */}
              <button
                onClick={() => setStep(2)}
                className="max-w-[310px] w-full bg-white hover:bg-neutral-50 hover:shadow-lg transition-all duration-300 py-2.5 px-4 rounded-xl text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 text-obsidian border border-black/80"
              >
                <span className="font-extrabold text-[12px] uppercase tracking-wider">Grow my agency</span>
                <span className="text-[10px] text-neutral-400 font-medium">Join our verified global agency network</span>
              </button>

              {/* I'll Decide Later */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleClose}
                  className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-300 hover:text-obsidian transition-colors cursor-pointer"
                >
                  I'll decide later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Client Steps */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-3 duration-500 text-left">
            <h3 className="text-[26px] sm:text-[28px] font-black text-obsidian tracking-tight leading-tight">
              Hire vetted <span className="text-transparent bg-clip-text bg-gradient-to-r from-obsidian via-hyperblue to-obsidian">agencies</span>
            </h3>
            <p className="mt-2 text-sm font-semibold text-neutral-500 leading-relaxed">
              Follow these simple steps to match and connect with premium partners:
            </p>

            <div className="mt-8 pl-5 border-l border-neutral-100 space-y-6">
              {[
                {
                  label: "Post your requirements",
                  desc: "Detail your services, budget, timeline, and location goals in 3 minutes."
                },
                {
                  label: "Review dynamic matches",
                  desc: "Our matching engine pairs you with up to 10 verified global agencies."
                },
                {
                  label: "Book direct meetings",
                  desc: "Schedule calls directly from your dashboard with senior agency teams."
                }
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline Indicator */}
                  <span className="absolute -left-[28px] top-0.5 flex size-5.5 items-center justify-center rounded-full bg-white border border-neutral-300 text-[10px] font-bold text-neutral-500">
                    {idx + 1}
                  </span>
                  <div className="pl-3">
                    <h4 className="text-[14px] font-bold text-neutral-900 tracking-tight">{item.label}</h4>
                    <p className="mt-1 text-[12px] font-semibold leading-relaxed text-neutral-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-obsidian transition-colors cursor-pointer"
              >
                Back
              </button>
              <Link
                to="/login/"
                search={{ tab: "signup", role: "client" }}
                onClick={handleClose}
                className="inline-flex items-center gap-2 rounded-xl bg-obsidian hover:bg-hyperblue px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md active:scale-95 transition-all duration-300 cursor-pointer"
              >
                Get Started
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Agency Steps */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-3 duration-500 text-left">
            <h3 className="text-[26px] sm:text-[28px] font-black text-obsidian tracking-tight leading-tight">
              Grow your <span className="text-transparent bg-clip-text bg-gradient-to-r from-obsidian via-hyperblue to-obsidian">agency</span>
            </h3>
            <p className="mt-2 text-sm font-semibold text-neutral-500 leading-relaxed">
              Unlock access to qualified, pre-screened client project briefs:
            </p>

            <div className="mt-8 pl-5 border-l border-neutral-100 space-y-6">
              {[
                {
                  label: "Build your premium profile",
                  desc: "Showcase your team, location, verified reviews, and case studies."
                },
                {
                  label: "Set your target filters",
                  desc: "Define your core services, minimum budgets, and industry specializations."
                },
                {
                  label: "Receive qualified briefs",
                  desc: "Get notified immediately when high-intent briefs match your criteria."
                }
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline Indicator */}
                  <span className="absolute -left-[28px] top-0.5 flex size-5.5 items-center justify-center rounded-full bg-white border border-neutral-300 text-[10px] font-bold text-neutral-500">
                    {idx + 1}
                  </span>
                  <div className="pl-3">
                    <h4 className="text-[14px] font-bold text-neutral-900 tracking-tight">{item.label}</h4>
                    <p className="mt-1 text-[12px] font-semibold leading-relaxed text-neutral-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-obsidian transition-colors cursor-pointer"
              >
                Back
              </button>
              <Link
                to="/login/"
                search={{ tab: "signup", role: "agency" }}
                onClick={handleClose}
                className="inline-flex items-center gap-2 rounded-xl bg-obsidian hover:bg-hyperblue px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md active:scale-95 transition-all duration-300 cursor-pointer"
              >
                Join Network
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
