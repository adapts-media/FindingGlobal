import { Outlet, createRootRoute, Link, useRouterState, HeadContent } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { GoogleOAuthProvider } from "@react-oauth/google";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="eyebrow text-hyperblue">Error 404</span>
      <h1 className="mt-4 text-7xl font-extrabold tracking-tighter">Page not found</h1>
      <p className="mt-4 max-w-md text-base text-steel-dark">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-sm bg-obsidian px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-hyperblue"
      >
        Back to home
      </Link>
    </div>
  );
}

export const Route = createRootRoute({
  // Site-wide fallback title/description/robots — only used when a matched leaf route
  // doesn't supply its own via head() (TanStack Router's <HeadContent /> merges root + leaf
  // head() output and keeps the leaf's value for any tag both define, so this never doubles
  // up with a page's own tags). This used to live as static tags in index.html, but that
  // meant every page shipped its own head() tags *alongside* — never replacing — those
  // static ones, since <HeadContent /> only knows about tags it renders itself. Two <title>
  // and two <meta name="description"> on every page was the result.
  head: () => ({
    meta: [
      { title: "Finding GLOBAL - The agency procurement network for the Middle East & Global" },
      {
        name: "description",
        content: "Connect with vetted marketing, branding, technology, and consulting agencies across the UAE, Saudi Arabia, Egypt, and Qatar.",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

import { Toaster } from "@/components/ui/sonner";
import { Chatbot } from "@/components/chatbot";

function RootComponent() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const routerState = useRouterState();
  const isLoading = routerState.status === "pending";

  // Dev-only: vite-plugins/dev-meta.ts injects title/meta/canonical tags (marked
  // data-dev-meta) into the raw HTML response so View Source shows them — see that file for
  // why. By the time this runs, <HeadContent /> above has already committed the real ones for
  // this route, so it's safe to drop the server-injected stand-ins and avoid ending up with
  // two of each in the live DOM. No-op in production (the plugin never runs during the build,
  // so there's nothing with this attribute to find).
  useEffect(() => {
    if (import.meta.env.DEV) {
      document.querySelectorAll("[data-dev-meta]").forEach((el) => el.remove());
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <HeadContent />
        {isLoading && (
          <>
            <style>{`
              @keyframes loading-progress {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(-20%); }
                100% { transform: translateX(0%); }
              }
              .loading-bar-anim {
                animation: loading-progress 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              }
            `}</style>
            <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-blue-50/50 overflow-hidden pointer-events-none">
              <div className="h-full w-full bg-[#003bb3] origin-left loading-bar-anim" />
            </div>
          </>
        )}
        <Outlet />
        <Toaster position="top-center" />
        <Chatbot />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
