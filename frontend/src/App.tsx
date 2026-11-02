import { useState, useEffect, useCallback } from 'react'
import Navbar from './components/landing/Navbar'
import type { AuthUser } from './types/auth'
import Hero from './components/landing/Hero'
import DualToolsSection from './components/landing/DualToolsSection'
import TemplatesSection from './components/landing/TemplatesSection'
import PricingSection from './components/landing/PricingSection'
import LoginModal from './components/auth/LoginModal'
import { API_BASE_URL } from './config/env'
import SchemaCanvas from './features/canvas/components/SchemaCanvas'
import Logo from './components/brand/Logo'

/**
 * App Component — Root view of the Karta Frontend
 * Grounded in: karta_design_system.md and SRS v1.1
 *
 * ARCHITECTURE UPDATE:
 * Following user direction, there is no standalone intermediate dashboard.
 * Logged-in users enter directly into the Visual Canvas with the persistent
 * ChatGPT-style left sidebar dock.
 */
export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'landing' | 'canvas'>('landing');

  // Check current session on mount (via signed HttpOnly cookie)
  const refreshUserSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        // Logged-in user goes directly into the Canvas workspace
        setCurrentView('canvas');
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUserSession();

    // Check if redirected from Google OAuth with an error query param
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');
    if (authError) {
      alert(`Google Auth Notice: ${authError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refreshUserSession]);

  const handleSignOut = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      setCurrentView('landing');
    }
  };

  const handleStartDesigning = () => {
    // Open canvas directly (both for guest and logged-in user)
    setCurrentView('canvas');
  };

  const handleWatchDemo = () => {
    alert('Karta interactive product walkthrough');
  };

  const handleUseTemplate = (_templateId: string) => {
    setCurrentView('canvas');
  };

  const handleSelectPlan = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
    } else {
      alert(`Selected plan: "${planId}" (${billingCycle}). Will launch Razorpay checkout modal.`);
    }
  };

  // 1. Direct Canvas View (with Persistent ChatGPT-Style Left Sidebar)
  if (currentView === 'canvas') {
    return (
      <>
        <SchemaCanvas
          user={currentUser}
          onBackToHome={() => setCurrentView('landing')}
          onOpenAuthModal={() => setIsLoginModalOpen(true)}
          onSignOut={handleSignOut}
        />

        {/* Global Google OAuth Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </>
    );
  }

  // 2. Landing Page View (for first-time visitors / guests before entering canvas)
  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans text-ink selection:bg-karta-200 selection:text-karta-900">
      {/* Official Sticky Navbar */}
      <Navbar
        onSignInClick={() => setIsLoginModalOpen(true)}
        onGetStartedClick={handleStartDesigning}
        user={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Hero Section */}
      <main className="flex-1">
        <Hero
          onStartDesigning={handleStartDesigning}
          onWatchDemo={handleWatchDemo}
        />

        {/* Dual Tools Section (Schema & Flowchart) */}
        <DualToolsSection />

        {/* Ready-to-Use Templates Section */}
        <TemplatesSection onUseTemplate={handleUseTemplate} />

        {/* Developer Pricing Section */}
        <PricingSection onSelectPlan={handleSelectPlan} />
      </main>

      {/* Production SaaS Footer */}
      <footer className="border-t border-border bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xs text-muted hidden sm:inline">
              Visual thinking for developers
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted">
            <a href="#templates" className="hover:text-ink transition-colors">Templates</a>
            <a href="#pricing" className="hover:text-ink transition-colors">Pricing</a>
            <span className="hover:text-ink cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-ink cursor-pointer transition-colors">Terms</span>
          </div>

          <p className="text-xs text-muted">
            &copy; 2026 Karta. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Google OAuth Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

