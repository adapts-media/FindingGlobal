import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { memo, useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { NotificationDropdown } from "./notification-dropdown";
import { getSearchUrl } from "@/lib/utils";


// ─── Search suggestions ───────────────────────────────────────────────────────
const SEARCH_SUGGESTIONS = [
  "Advertising",
  "Branding & Positioning",
  "Content Marketing",
  "Copywriting",
  "Digital Marketing",
  "E-commerce",
  "Email Marketing",
  "Graphic Design",
  "Influencer Marketing",
  "Logo Design",
  "Mobile App Development",
  "Online Advertising",
  "PPC / Paid Ads",
  "PR & Communications",
  "Product Design",
  "SEO",
  "Social Media Management",
  "Software Development",
  "UI/UX Design",
  "Video Production",
  "Web Design",
  "Web Development",
];

// ─── Mega-menu data ───────────────────────────────────────────────────────────

const CATEGORY_DATA = [
  {
    label: "Digital Marketing",
    href: "/agencies/digital-marketing/",
    servicesTitle: "Digital Marketing Services",
    services: [
      { label: "SEO Services", href: "/agencies/seo-services/" },
      { label: "PPC Advertising", href: "/agencies/ppc-paid-ads/" },
      { label: "Social Media Management", href: "/agencies/social-media-management/" },
      { label: "Email Marketing", href: "/agencies/email-marketing/" },
      { label: "Content Marketing", href: "/agencies/content-marketing/" },
      { label: "Influencer Marketing", href: "/agencies/influencer-marketing/" },
    ],
  },
  {
    label: "Creative & Visual",
    href: "/agencies/creative-visual/",
    servicesTitle: "Creative Services",
    services: [
      { label: "Brand Identity", href: "/agencies/brand-identity/" },
      { label: "Video Production", href: "/agencies/video-production/" },
      { label: "Graphic Design", href: "/agencies/graphic-design/" },
      { label: "Photography", href: "/agencies/photography/" },
      { label: "Copywriting", href: "/agencies/copywriting/" },
      { label: "Motion Graphics", href: "/agencies/motion-graphics/" },
    ],
  },
  {
    label: "Web & App Development",
    href: "/agencies/web-app-development/",
    servicesTitle: "Development Services",
    services: [
      { label: "Web Development", href: "/agencies/web-development/" },
      { label: "Mobile App Development", href: "/agencies/mobile-app-development/" },
      { label: "E-commerce Development", href: "/agencies/e-commerce/" },
      { label: "UI/UX Design", href: "/agencies/ui-ux-design/" },
      { label: "Software Development", href: "/agencies/software-development/" },
      { label: "API Integration", href: "/agencies/api-integration/" },
    ],
  },
  {
    label: "PR & Communications",
    href: "/agencies/pr-communications/",
    servicesTitle: "PR & Comms Services",
    services: [
      { label: "Media Relations", href: "/agencies/media-relations/" },
      { label: "Crisis Management", href: "/agencies/crisis-management/" },
      { label: "Press Release Writing", href: "/agencies/press-release/" },
      { label: "Event Management", href: "/agencies/event-management/" },
      { label: "Corporate Communications", href: "/agencies/corporate-communications/" },
    ],
  },
  {
    label: "Branding & Strategy",
    href: "/agencies/branding-strategy/",
    servicesTitle: "Branding Services",
    services: [
      { label: "Brand Strategy", href: "/agencies/brand-strategy/" },
      { label: "Market Research", href: "/agencies/market-research/" },
      { label: "Logo Design", href: "/agencies/logo-design/" },
      { label: "Brand Guidelines", href: "/agencies/brand-guidelines/" },
      { label: "Naming & Positioning", href: "/agencies/naming-positioning/" },
    ],
  },
];

const GET_CLIENTS_ITEMS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: "List Your Agency",
    desc: "Get discovered by clients actively looking for your expertise.",
    href: "/for-agencies/",
  },
];

const RESOURCES_ITEMS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    label: "Blog & Insights",
    href: "/blog/",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
      </svg>
    ),
    label: "About Finding Global",
    href: "/about/",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: "Contact Us",
    href: "/contact/",
  },
];

