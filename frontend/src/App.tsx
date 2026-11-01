import { useState } from 'react'

/**
 * App Component — Root view of the Karta Frontend
 * Grounded in: karta_design_system.md
 *
 * This component showcases:
 * 1. Karta Brand Identity (Forest green #16a34a, rounded 8px tokens)
 * 2. React state hook (useState) to demonstrate interactive click handling
 * 3. Tailwind utility classes mapped to our custom design system
 */
export default function App() {
  // Local state to track interactive button clicks
  // count: current number of clicks
  // setCount: function to update count and trigger re-render
  const [clickCount, setClickCount] = useState<number>(0)

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      {/* ------------------------------------------------------------------- */}
      {/* Main Hero Card Container (12px card border radius) */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white border border-border rounded-card p-8 shadow-card max-w-md w-full text-center">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* Logo mark: 32x32 rounded square in Primary Green (#16a34a) */}
          <div className="w-8 h-8 bg-karta-500 rounded-lg flex items-center justify-center shadow-sm">
            {/* 4-square icon representing schema tables & flow nodes */}
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-white rounded-[1px]"></div>
              <div className="bg-white rounded-[1px]"></div>
              <div className="bg-white rounded-[1px]"></div>
              <div className="bg-karta-200 rounded-[1px]"></div>
            </div>
          </div>

          {/* Wordmark */}
          <span className="text-2xl font-semibold text-karta-700 tracking-[-0.5px]">
            Karta
          </span>
        </div>

        {/* Brand Tagline */}
        <p className="text-sm text-muted mb-6 italic">
          Visual thinking for developers
        </p>

        {/* Phase 0 Status Badge */}
        <div className="inline-flex items-center gap-2 bg-surface text-karta-700 border border-karta-200 text-xs px-3 py-1.5 rounded-full mb-6 font-medium">
          <span className="w-2 h-2 rounded-full bg-karta-500 animate-pulse"></span>
          Phase 0: Environment & Tooling Ready
        </div>

        {/* Interactive Click Counter Demonstration */}
        <div className="mb-6 p-4 bg-bg rounded-lg border border-border">
          <p className="text-xs text-muted mb-1">Testing React State (useState)</p>
          <p className="text-xl font-semibold text-ink">
            Clicks: <span className="text-karta-600">{clickCount}</span>
          </p>
        </div>

        {/* Action Buttons styled strictly per karta_design_system.md */}
        <div className="flex flex-col gap-3">
          {/* Primary Button */}
          <button
            type="button"
            onClick={() => setClickCount(clickCount + 1)}
            className="w-full bg-karta-500 hover:bg-karta-600 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-karta-200"
          >
            Increment Counter
          </button>

          {/* Secondary Reset Button */}
          {clickCount > 0 && (
            <button
              type="button"
              onClick={() => setClickCount(0)}
              className="w-full bg-surface hover:bg-karta-200 text-karta-700 border border-karta-200 font-medium text-xs py-1.5 px-3 rounded-lg transition-colors"
            >
              Reset to 0
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <p className="text-xs text-muted mt-6">
        FastAPI Backend + React TypeScript Frontend • Clean DDD Architecture
      </p>
    </div>
  )
}
