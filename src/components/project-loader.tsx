import { useEffect, useState } from "react";
import { FolderOpen, ShieldCheck, Cpu, LayoutGrid, FileSearch } from "lucide-react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

const LOADING_STEPS = [
  { text: "Establishing secure client link", icon: ShieldCheck },
  { text: "Parsing project parameters", icon: Cpu },
  { text: "Querying Global matching engine", icon: FileSearch },
  { text: "Retrieving agency proposals", icon: LayoutGrid },
  { text: "Opening project workspace", icon: FolderOpen },
];

export function ProjectLoader() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        // Speed up early on, slow down later to simulate real loading
        const step = prev < 50 ? 5 : prev < 85 ? 2 : 0.5;
        return Math.min(prev + step, 98);
      });
    }, 40);

    // Step text animation
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, []);

  const CurrentIcon = LOADING_STEPS[stepIndex].icon;

  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
      <SiteHeader />
      
      {/* Architectural Grid Background */}
      <div className="absolute inset-0 architectural-grid opacity-30 pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 relative z-10 py-12">
        
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-hyperblue/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
        <div className="flex flex-col items-center max-w-md w-full text-center">
          
          {/* Animated concentric loader widget */}
          <div className="relative size-32 mb-10 flex items-center justify-center">
            
            {/* Outer dotted spinning ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-steel/30 animate-[spin_10s_linear_infinite]" />
            
            {/* Middle pulsing ring */}
            <div className="absolute inset-2 rounded-full border border-hyperblue/20 bg-hyperblue-soft animate-ping opacity-60" style={{ animationDuration: "2s" }} />
            
            {/* Inner rotating/pulsing ring with shadow */}
            <div className="absolute inset-4 rounded-2xl bg-obsidian flex items-center justify-center shadow-2xl shadow-obsidian/40 border border-white/10 group-hover:scale-105 transition-transform duration-300">
              <CurrentIcon className="size-8 text-white transition-all duration-300 transform scale-110" />
            </div>

            {/* Glowing active indicator */}
            <span className="absolute top-0 right-2 flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hyperblue opacity-75"></span>
              <span className="relative inline-flex rounded-full size-3 bg-hyperblue"></span>
            </span>
          </div>

          {/* Loading status details */}
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-obsidian">Project Engine</span>
              <span className="h-1.5 w-1.5 rounded-full bg-hyperblue animate-bounce" />
            </div>
            
            <h2 className="text-xl font-bold tracking-tight text-obsidian h-7 overflow-hidden flex items-center justify-center">
              <span className="inline-block animate-[fadeInUp_0.3s_ease-out]">
                {LOADING_STEPS[stepIndex].text}
              </span>
            </h2>

            {/* Modern micro-progress bar */}
            <div className="relative h-1.5 w-full bg-surface-muted rounded-full overflow-hidden border border-border/40">
              <div 
                className="h-full bg-gradient-to-r from-obsidian via-hyperblue to-obsidian rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-steel">
              <span className="animate-pulse">Loading project details...</span>
              <span className="font-mono text-obsidian font-bold">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Blueprint styled detail indicators */}
          <div className="mt-10 grid grid-cols-2 gap-4 w-full border-t border-border/50 pt-8">
            <div className="text-left bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-border/30">
              <div className="text-[8px] font-bold text-steel uppercase tracking-widest mb-1">Status</div>
              <div className="text-xs font-bold text-obsidian flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-success animate-pulse" />
                Active Connection
              </div>
            </div>
            <div className="text-left bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-border/30">
              <div className="text-[8px] font-bold text-steel uppercase tracking-widest mb-1">Source</div>
              <div className="text-xs font-bold text-obsidian tracking-tight">Global Procurement</div>
            </div>
          </div>

        </div>
      </div>

      <SiteFooter />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
