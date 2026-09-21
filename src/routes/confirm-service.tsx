import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/confirm-service")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Matching Your Request — Finding Global" },
      { name: "description", content: "AI matching engine analyzing your project requirements." },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/confirm-service/" },
    ],
  }),
  component: ConfirmServicePage,
});

function ConfirmServicePage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [predictedService, setPredictedService] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      navigate({ to: "/" });
      return;
    }

    const predict = async () => {
      setIsAnalyzing(true);
      try {
        const data = await api<{ service: string }>("/projects/predict-service", {
          method: "POST",
          body: JSON.stringify({ query: q }),
          auth: false
        });
        setPredictedService(data.service);
      } catch (err) {
        console.error("Prediction error", err);
        // Fail gracefully
        navigate({ to: "/submit-project", search: { q } });
      } finally {
        setIsAnalyzing(false);
      }
    };

    predict();
  }, [q]);

  const handleConfirmYes = () => {
    navigate({
      to: "/submit-project",
      search: {
        service: predictedService || undefined,
        q: q
      }
    });
  };

  const handleConfirmNo = () => {
    navigate({
      to: "/submit-project",
      search: {
        q: q
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white relative overflow-hidden font-sans">
      {/* Local styles for premium custom animations & hover interactions */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes modalScale {
            from { opacity: 0; transform: scale(0.96) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes badgeSlide {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes shine {
            to { background-position: 200% center; }
          }
          .animate-modal-scale {
            animation: modalScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-badge-slide {
            animation: badgeSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
            opacity: 0;
          }
          .shine-text-hover:hover {
            background: linear-gradient(90deg, #2563eb, #60a5fa, #2563eb);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shine 1.5s linear infinite;
          }
        `
      }} />

      {/* Premium Background Grid & Blue Radial Glows */}
      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-hyperblue/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-hyperblue/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="architectural-grid pointer-events-none absolute inset-0 opacity-10" />

      <SiteHeader />

      {/* Subtle overlay behind the modal */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden z-10 bg-black/[0.01] backdrop-blur-[1px]">
        <div className="relative z-10 w-full max-w-[540px] animate-modal-scale">
          {isAnalyzing ? (
            /* AI Scanning / Analyzing View */
            <div className="bg-white rounded-3xl border border-black/[0.06] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.12)] flex flex-col items-center text-center gap-5">
              <div className="relative size-20 flex items-center justify-center">
                {/* Orbit animation */}
                <div className="absolute inset-2 rounded-full border border-dashed border-hyperblue/40 animate-spin" style={{ animationDuration: "8s" }} />
                <div className="absolute inset-0 rounded-full border border-hyperblue/10 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute inset-4 rounded-full bg-hyperblue/[0.06] flex items-center justify-center text-hyperblue shadow-sm">
                  <Sparkles className="size-5 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-obsidian uppercase tracking-tight">Analyzing Your Request</h2>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                  Mapping "{q}" to standard service categories...
                </p>
              </div>
            </div>
          ) : (
            /* Confirmation card modal */
            <div className="bg-white rounded-3xl border border-black/[0.06] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.12)] flex flex-col items-center text-center relative overflow-hidden">
              
              {/* Heading */}
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-black text-obsidian tracking-tighter leading-[1.08] text-center flex flex-col gap-0.5">
                <span className="block text-slate-500 font-extrabold text-lg sm:text-xl md:text-[22px] tracking-tight mb-1">It looks like you want</span>
                <span className="relative inline-block text-hyperblue font-black tracking-tighter cursor-pointer shine-text-hover transition-all duration-300 pb-1">
                  "{predictedService}"
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-hyperblue/30 rounded-full blur-[1px]" />
                </span>
                <span className="block mt-1">Is that correct?</span>
              </h2>

              {/* Description */}
              <p className="mt-5 max-w-[460px] text-xs font-semibold text-slate-500 leading-relaxed text-center">
                We'll pre-select this category in your project brief to find the most relevant vetted global agencies.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 w-full mt-6">
                <button
                  onClick={handleConfirmYes}
                  style={{
                    background: "var(--obsidian)"
                  }}
                  className="flex-1 h-[48px] rounded-xl text-white text-[11px] font-bold uppercase tracking-wider hover:scale-[1.01] active:scale-98 transition-all duration-[250ms] cursor-pointer flex items-center justify-center gap-1.5 group"
                >
                  Yes, Correct
                  <ArrowRight className="size-3.5 stroke-[3] transform transition-transform duration-[250ms] group-hover:translate-x-1" />
                </button>
                <button
                  onClick={handleConfirmNo}
                  className="flex-1 h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-obsidian text-[11px] font-bold uppercase tracking-wider hover:border-slate-300 hover:shadow-md hover:scale-[1.01] active:scale-98 transition-all duration-[250ms] cursor-pointer text-center"
                >
                  No, Skip
                </button>
              </div>

              {/* Thin Gradient Divider Line */}
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6" />

              {/* Footer Cancel and Start Over */}
              <div className="flex justify-center">
                <Link
                  to="/"
                  className="group inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-obsidian transition-colors duration-300 relative py-1"
                >
                  <X className="size-3 transform transition-transform duration-300 group-hover:rotate-90" />
                  <span>Cancel and start over</span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-obsidian transition-all duration-300 group-hover:w-full" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