// ─── Chevron icon ─────────────────────────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: "transform 220ms cubic-bezier(0.4,0,0.2,1)",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Mega panel: Find Providers ───────────────────────────────────────────────
function FindProvidersMega({ onClose }: { onClose: () => void }) {
  const [activeCat, setActiveCat] = useState(CATEGORY_DATA[0]);

  return (
    <div className="mega-panel">
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 0, maxWidth: 1280, margin: "0 auto" }}>
        {/* Col 1 — Explore card + Post a project */}
        <div style={{ padding: "24px 20px", borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 16 }}>
          <Link to="/agencies/" className="mega-explore-card" onClick={onClose}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-hyperblue)", display: "flex", alignItems: "center", gap: 6 }}>
              Explore
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </span>
            <p style={{ fontSize: 12, color: "var(--color-hyperblue)", marginTop: 4, lineHeight: 1.5 }}>
              Discover and browse our entire catalog of service providers.
            </p>
          </Link>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-steel)", marginBottom: 8 }}>
              Post a project
            </p>
            <p style={{ fontSize: 12, color: "var(--color-steel-dark)", lineHeight: 1.5 }}>
              Post a new project now and find service providers that best match your needs.
            </p>
            <Link to="/submit-project/" style={{ display: "inline-block", marginTop: 10, fontSize: 12, fontWeight: 600, color: "var(--color-hyperblue)", textDecoration: "underline" }} onClick={onClose}>
              Get started →
            </Link>
          </div>
        </div>

        {/* Col 2 — Category list */}
        <div style={{ padding: "24px 20px", borderRight: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-steel)", marginBottom: 12 }}>
            Browse our providers
          </p>
          <p style={{ fontSize: 12, color: "var(--color-steel-dark)", lineHeight: 1.5, marginBottom: 20 }}>
            Search through a database of talented service providers and collaborate with the best for your specific needs.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {CATEGORY_DATA.map((cat) => {
              const isActive = activeCat.label === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onMouseEnter={() => setActiveCat(cat)}
                  onClick={() => setActiveCat(cat)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderRadius: 4,
                    border: "none",
                    background: isActive ? "var(--color-hyperblue-soft)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "var(--color-hyperblue)" : "var(--color-foreground)",
                    transition: "all 120ms ease",
                  }}
                >
                  {cat.label}
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  )}
                </button>
              );
            })}
          </div>
          <Link to="/agencies/" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 16, fontSize: 12, fontWeight: 600, color: "var(--color-steel-dark)", textDecoration: "underline" }} onClick={onClose}>
            Browse all categories
          </Link>
        </div>

        {/* Col 3 — Service sub-links (updates on hover) */}
        <div style={{ padding: "24px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-steel)", marginBottom: 12 }}>
            {activeCat.servicesTitle}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {activeCat.services.map((link) => (
              <Link
                key={link.href}
                to={link.href as "/agencies/"}
                style={{ fontSize: 13, color: "var(--color-steel-dark)", padding: "6px 0", textDecoration: "none", transition: "color 120ms ease" }}
                className="mega-service-link"
                onClick={onClose}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 20, fontSize: 12, color: "var(--color-steel)" }}>
            Not what you are looking for?{" "}
            <Link to="/agencies/" style={{ color: "var(--color-foreground)", fontWeight: 600, textDecoration: "underline" }} onClick={onClose}>
              Browse all services
            </Link>
          </p>
        </div>
      </div>  {/* end inner max-width wrapper */}
    </div>
  );
}

// ─── Arrow icon ───────────────────────────────────────────────────────────────
function ArrowRight() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"
      className="plain-dropdown-arrow"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ─── Simple dropdown ──────────────────────────────────────────────────────────
function SimpleDropdown({ items, onClose }: { items: typeof GET_CLIENTS_ITEMS; onClose: () => void }) {
  return (
    <div className="plain-dropdown">
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href as "/for-agencies"}
          className="plain-dropdown-item"
          onClick={onClose}
        >
          <span className="plain-dropdown-label">{item.label}</span>
          <ArrowRight />
        </Link>
      ))}
    </div>
  );
}

// ─── Resources dropdown ────────────────────────────────────────────────────────
function ResourcesDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div className="plain-dropdown">
      {RESOURCES_ITEMS.map((item) => (
        <Link
          key={item.href}
          to={item.href as "/blog"}
          className="plain-dropdown-item"
          onClick={onClose}
        >
          <span className="plain-dropdown-label">{item.label}</span>
          <ArrowRight />
        </Link>
      ))}
    </div>
  );
}

