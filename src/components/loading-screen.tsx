
import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md transition-opacity duration-500">
      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 ease-out">
        
        {/* Logo Placeholder / Brand Element */}
        <div className="relative mb-8">
          <div className="size-16 rounded-2xl bg-obsidian flex items-center justify-center shadow-2xl shadow-obsidian/20 animate-bounce">
            <Loader2 className="size-8 text-white animate-spin" strokeWidth={2.5} />
          </div>
          
          <div className="absolute -inset-4 bg-hyperblue/10 blur-2xl rounded-full animate-pulse" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-obsidian">Finding Global</span>
             <span className="size-1 rounded-full bg-hyperblue animate-pulse" />
          </div>
          
          <div className="h-1 w-48 overflow-hidden rounded-full bg-surface border border-border/50">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-obsidian to-transparent animate-shimmer" 
                 style={{ 
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 1.5s infinite linear'
                 }} 
            />
          </div>
          
          <p className="text-[10px] font-bold text-steel uppercase tracking-widest animate-pulse">
            Securely fetching workspace data...
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
