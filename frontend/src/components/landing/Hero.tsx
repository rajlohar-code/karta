import React from 'react';
import {
  Zap,
  ArrowRight,
  Play,
  Database,
  Sparkles,
  Search,
  Users,
  ShieldCheck,
} from 'lucide-react';
import CanvasMockup from './CanvasMockup';

/**
 * HeroProps — Interface for the Hero Component
 */
export interface HeroProps {
  /** Callback fired when user clicks 'Start Designing Free' */
  onStartDesigning?: () => void;

  /** Callback fired when user clicks 'Watch Demo' */
  onWatchDemo?: () => void;
}

/**
 * Feature Strip Item Definition
 */
interface FeatureItem {
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: Database,
    iconBg: 'bg-surface border-karta-200',
    iconColor: 'text-karta-600',
    title: 'Powerful Diagram Editor',
    description: 'Design DB schemas & flowcharts visually',
  },
  {
    icon: Sparkles,
    iconBg: 'bg-surface border-karta-200',
    iconColor: 'text-karta-600',
    title: 'AI-Powered Creation',
    description: 'Generate and understand diagrams with AI',
  },
  {
    icon: Search,
    iconBg: 'bg-surface border-karta-200',
    iconColor: 'text-karta-600',
    title: 'Smart Search (RAG)',
    description: 'Find anything across your diagrams',
  },
  {
    icon: Users,
    iconBg: 'bg-surface border-karta-200',
    iconColor: 'text-karta-600',
    title: 'Real-time Collaboration',
    description: 'Work together with your team',
  },
  {
    icon: ShieldCheck,
    iconBg: 'bg-surface border-karta-200',
    iconColor: 'text-karta-600',
    title: 'Secure & Flexible',
    description: 'Your data, your control',
  },
];

/**
 * Hero Component — Main Headline & Value Proposition
 * Grounded in: karta_design_system.md and user's landing page screenshot
 */
export const Hero: React.FC<HeroProps> = ({
  onStartDesigning,
  onWatchDemo,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* ------------------------------------------------------------- */}
      {/* Background Flowing Organic Waves & Dot Matrix Grids           */}
      {/* Exact match to the reference screenshot branding              */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Flowing Organic Green Waves */}
        <svg
          className="absolute -top-16 right-0 w-[820px] h-[720px]"
          viewBox="0 0 820 720"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="heroGreenWave" x1="300" y1="20" x2="800" y2="600" gradientUnits="userSpaceOnUse">
              <stop stopColor="#86efac" stopOpacity="0.75" />
              <stop offset="0.45" stopColor="#bbf7d0" stopOpacity="0.55" />
              <stop offset="0.8" stopColor="#dcfce7" stopOpacity="0.30" />
              <stop offset="1" stopColor="#f0fdf4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="heroBottomWave" x1="100" y1="380" x2="700" y2="700" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4ade80" stopOpacity="0.50" />
              <stop offset="0.5" stopColor="#86efac" stopOpacity="0.35" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Upper Fluid Curve wrapping the top-right of canvas */}
          <path
            d="M 500,0 C 660,60 820,140 800,350 C 780,520 620,620 480,590 C 340,560 380,420 440,320 C 500,220 420,110 500,0 Z"
            fill="url(#heroGreenWave)"
          />

          {/* Lower Fluid Curve swooping under the canvas */}
          <path
            d="M 160,450 C 320,400 520,510 680,460 C 740,440 800,490 810,560 C 780,680 560,710 380,670 C 190,630 90,510 160,450 Z"
            fill="url(#heroBottomWave)"
          />
        </svg>

        {/* Center-Left Decorative Dot Grid Matrix (Between text & canvas) */}
        <div
          className="absolute top-64 left-[40%] w-32 h-32 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(#16a34a 2px, transparent 2px)',
            backgroundSize: '14px 14px',
          }}
        />

        {/* Far-Right Decorative Dot Grid Matrix (Right of canvas) */}
        <div
          className="absolute top-16 right-4 w-36 h-36 opacity-55"
          style={{
            backgroundImage: 'radial-gradient(#16a34a 2px, transparent 2px)',
            backgroundSize: '14px 14px',
          }}
        />

        {/* Ambient background soft glow behind headline */}
        <div className="absolute top-12 left-8 w-96 h-96 bg-karta-200/50 rounded-full blur-3xl" />
      </div>

      {/* Main Hero Content (relative z-10 so it sits ON TOP of the waves) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ------------------------------------------------------------- */}
        {/* Top 2-Column Hero Grid: Left Content vs Right Canvas Mockup  */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-16 lg:mb-24">
          {/* Left Column (5 Cols on Large screens) */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-karta-200 text-karta-800 text-xs sm:text-sm font-medium mb-6 shadow-xs">
              <Zap className="w-4 h-4 text-karta-600 fill-karta-500" />
              <span>Visual Database & Flowchart Designer</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-ink tracking-tight leading-[1.1] mb-5">
              Visual thinking <br />
              for <span className="text-karta-500">developers</span>
            </h1>

            {/* Subheading (Clean, natural, human copy) */}
            <p className="text-base sm:text-lg text-body max-w-lg mb-8 leading-relaxed">
              Design database schemas, build flowcharts, and plan your software architecture in one collaborative workspace.
            </p>

            {/* CTA Buttons Row */}
            <div className="flex flex-wrap items-center gap-3.5 mb-6 w-full sm:w-auto">
              {/* Primary Green CTA */}
              <button
                type="button"
                onClick={onStartDesigning}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-karta-500 hover:bg-karta-600 active:bg-karta-700 rounded-full transition-all shadow-raised hover:shadow-lg focus:outline-none focus:ring-3 focus:ring-karta-200"
              >
                <span>Start Designing Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secondary Watch Demo CTA */}
              <button
                type="button"
                onClick={onWatchDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-base font-semibold text-ink bg-white hover:bg-gray-50 active:bg-gray-100 border border-border rounded-full transition-all shadow-card hover:shadow-md"
              >
                <div className="w-6 h-6 rounded-full bg-karta-50 border border-karta-200 flex items-center justify-center text-karta-600">
                  <Play className="w-3 h-3 fill-karta-600 ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Clean, authentic developer reassurance (No fake social proof) */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>✦ Free to start</span>
              <span>•</span>
              <span>No credit card required</span>
              <span>•</span>
              <span>Instant playground</span>
            </div>
          </div>

          {/* Right Column: Interactive Canvas Mockup (7 Cols on Large screens) */}
          <div className="lg:col-span-7">
            <CanvasMockup />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Bottom Feature Strip (5 Benefit Cards from Screenshot)        */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-border/80">
          {FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-border/80 hover:border-karta-300 transition-all hover:shadow-card group cursor-default"
              >
                <div
                  className="w-10 h-10 rounded-xl bg-surface border border-karta-200 flex items-center justify-center text-karta-600 flex-shrink-0 group-hover:bg-karta-500 group-hover:text-white transition-all shadow-xs"
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-ink leading-tight mb-1 group-hover:text-karta-800 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Hero;