// ─── Nav search bar with autocomplete ────────────────────────────────────────
function NavSearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? SEARCH_SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(query.toLowerCase())
    )
    : SEARCH_SUGGESTIONS;

  const navigate = (term: string) => {
    if (!term) return;
    window.location.href = getSearchUrl(term);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) { setOpen(true); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIdx]) navigate(filtered[activeIdx]);
      else if (query.trim()) navigate(query.trim());
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="nav-search" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        placeholder="What service?"
        className="nav-search__input"
        aria-label="Search services"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      <button
        type="button"
        className="nav-search__btn"
        aria-label="Search"
        onMouseDown={(e) => e.preventDefault()} // keep focus on input
        onClick={() => {
          if (query.trim()) navigate(query.trim());
          else inputRef.current?.focus();
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open && filtered.length > 0 && (
        <div className="nav-search-dropdown">
          {filtered.map((item, idx) => (
            <button
              key={item}
              type="button"
              className={`nav-search-dropdown__item${idx === activeIdx ? " nav-search-dropdown__item--active" : ""}`}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseDown={(e) => e.preventDefault()} // keep input focused
              onClick={() => { navigate(item); setOpen(false); }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NavItem with dropdown ─────────────────────────────────────────────────────
type DropdownType = "find-providers" | "get-clients" | "resources";

function NavItem({
  label,
  dropdownType,
  activeDropdown,
  onOpen,
  cancelClose,
  scheduleClose,
  isMega = false,
  to,
  children,
}: {
  label: string;
  dropdownType: DropdownType;
  activeDropdown: DropdownType | null;
  onOpen: (v: DropdownType) => void;
  cancelClose: () => void;
  scheduleClose: () => void;
  isMega?: boolean;
  to?: string;
  children: React.ReactNode;
}) {
  const isOpen = activeDropdown === dropdownType;

  const handleEnter = () => {
    cancelClose();
    onOpen(dropdownType);
  };

  const triggerClass = `nav-trigger${isOpen ? " nav-trigger--open" : ""}`;

  return (
    <div
      className="nav-item-wrapper"
      onMouseEnter={handleEnter}
      onMouseLeave={scheduleClose}
    >
      {to ? (
        <Link
          to={to as any}
          className={triggerClass}
          aria-expanded={isOpen}
        >
          {label}
          <Chevron open={isOpen} />
        </Link>
      ) : (
        <button
          type="button"
          className={triggerClass}
          aria-expanded={isOpen}
        >
          {label}
          <Chevron open={isOpen} />
        </button>
      )}

      {isOpen && (
        <div
          className={isMega ? "dropdown-positioner--mega" : "dropdown-positioner"}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {children}
        </div>
      )}
    </div>
  );
}


// ─── Main SiteHeader ──────────────────────────────────────────────────────────
export const SiteHeader = memo(function SiteHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState<DropdownType | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dashboardTo =
    user?.role === "agency"
      ? "/agency-dashboard/"
      : user?.role === "admin"
        ? "/admin/"
        : "/dashboard/";

  // ── Single shared close timer (prevents flicker when moving between items) ──
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setActiveDropdown(null), 150);
  }, [cancelClose]);

  const closeAll = useCallback(() => {
    cancelClose();
    setActiveDropdown(null);
  }, [cancelClose]);

  // Close on scroll
  useEffect(() => {
    const onScroll = () => closeAll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [closeAll]);

  // Close on route transition
  useEffect(() => {
    closeAll();
    setMobileMenuOpen(false);
  }, [location.pathname, location.search, closeAll]);

  const isLoggedInNonAdmin = user && user.role !== "admin";
  const isGuest = !user;
  const isAgency = user?.role === "agency";

  return (
    <>
      {/* Overlay backdrop */}
      {activeDropdown && (
        <div
          className="mega-backdrop"
          onClick={closeAll}
          aria-hidden="true"
        />
      )}

      <header className="site-header">
        <div className="site-header__inner">
          {/* Logo */}
          <Link to="/" className="site-header__logo">
            <img
              width={70}
              src="/minimallogo"
              alt="Finding Global"
            />
          </Link>

          {/* Primary nav */}
          <nav className="site-header__nav" aria-label="Main navigation">
            {/* ── Guest / public only ── */}
            {isGuest && (
              <>
                <NavItem
                  label="Find Providers"
                  dropdownType="find-providers"
                  activeDropdown={activeDropdown}
                  onOpen={setActiveDropdown}
                  cancelClose={cancelClose}
                  scheduleClose={scheduleClose}
                  isMega
                >
                  <FindProvidersMega onClose={closeAll} />
                </NavItem>

                <NavItem
                  label="Get Clients"
                  dropdownType="get-clients"
                  activeDropdown={activeDropdown}
                  onOpen={setActiveDropdown}
                  cancelClose={cancelClose}
                  scheduleClose={scheduleClose}
                  to="/for-agencies/"
                >
                  <SimpleDropdown items={GET_CLIENTS_ITEMS} onClose={closeAll} />
                </NavItem>

                <NavItem
                  label="Resources"
                  dropdownType="resources"
                  activeDropdown={activeDropdown}
                  onOpen={setActiveDropdown}
                  cancelClose={cancelClose}
                  scheduleClose={scheduleClose}
                >
                  <ResourcesDropdown onClose={closeAll} />
                </NavItem>

                <Link
                  to="/upgrade/"
                  activeProps={{ className: "nav-plain-link--active" }}
                  className="nav-plain-link"
                >
                  Pricing
                </Link>
              </>
            )}

            {/* ── Client ── */}
            {user?.role === "client" && (
              <Link
                to="/dashboard/"
                activeProps={{ className: "text-hyperblue" }}
                className="nav-plain-link"
              >
                My Projects
              </Link>
            )}

            {/* ── Agency logged in: Dashboard + Inbox only ── */}
            {isAgency && (
              <>
                <Link
                  to="/agency-dashboard/"
                  activeProps={{ className: "nav-plain-link--active" }}
                  className="nav-plain-link"
                >
                  Dashboard
                </Link>
                <Link
                  to="/agency-inbox/"
                  activeProps={{ className: "nav-plain-link--active" }}
                  className="nav-plain-link"
                >
                  Inbox
                </Link>
              </>
            )}

            {/* ── Search bar (guests only) ── */}
            {isGuest && <NavSearchBar />}
          </nav>

          {/* Right actions */}
          <div className="site-header__actions">
            {user ? (
              <>
                <NotificationDropdown />
                <Link
                  to={dashboardTo}
                  className="site-header__avatar-btn"
                >
                  <span className="site-header__avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="site-header__avatar-label">Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); navigate({ to: "/" }); }}
                  className="site-header__signout"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login/" className="site-header__signin">
                  Sign In
                </Link>
                <Link to="/submit-project/" className="site-header__cta">
                  Post a Project
                </Link>
              </>
            )}

            {/* Mobile menu toggle button */}
            <button
              type="button"
              className="lg:hidden flex items-center justify-center size-9 rounded-lg hover:bg-neutral-100 transition-colors text-obsidian"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="mobile-menu lg:hidden fixed top-[65px] inset-x-0 bottom-0 z-40 bg-background border-t border-border flex flex-col overflow-y-auto p-6 gap-6">
          {/* Search bar inside mobile menu */}
          {isGuest && (
            <div className="w-full">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-steel-dark mb-2">Search Services</p>
              <NavSearchBar />
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex flex-col gap-4">
            {isGuest && (
              <>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-steel-dark mb-2">Find Providers</p>
                  <div className="flex flex-col gap-2 pl-2">
                    {CATEGORY_DATA.map((cat) => (
                      <Link
                        key={cat.label}
                        to={cat.href as "/agencies"}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm font-semibold text-obsidian py-1"
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-steel-dark mb-2">For Agencies</p>
                  <div className="flex flex-col gap-2 pl-2">
                    {GET_CLIENTS_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href as "/for-agencies"}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm font-semibold text-obsidian py-1"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-steel-dark mb-2">Resources & Info</p>
                  <div className="flex flex-col gap-2 pl-2">
                    {RESOURCES_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href as "/blog"}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm font-semibold text-obsidian py-1"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <Link
                    to="/upgrade"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-semibold text-obsidian py-1 block"
                  >
                    Pricing
                  </Link>
                </div>
              </>
            )}

            {/* Logged in views */}
            {user?.role === "client" && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-obsidian py-1"
              >
                My Projects
              </Link>
            )}

            {isAgency && (
              <>
                <Link
                  to="/agency-dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-obsidian py-1"
                >
                  Dashboard
                </Link>
                <Link
                  to="/agency-inbox"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-obsidian py-1"
                >
                  Inbox
                </Link>
              </>
            )}
          </div>

          {/* Auth & CTA */}
          <div className="mt-auto border-t border-border/60 pt-6 flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  to={dashboardTo}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-bold text-obsidian"
                >
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); navigate({ to: "/" }); setMobileMenuOpen(false); }}
                  className="rounded-xl bg-neutral-100 py-3 text-sm font-bold text-steel-dark"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-3.5 text-sm font-bold text-obsidian border border-border rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/submit-project"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl bg-obsidian py-3.5 text-sm font-bold text-white shadow-lg shadow-obsidian/10"
                >
                  Post a Project
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
});
