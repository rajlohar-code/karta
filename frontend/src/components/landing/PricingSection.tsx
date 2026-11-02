import React, { useState } from 'react';
import {
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from 'lucide-react';

/**
 * Plan Definition Interface
 */
export interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  highlighted?: boolean;
  ctaText: string;
  features: string[];
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    tagline: 'Ideal for individual developers, students, and exploratory system design.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    ctaText: 'Start Free Forever',
    features: [
      '1 Personal Workspace',
      'Up to 3 Projects & 5 Diagrams',
      '10 AI Generation queries per day',
      'Deterministic SQL DDL import & export',
      'Standard Diagram Command Engine',
      'Instant canvas playground (No sign-in required)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Builder',
    badge: 'Most Popular',
    tagline: 'For professional software engineers designing production systems.',
    monthlyPrice: 499,
    yearlyPrice: 399,
    highlighted: true,
    ctaText: 'Get Started with Pro',
    features: [
      'Unlimited Workspaces & Projects',
      'Unlimited Database Schemas & Flowcharts',
      'Unlimited AI Diagram Generations',
      'Table Inspector Drawer with Mock Data Feeder',
      'Canvas Sticky Notes with 6 Pastel Presets',
      '5 ELK.js Auto-Layout Algorithms',
      'Full Revision History & Snapshot Recovery',
      'Priority AI Generation Pipeline',
    ],
  },
  {
    id: 'team',
    name: 'Team Studio',
    tagline: 'For engineering teams building, reviewing, and scaling architectures together.',
    monthlyPrice: 1499,
    yearlyPrice: 1199,
    ctaText: 'Start 14-Day Team Trial',
    features: [
      'Everything in Pro Plan',
      'Real-time Multiplayer Collaboration & Live Cursors',
      'Granular Role Permissions (Owner, Editor, Viewer)',
      'Token-based Workspace Invitations',
      'Comprehensive Audit Trail & Activity Logs',
      'Centralized Team Billing (Razorpay Invoicing)',
    ],
  },
];

export interface PricingSectionProps {
  onSelectPlan?: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
}

/**
 * PricingSection Component — Transparent Developer-First Plans
 * Grounded in: karta_design_system.md and SRS Section 10
 */
export const PricingSection: React.FC<PricingSectionProps> = ({
  onSelectPlan,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-white border-t border-border/80 relative overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* Background Flowing Organic Waves & Dot Matrix Grids           */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top-Left Organic Wave */}
        <svg
          className="absolute -top-16 -left-16 w-[660px] h-[560px]"
          viewBox="0 0 660 560"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="pricingWaveLeft" x1="50" y1="50" x2="600" y2="500" gradientUnits="userSpaceOnUse">
              <stop stopColor="#86efac" stopOpacity="0.55" />
              <stop offset="0.5" stopColor="#bbf7d0" stopOpacity="0.35" />
              <stop offset="0.85" stopColor="#dcfce7" stopOpacity="0.15" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 0,80 C 180,40 360,160 340,360 C 310,460 200,540 80,520 C 0,510 -20,380 0,80 Z"
            fill="url(#pricingWaveLeft)"
          />
        </svg>

        {/* Bottom-Right Organic Wave */}
        <svg
          className="absolute -bottom-24 -right-16 w-[680px] h-[580px]"
          viewBox="0 0 680 580"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="pricingWaveRight" x1="550" y1="100" x2="100" y2="500" gradientUnits="userSpaceOnUse">
              <stop stopColor="#bbf7d0" stopOpacity="0.50" />
              <stop offset="0.6" stopColor="#dcfce7" stopOpacity="0.25" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 600,80 C 450,140 360,300 420,460 C 460,520 540,560 680,540 L 680,80 Z"
            fill="url(#pricingWaveRight)"
          />
        </svg>

        {/* Decorative Dot Matrix on Left */}
        <div
          className="absolute top-36 left-6 w-28 h-28 opacity-45"
          style={{
            backgroundImage: 'radial-gradient(#16a34a 2px, transparent 2px)',
            backgroundSize: '14px 14px',
          }}
        />

        {/* Decorative Dot Matrix on Right */}
        <div
          className="absolute bottom-24 right-8 w-32 h-32 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#16a34a 2px, transparent 2px)',
            backgroundSize: '14px 14px',
          }}
        />

        {/* Ambient soft glow in center */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[650px] h-[450px] bg-karta-100/35 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ------------------------------------------------------------- */}
        {/* Section Header                                                */}
        {/* ------------------------------------------------------------- */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-karta-200 text-karta-800 text-xs sm:text-sm font-semibold mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-karta-600" />
            <span>Simple & Transparent Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight mb-4">
            Predictable plans for every stage
          </h2>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed mb-8">
            Start designing schemas and flows for free. Upgrade when your team needs unlimited diagrams and real-time collaboration.
          </p>

          {/* Billing Cycle Switcher (Monthly vs Yearly) */}
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-full border border-border">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] bg-karta-50 text-karta-700 border border-karta-200 px-1.5 py-0.2 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3-Column Plan Cards Grid                                      */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-14">
          {PLANS.map((plan) => {
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const isHighlighted = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all relative ${
                  isHighlighted
                    ? 'bg-white border-2 border-karta-500 shadow-raised lg:-translate-y-2'
                    : 'bg-white border border-border shadow-card hover:border-karta-200'
                }`}
              >
                {/* Popular Pill Badge on Highlighted Plan */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-karta-500 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-white" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Tagline */}
                  <h3 className="text-xl font-bold text-ink mb-1">{plan.name}</h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed mb-6 min-h-[40px]">
                    {plan.tagline}
                  </p>

                  {/* Price Tag */}
                  <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-border">
                    <span className="text-4xl sm:text-5xl font-extrabold text-ink">
                      {price === 0 ? '₹0' : `₹${price}`}
                    </span>
                    <span className="text-xs text-muted font-medium">
                      {price === 0 ? 'forever' : '/ month'}
                    </span>
                    {billingCycle === 'yearly' && price > 0 && (
                      <span className="text-[10px] text-karta-600 font-semibold ml-2">
                        (billed annually)
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <p className="text-xs font-semibold text-ink uppercase tracking-wider">
                      What's Included:
                    </p>
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm text-body">
                        <div className="w-4 h-4 rounded-full bg-surface border border-karta-200 flex items-center justify-center text-karta-600 flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Action CTA */}
                <div>
                  <button
                    type="button"
                    onClick={() => onSelectPlan?.(plan.id, billingCycle)}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                      isHighlighted
                        ? 'bg-karta-500 hover:bg-karta-600 text-white shadow-raised hover:shadow-lg focus:ring-2 focus:ring-karta-200'
                        : 'bg-surface hover:bg-karta-100 text-karta-800 border border-karta-200'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Reassurance & Payment Trust Strip                             */}
        {/* ------------------------------------------------------------- */}
        <div className="border-t border-border/80 pt-8 flex flex-wrap items-center justify-around gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-karta-600" />
            <span>Encrypted & secure checkout via Razorpay</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-karta-600" />
            <span>No credit card required for Free plan</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-karta-600" />
            <span>Instant workspace activation & 1-click cancel</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
