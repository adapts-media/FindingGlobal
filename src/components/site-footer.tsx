import { Link } from "@tanstack/react-router";
import { Twitter, Instagram, Linkedin, ArrowUp } from "lucide-react";

export function SiteFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border bg-[#fafafa] dark:bg-card py-16 text-obsidian">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-12 lg:gap-12">
          
          {/* Column 1: Logo, Brand info, Address, Socials */}
          <div className="col-span-2 md:col-span-4 lg:col-span-4 flex flex-col justify-between gap-6">
            <div>
              <Link to="/" className="inline-block mb-5 -ml-5">
                <img
                  src="/minimallogo"
                  alt="Finding Global"
                  className="w-20 h-auto object-contain"
                />
              </Link>
              <p className="text-steel-dark text-sm leading-relaxed max-w-sm mb-6 font-semibold">
                Empowering Connections, Expanding Opportunities Globally.
              </p>
              
              <div className="space-y-1 mb-6 text-sm font-semibold">
                <span className="eyebrow text-steel-dark/60 block mb-2">Office Address</span>
                <p className="text-obsidian">Dubai, United Arab Emirates</p>
                <p className="text-steel-dark">
                  Email:{" "}
                  <a
                    href="mailto:info@findingglobal.com"
                    className="text-hyperblue hover:underline font-bold transition-colors"
                  >
                    info@findingglobal.com
                  </a>
                </p>
              </div>
            </div>
 
            {/* Social Icons - Premium Monochrome Style */}
            <div className="flex items-center gap-2">
              {[
                { label: "X", href: "https://x.com/findingglobal", icon: Twitter },
                { label: "Instagram", href: "https://www.instagram.com/hellofindingglobal/", icon: Instagram },
                { label: "LinkedIn", href: "https://www.linkedin.com/in/finding-global-1694a1423/", icon: Linkedin },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-steel-dark hover:text-obsidian hover:border-obsidian hover:bg-[#F8F9FA] transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
 
          {/* Column 2: For clients */}
          <div className="col-span-1 lg:col-span-2 lg:ml-auto">
            <h4 className="text-xs font-black uppercase tracking-wider text-obsidian mb-6">
              For clients
            </h4>
            <ul className="space-y-4 text-xs font-bold text-steel-dark">
              <li>
                <Link to="/submit-project/" className="hover:text-hyperblue transition-colors">
                  Post a project
                </Link>
              </li>
              <li>
                <Link to="/agencies/" className="hover:text-hyperblue transition-colors">
                  Explore agencies
                </Link>
              </li>
            </ul>
          </div>
 
          {/* Column 3: For providers */}
          <div className="col-span-1 lg:col-span-2 lg:ml-auto">
            <h4 className="text-xs font-black uppercase tracking-wider text-obsidian mb-6">
              For providers
            </h4>
            <ul className="space-y-4 text-xs font-bold text-steel-dark">
              <li>
                <Link to="/for-agencies/" className="hover:text-hyperblue transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link to="/upgrade/" className="hover:text-hyperblue transition-colors">
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>
 
          {/* Column 4: Resources */}
          <div className="col-span-1 lg:col-span-2 lg:ml-auto mt-6 md:mt-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-obsidian mb-6">
              Resources
            </h4>
            <ul className="space-y-4 text-xs font-bold text-steel-dark">
              <li>
                <Link to="/blog/" className="hover:text-hyperblue transition-colors">
                  Blog Articles
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-hyperblue transition-colors">
                  Help & Support
                </Link>
              </li>
            </ul>
          </div>
 
          {/* Column 5: Company */}
          <div className="col-span-1 lg:col-span-2 lg:ml-auto mt-6 md:mt-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-obsidian mb-6">
              Company
            </h4>
            <ul className="space-y-4 text-xs font-bold text-steel-dark">
              <li>
                <Link to="/about/" className="hover:text-hyperblue transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact/" className="hover:text-hyperblue transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
 
        </div>
 
        {/* Bottom Bar */}
        <div className="mt-16 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left text-zinc-400 text-xs font-semibold flex flex-col md:flex-row md:items-center gap-3">
            <span>© {new Date().getFullYear()} Finding Global. All rights reserved.</span>
            <span className="hidden md:inline text-zinc-300">|</span>
            <div className="flex gap-4 justify-center md:justify-start mt-2 md:mt-0">
              <Link to="/" className="hover:text-obsidian transition-colors">Privacy Policy</Link>
              <Link to="/" className="hover:text-obsidian transition-colors">Terms of Service</Link>
            </div>
          </div>
          
          <div className="flex justify-center md:justify-end w-full md:w-auto">
            <button
              onClick={scrollToTop}
              className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-steel-dark hover:text-obsidian hover:border-obsidian transition-all duration-200 shadow-xs cursor-pointer"
              aria-label="Scroll to top"
            >
              <ArrowUp className="size-4.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
