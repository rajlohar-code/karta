import React from 'react';
import {
  Database,
  GitBranch,
  Key,
  CheckCircle2,
  TableProperties,
  ArrowRight,
  Cpu,
  Layers,
} from 'lucide-react';

/**
 * DualToolsSection Component — Showcases Karta's 2 Core Engines:
 * 1. Database Schema Designer
 * 2. Flowchart Designer
 *
 * Grounded in: karta_design_system.md and user's landing page screenshot
 */
export const DualToolsSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-white border-t border-border/80 relative overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* Background Flowing Organic Waves & Dot Matrix Grids           */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Left Side Organic Flowing Wave */}
        <svg
          className="absolute -top-20 -left-20 w-[680px] h-[580px]"
          viewBox="0 0 680 580"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="dualToolsWaveLeft" x1="50" y1="50" x2="600" y2="500" gradientUnits="userSpaceOnUse">
              <stop stopColor="#86efac" stopOpacity="0.55" />
              <stop offset="0.5" stopColor="#bbf7d0" stopOpacity="0.35" />
              <stop offset="0.85" stopColor="#dcfce7" stopOpacity="0.20" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 0,100 C 180,60 360,180 320,380 C 290,480 180,560 60,540 C 0,530 -20,400 0,100 Z"
            fill="url(#dualToolsWaveLeft)"
          />
        </svg>

        {/* Right Side Fluid Accent Wave */}
        <svg
          className="absolute -bottom-24 -right-16 w-[620px] h-[520px]"
          viewBox="0 0 620 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="dualToolsWaveRight" x1="450" y1="100" x2="100" y2="450" gradientUnits="userSpaceOnUse">
              <stop stopColor="#bbf7d0" stopOpacity="0.50" />
              <stop offset="0.6" stopColor="#dcfce7" stopOpacity="0.25" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 550,60 C 400,120 320,280 380,440 C 420,500 500,520 620,500 L 620,60 Z"
            fill="url(#dualToolsWaveRight)"
          />
        </svg>

        {/* Decorative Dot Matrix on Left */}
        <div
          className="absolute top-28 left-6 w-28 h-28 opacity-45"
          style={{
            backgroundImage: 'radial-gradient(#16a34a 2px, transparent 2px)',
            backgroundSize: '14px 14px',
          }}
        />

        {/* Decorative Dot Matrix on Right */}
        <div
          className="absolute bottom-20 right-10 w-32 h-32 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#16a34a 2px, transparent 2px)',
            backgroundSize: '14px 14px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ------------------------------------------------------------- */}
        {/* Section Header                                                */}
        {/* ------------------------------------------------------------- */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-karta-200 text-karta-800 text-xs sm:text-sm font-semibold mb-4 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-karta-600" />
            <span>Two Powerful Tools</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight mb-4">
            Schema Designer & Flowchart Designer
          </h2>

          {/* Subheading (Clean, human developer copy) */}
          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            From database schemas to complex process flows, plan and visualize your complete system in one workspace.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2-Column Side-by-Side Tool Cards                              */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {/* =========================================================== */}
          {/* TOOL 1: DATABASE SCHEMA DESIGNER                            */}
          {/* =========================================================== */}
          <div className="bg-canvas border border-border rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-card hover:shadow-raised transition-all group">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-surface border border-karta-200 flex items-center justify-center text-karta-600 shadow-xs group-hover:bg-karta-500 group-hover:text-white transition-all">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-ink">
                      Database Schema
                    </h3>
                    <p className="text-xs text-muted">Relational database modeling & SQL generation</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-medium text-karta-700 bg-surface border border-karta-200 px-2.5 py-1 rounded-full">
                  PostgreSQL · MySQL
                </span>
              </div>

              {/* Visual Interactive Preview Box */}
              <div className="relative h-64 sm:h-72 bg-white rounded-2xl border border-border shadow-xs p-4 overflow-hidden mb-6 select-none">
                {/* Dot grid pattern */}
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />

                {/* SVG Relationship Connector */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 148 60 C 185 60, 195 86, 230 86"
                    stroke="#16a34a"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="4 2"
                  />
                  <circle cx="148" cy="60" r="3" fill="#16a34a" />
                  <circle cx="230" cy="86" r="3" fill="#16a34a" />
                </svg>

                {/* Table 1: users */}
                <div
                  style={{ left: '16px', top: '16px' }}
                  className="absolute w-36 bg-white rounded-lg border border-border shadow-xs overflow-hidden z-20"
                >
                  <div className="bg-karta-500 text-white px-2.5 py-1 text-xs font-semibold flex items-center justify-between">
                    <span>users</span>
                    <span className="text-[9px] bg-karta-600/80 px-1 rounded">Table</span>
                  </div>
                  <div className="p-1.5 text-[10px] font-mono divide-y divide-gray-100">
                    <div className="py-0.5 px-1 flex items-center justify-between text-ink font-semibold">
                      <span className="flex items-center gap-1">
                        <Key className="w-2.5 h-2.5 text-amber-500" />
                        id
                      </span>
                      <span className="text-[9px] text-muted font-normal">uuid · PK</span>
                    </div>
                    <div className="py-0.5 px-1 flex items-center justify-between text-body">
                      <span>email</span>
                      <span className="text-[9px] text-muted">varchar</span>
                    </div>
                    <div className="py-0.5 px-1 flex items-center justify-between text-body">
                      <span>created_at</span>
                      <span className="text-[9px] text-muted">timestamptz</span>
                    </div>
                  </div>
                </div>

                {/* Table 2: orders */}
                <div
                  style={{ left: '230px', top: '24px' }}
                  className="absolute w-40 bg-white rounded-lg border border-border shadow-xs overflow-hidden z-20"
                >
                  <div className="bg-karta-500 text-white px-2.5 py-1 text-xs font-semibold flex items-center justify-between">
                    <span>orders</span>
                    <span className="text-[9px] bg-karta-600/80 px-1 rounded">Table</span>
                  </div>
                  <div className="p-1.5 text-[10px] font-mono divide-y divide-gray-100">
                    <div className="py-0.5 px-1 flex items-center justify-between text-ink font-semibold">
                      <span className="flex items-center gap-1">
                        <Key className="w-2.5 h-2.5 text-amber-500" />
                        id
                      </span>
                      <span className="text-[9px] text-muted font-normal">uuid · PK</span>
                    </div>
                    <div className="py-0.5 px-1 flex items-center justify-between text-karta-700 bg-surface/70 rounded">
                      <span className="font-semibold">user_id</span>
                      <span className="text-[9px] text-karta-600 font-bold">uuid · FK</span>
                    </div>
                    <div className="py-0.5 px-1 flex items-center justify-between text-body">
                      <span>total_amount</span>
                      <span className="text-[9px] text-muted">numeric</span>
                    </div>
                    <div className="py-0.5 px-1 flex items-center justify-between text-body">
                      <span>status</span>
                      <span className="text-[9px] text-muted">varchar</span>
                    </div>
                  </div>
                </div>

                {/* Floating Mock Data Feeder Badge */}
                <div className="absolute left-4 bottom-4 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-karta-200 text-karta-700 text-[11px] font-medium shadow-xs">
                  <TableProperties className="w-3.5 h-3.5 text-karta-600" />
                  <span>Mock Data Feeder (Sample rows included)</span>
                </div>
              </div>

              {/* Feature Points */}
              <div className="space-y-2.5 mb-6 text-sm text-body">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-karta-500 flex-shrink-0" />
                  <span>Visual column types, primary keys, and foreign-key linking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-karta-500 flex-shrink-0" />
                  <span>Deterministic PostgreSQL SQL DDL import and export</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-karta-500 flex-shrink-0" />
                  <span>Interactive Table Inspector drawer with live mock sample rows</span>
                </div>
              </div>
            </div>

            {/* Bottom Link */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-karta-700">Explore Schema Studio</span>
              <ArrowRight className="w-4 h-4 text-karta-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* =========================================================== */}
          {/* TOOL 2: FLOWCHART DESIGNER                                  */}
          {/* =========================================================== */}
          <div className="bg-canvas border border-border rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-card hover:shadow-raised transition-all group">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-surface border border-karta-200 flex items-center justify-center text-karta-600 shadow-xs group-hover:bg-karta-500 group-hover:text-white transition-all">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-ink">
                      Flowchart Designer
                    </h3>
                    <p className="text-xs text-muted">Architecture logic, process steps & decision trees</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-medium text-karta-700 bg-surface border border-karta-200 px-2.5 py-1 rounded-full">
                  System Architecture
                </span>
              </div>

              {/* Visual Interactive Preview Box */}
              <div className="relative h-64 sm:h-72 bg-white rounded-2xl border border-border shadow-xs p-4 overflow-hidden mb-6 select-none flex flex-col items-center justify-center">
                {/* Dot grid pattern */}
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />

                {/* Flowchart Diagram Visualization */}
                <div className="relative z-10 flex flex-col items-center">
                  {/* Start Node */}
                  <div className="px-4 py-1 bg-white border border-karta-500 text-karta-700 rounded-full text-xs font-semibold shadow-xs mb-2">
                    Start Request
                  </div>

                  {/* Flow Arrow */}
                  <div className="w-[1.5px] h-3 bg-karta-400 mb-1" />

                  {/* Decision Diamond */}
                  <div className="relative w-24 h-12 flex items-center justify-center mb-1">
                    <div className="absolute inset-0 border border-karta-500 bg-surface rounded-md rotate-45 transform scale-80 shadow-xs" />
                    <span className="relative z-10 text-[10px] font-semibold text-ink text-center leading-tight">
                      Token Valid?
                    </span>
                  </div>

                  {/* Flow Branch Paths */}
                  <div className="flex items-center gap-8 mt-2">
                    {/* Branch 1: Yes -> Proceed */}
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-karta-600 font-bold mb-0.5">Yes</span>
                      <div className="px-3 py-1 bg-surface border border-karta-400 text-karta-700 rounded-md text-[11px] font-semibold shadow-xs">
                        Fetch Orders
                      </div>
                    </div>

                    {/* Branch 2: No -> 401 */}
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-muted font-bold mb-0.5">No</span>
                      <div className="px-3 py-1 bg-white border border-border text-muted rounded-md text-[11px] font-medium shadow-xs">
                        Return 401
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Layout Preset Indicator */}
                <div className="absolute right-4 bottom-4 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-karta-200 text-karta-700 text-[11px] font-medium shadow-xs">
                  <Cpu className="w-3.5 h-3.5 text-karta-600" />
                  <span>ELK.js Auto-Layout (Pipeline & Tree)</span>
                </div>
              </div>

              {/* Feature Points */}
              <div className="space-y-2.5 mb-6 text-sm text-body">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-karta-500 flex-shrink-0" />
                  <span>Directed process flow edges with labeled decision branches</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-karta-500 flex-shrink-0" />
                  <span>5 Auto-layout algorithms (Pipeline, Organic, Tree, Radial, Grid)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-karta-500 flex-shrink-0" />
                  <span>Freeform Canvas Sticky Notes with 6 curated pastel presets</span>
                </div>
              </div>
            </div>

            {/* Bottom Link */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-karta-700">Explore Flowchart Studio</span>
              <ArrowRight className="w-4 h-4 text-karta-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DualToolsSection;
