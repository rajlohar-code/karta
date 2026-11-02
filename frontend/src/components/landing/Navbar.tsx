import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  ArrowRight,
  Database,
  GitBranch,
  Sparkles,
  Users,
  Code2,
  Layers,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import Logo from '../brand/Logo';
import type { AuthUser } from '../../types/auth';

/**
 * NavbarProps — Interface for the Navbar Component
 */
export interface NavbarProps {
  /** Callback fired when user clicks 'Sign In' */
  onSignInClick?: () => void;

  /** Callback fired when user clicks 'Get Started Free' */
  onGetStartedClick?: () => void;

  /** Currently authenticated user profile (or null if guest) */
  user?: AuthUser | null;

  /** Callback fired when user logs out */
  onSignOut?: () => void;
}

/**
 * Navbar Component — Sticky Glassmorphic Header for Karta Landing Page
 * Grounded in: karta_design_system.md
 *
 * FEATURES:
 * 1. Brand Logo on the left
 * 2. Center navigation with rich interactive dropdowns (Product, Solutions)
 * 3. Quick anchor links (Templates, Pricing)
 * 4. Action buttons on the right (Search, Sign In / Profile Avatar, Get Started Free)
 * 5. Mobile responsive hamburger drawer
 */
export const Navbar: React.FC<NavbarProps> = ({
  onSignInClick,
  onGetStartedClick,
  user,
  onSignOut,
}) => {
  // Active dropdown state: 'product' | 'solutions' | null
  const [activeDropdown, setActiveDropdown] = useState<'product' | 'solutions' | null>(null);

  // Mobile menu drawer toggle state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Ref to close dropdown when clicking outside
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* --------------------------------------------------------------- */}
        {/* Left: Brand Logo                                               */}
        {/* --------------------------------------------------------------- */}
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2 group">
            <Logo size="md" />
          </a>

          {/* Desktop Navigation Menus */}
          <nav className="hidden md:flex items-center gap-1">
            {/* 1. Product Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'product' ? null : 'product')
                }
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeDropdown === 'product'
                    ? 'text-karta-700 bg-surface'
                    : 'text-body hover:text-ink hover:bg-gray-50'
                }`}
                aria-expanded={activeDropdown === 'product'}
              >
                <span>Product</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted transition-transform duration-200 ${
                    activeDropdown === 'product' ? 'rotate-180 text-karta-600' : ''
                  }`}
                />
              </button>

              {/* Product Mega Menu Dropdown */}
              {activeDropdown === 'product' && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-card border border-border shadow-raised p-2 grid gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <a
                    href="#schema-designer"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-karta-50 border border-karta-200 flex items-center justify-center text-karta-600 group-hover:bg-karta-500 group-hover:text-white transition-colors flex-shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink group-hover:text-karta-700">
                        Schema Designer
                      </div>
                      <p className="text-xs text-muted">
                        Design tables, columns, relations & mock data grid.
                      </p>
                    </div>
                  </a>

                  <a
                    href="#flowchart-studio"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink group-hover:text-blue-700">
                        Flowchart Studio
                      </div>
                      <p className="text-xs text-muted">
                        Process flows, decision diamonds & architecture logic.
                      </p>
                    </div>
                  </a>

                  <a
                    href="#ai-assistant"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink group-hover:text-purple-700">
                        AI Diagram Assistant
                      </div>
                      <p className="text-xs text-muted">
                        Generate and explain schemas and flowcharts with AI.
                      </p>
                    </div>
                  </a>

                  <a
                    href="#collaboration"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors flex-shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink group-hover:text-amber-700">
                        Live Collaboration
                      </div>
                      <p className="text-xs text-muted">
                        Multiplayer editing, live cursors & revision history.
                      </p>
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* 2. Solutions Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'solutions' ? null : 'solutions')
                }
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeDropdown === 'solutions'
                    ? 'text-karta-700 bg-surface'
                    : 'text-body hover:text-ink hover:bg-gray-50'
                }`}
                aria-expanded={activeDropdown === 'solutions'}
              >
                <span>Solutions</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted transition-transform duration-200 ${
                    activeDropdown === 'solutions' ? 'rotate-180 text-karta-600' : ''
                  }`}
                />
              </button>

              {/* Solutions Dropdown Menu */}
              {activeDropdown === 'solutions' && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-card border border-border shadow-raised p-2 grid gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <a
                    href="#solutions-backend"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink group-hover:text-emerald-700">
                        Backend Engineers
                      </div>
                      <p className="text-xs text-muted">SQL DDL import/export & DB planning.</p>
                    </div>
                  </a>

                  <a
                    href="#solutions-architects"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink group-hover:text-indigo-700">
                        System Architects
                      </div>
                      <p className="text-xs text-muted">Microservices & distributed system topologies.</p>
                    </div>
                  </a>

                  <a
                    href="#solutions-learners"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 flex-shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink group-hover:text-orange-700">
                        Students & Interview Prep
                      </div>
                      <p className="text-xs text-muted">Visual thinking for database & system design.</p>
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* 3. Templates Anchor Link */}
            <a
              href="#templates"
              className="px-3 py-2 rounded-lg text-sm font-medium text-body hover:text-ink hover:bg-gray-50 transition-colors"
            >
              Templates
            </a>

            {/* 4. Pricing Anchor Link */}
            <a
              href="#pricing"
              className="px-3 py-2 rounded-lg text-sm font-medium text-body hover:text-ink hover:bg-gray-50 transition-colors"
            >
              Pricing
            </a>
          </nav>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Right: Actions (Search, Sign In, Get Started Free)             */}
        {/* --------------------------------------------------------------- */}
        <div className="hidden md:flex items-center gap-3">
          {/* Quick Search Shortcut Button */}
          <button
            type="button"
            className="p-2 text-muted hover:text-ink hover:bg-gray-50 rounded-lg transition-colors"
            title="Search diagrams (Ctrl + K)"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* User Profile or Sign In / Sign Up CTAs */}
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === 'admin' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Admin
                </span>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-border">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-karta-100 border border-karta-300 flex items-center justify-center text-karta-800 font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-ink leading-tight">{user.name}</span>
                  <span className="text-[10px] text-muted truncate max-w-[120px]">{user.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onSignOut}
                className="px-3 py-1.5 text-xs font-medium text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              {/* Sign In Button */}
              <button
                type="button"
                onClick={onSignInClick}
                className="px-3.5 py-1.5 text-sm font-medium text-body hover:text-ink hover:bg-gray-50 rounded-lg transition-colors"
              >
                Sign in
              </button>

              {/* Get Started Free Button (Primary CTA) */}
              <button
                type="button"
                onClick={onGetStartedClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-karta-500 hover:bg-karta-600 active:bg-karta-700 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-karta-300"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Mobile Hamburger Toggle                                         */}
        {/* --------------------------------------------------------------- */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-body hover:text-ink rounded-lg focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Mobile Drawer Menu                                                */}
      {/* ----------------------------------------------------------------- */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="grid gap-1">
            <a
              href="#schema-designer"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-body hover:bg-surface hover:text-karta-700"
            >
              Schema Designer
            </a>
            <a
              href="#flowchart-studio"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-body hover:bg-surface hover:text-karta-700"
            >
              Flowchart Studio
            </a>
            <a
              href="#templates"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-body hover:bg-surface hover:text-karta-700"
            >
              Templates
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-body hover:bg-surface hover:text-karta-700"
            >
              Pricing
            </a>
          </div>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {user ? (
              <>
                <div className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-7 h-7 rounded-full border border-border" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-karta-100 flex items-center justify-center text-xs font-bold text-karta-800">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-ink">{user.name}</span>
                  </div>
                  {user.role === 'admin' && (
                    <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut?.();
                  }}
                  className="w-full text-center py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignInClick?.();
                  }}
                  className="w-full text-center py-2 text-sm font-medium text-body hover:bg-gray-50 rounded-lg border border-border"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGetStartedClick?.();
                  }}
                  className="w-full text-center py-2 text-sm font-semibold text-white bg-karta-500 hover:bg-karta-600 rounded-lg shadow-sm"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
