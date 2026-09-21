import { useEffect } from "react";
import { type BlogPost } from "@/lib/mock-data";

interface BlogModalProps {
  post: BlogPost;
  onClose: () => void;
}

export function BlogModal({ post, onClose }: BlogModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-obsidian/40 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
      />

      {/* Content Container */}
      <div className="relative flex flex-col w-full max-w-4xl max-h-full overflow-hidden bg-white rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] animate-in fade-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-20 size-10 flex items-center justify-center rounded-full bg-white/80 text-obsidian backdrop-blur hover:bg-obsidian hover:text-white transition-all shadow-sm group active:scale-95"
        >
          <svg className="size-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto no-scrollbar bg-white">
          {/* Hero Image */}
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-surface">
            <img
              src={post.imageSeed?.startsWith("http") || post.imageSeed?.startsWith("data:") ? post.imageSeed : `https://picsum.photos/seed/${post.slug}/1200/600`}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>

          <div className="px-6 pb-16 md:px-16">
            <div className="mx-auto max-w-3xl">
              {/* Header */}
              <div className="mb-10 -mt-12 relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="rounded-full bg-hyperblue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-hyperblue border border-hyperblue/10">
                    {post.category}
                  </span>
                  <span className="text-steel-light">/</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-steel">
                    {post.date}
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-obsidian leading-[1.1]">
                  {post.title}
                </h2>

                {post.author && (
                  <div className="mt-8 flex items-center gap-4 border-t border-border/50 pt-8">
                    <div className="size-12 shrink-0 overflow-hidden rounded-full bg-surface border border-border">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.avatarSeed}`}
                        alt={post.author.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-obsidian">{post.author.name}</div>
                      <div className="text-xs font-medium text-steel-dark">{post.author.role}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div className="prose prose-lg max-w-none prose-headings:text-obsidian prose-headings:font-bold prose-p:text-steel-dark prose-p:leading-relaxed prose-strong:text-obsidian">
                {post.content.split('\n\n').map((para, i) => {
                  if (para.startsWith('### ')) {
                    return <h3 key={i} className="text-2xl mt-12 mb-6">{para.replace('### ', '')}</h3>;
                  }
                  if (para.startsWith('## ')) {
                    return <h2 key={i} className="text-3xl mt-12 mb-6">{para.replace('## ', '')}</h2>;
                  }
                  return (
                    <p key={i} className="text-lg mb-6 last:mb-0">
                      {para}
                    </p>
                  );
                })}
              </div>

              {/* Footer / CTA */}
              <div className="mt-16 rounded-3xl bg-blue-50/50 border border-blue-100/50 p-10 text-center relative overflow-hidden group">
                <div className="relative z-10">
                  <h4 className="text-2xl font-bold text-obsidian mb-4">Ready to find your partner?</h4>
                  <p className="text-steel-dark mb-8 max-w-md mx-auto">Finding Global connects you with vetted agencies globally based on your specific needs.</p>
                  <button
                    onClick={() => {
                      onClose();
                      // Navigation would happen here if needed
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-hyperblue px-8 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-obsidian hover:text-white transition-all active:scale-95 shadow-xl shadow-hyperblue/20"
                  >
                    Start Matching
                  </button>
                </div>
                <div className="absolute top-0 right-0 p-10 text-hyperblue opacity-5 pointer-events-none">
                   <svg className="size-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
