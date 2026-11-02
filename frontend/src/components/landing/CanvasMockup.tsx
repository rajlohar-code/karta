import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  Share2,
  Download,
  MousePointer2,
  Table2,
  GitCommit,
  GitBranch,
  Type,
  Square,
  Plus,
  Sparkles,
  Key,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

/**
 * CanvasMockup Component — Visual Interactive Product Preview in the Hero Section
 * Grounded in: karta_design_system.md and user's landing page screenshot
 *
 * Demonstrates:
 * 1. Database Schema Mode (users & posts tables with PK/FK and relationship edge)
 * 2. Flowchart Mode (Start -> Decision Diamond -> Dashboard / Error)
 * 3. AI Assistant Floating Widget (Instagram schema generation demo)
 * 4. Micro-interactive hover and generate click feedback!
 */
export const CanvasMockup: React.FC = () => {
  // Simulated AI generator button state
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiDone, setAiDone] = useState<boolean>(false);

  const handleGenerateClick = () => {
    setAiGenerating(true);
    setTimeout(() => {
      setAiGenerating(false);
      setAiDone(true);
      setTimeout(() => setAiDone(false), 3000);
    }, 1200);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto lg:max-w-none">
      {/* Soft background ambient green glow behind the mockup */}
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-karta-300/40 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-200/50 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Main Mockup Window Container */}
      <div className="relative z-10 bg-white rounded-2xl border border-border shadow-raised overflow-hidden select-none transition-all hover:shadow-2xl">
        {/* ------------------------------------------------------------- */}
        {/* Mockup Window Header (Navbar)                                */}
        {/* ------------------------------------------------------------- */}
        <div className="h-12 border-b border-border px-3 sm:px-4 flex items-center justify-between bg-white text-xs">
          {/* Left: Window controls & Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* macOS-style window dots */}
            <div className="flex items-center gap-1.5 mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>

            {/* Mini Logo */}
            <div className="flex items-center gap-1.5 font-bold text-karta-800">
              <div className="w-4 h-4 bg-karta-500 rounded-[3px] flex items-center justify-center text-[8px] text-white font-bold">
                +
              </div>
              <span>Karta</span>
            </div>

            {/* Undo / Redo */}
            <div className="hidden sm:flex items-center gap-1 text-muted pl-2 border-l border-border">
              <button type="button" className="p-1 hover:text-ink rounded" aria-label="Undo">
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1 hover:text-ink rounded" aria-label="Redo">
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom selector */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded text-muted border border-border/60">
              <span>100%</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {/* Right: Share & Export CTAs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-karta-700 bg-surface border border-karta-200 rounded-md font-medium hover:bg-karta-100 transition-colors"
            >
              <Share2 className="w-3 h-3 text-karta-600" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-white bg-karta-500 rounded-md font-medium hover:bg-karta-600 transition-colors shadow-sm"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Canvas Body (Left Toolbar + Grid Canvas + Nodes)             */}
        {/* ------------------------------------------------------------- */}
        <div className="relative flex h-[380px] sm:h-[440px] bg-canvas overflow-hidden">
          {/* Subtle dot-grid pattern using radial gradients */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Left Mini Canvas Toolbar */}
          <div className="w-11 sm:w-12 border-r border-border bg-white flex flex-col items-center py-2.5 gap-1.5 z-10">
            <div
              className="p-1.5 rounded-lg bg-surface text-karta-600 border border-karta-200"
              title="Select"
            >
              <MousePointer2 className="w-4 h-4" />
            </div>
            <div
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-gray-100 transition-colors"
              title="Add Table"
            >
              <Table2 className="w-4 h-4" />
            </div>
            <div
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-gray-100 transition-colors"
              title="Add Relation"
            >
              <GitCommit className="w-4 h-4" />
            </div>
            <div
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-gray-100 transition-colors"
              title="Flowchart"
            >
              <GitBranch className="w-4 h-4" />
            </div>
            <div
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-gray-100 transition-colors"
              title="Text"
            >
              <Type className="w-4 h-4" />
            </div>
            <div
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-gray-100 transition-colors"
              title="Shape"
            >
              <Square className="w-4 h-4" />
            </div>
            <div className="h-[1px] w-6 bg-border my-1" />
            <div
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-gray-100 transition-colors"
              title="More"
            >
              <Plus className="w-4 h-4" />
            </div>
          </div>

          {/* Interactive Visual Canvas Area */}
          <div className="relative flex-1 p-4 sm:p-6 overflow-hidden">
            {/* SVG Connecting Relationship Line */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Bezier curve from users.id (right port) to posts.user_id (left port) */}
              <path
                d="M 165 65 C 195 65, 205 92, 235 92"
                stroke="#16a34a"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 2"
              />
              {/* Relation endpoints */}
              <circle cx="165" cy="65" r="3.5" fill="#16a34a" />
              <circle cx="235" cy="92" r="3.5" fill="#16a34a" />
            </svg>

            {/* --------------------------------------------------------- */}
            {/* 1. SCHEMA TABLE: "users"                                 */}
            {/* --------------------------------------------------------- */}
            <div
              style={{ left: '20px', top: '15px' }}
              className="absolute w-36 sm:w-40 bg-white rounded-lg border border-border shadow-card overflow-hidden z-20 transition-transform hover:scale-[1.02]"
            >
              {/* Table Header */}
              <div className="bg-karta-500 text-white px-2.5 py-1 text-xs font-semibold flex items-center justify-between">
                <span>users</span>
                <span className="text-[9px] bg-karta-600/70 px-1 rounded text-white/90">SQL</span>
              </div>
              {/* Columns */}
              <div className="p-1.5 text-[11px] font-mono divide-y divide-gray-100">
                <div className="py-0.5 px-1 flex items-center justify-between text-ink">
                  <span className="font-semibold flex items-center gap-1">
                    <Key className="w-2.5 h-2.5 text-amber-500" />
                    id
                  </span>
                  <span className="text-[9px] text-muted">uuid · PK</span>
                </div>
                <div className="py-0.5 px-1 flex items-center justify-between text-body">
                  <span>email</span>
                  <span className="text-[9px] text-muted">varchar</span>
                </div>
                <div className="py-0.5 px-1 flex items-center justify-between text-body">
                  <span>created_at</span>
                  <span className="text-[9px] text-muted">timestamp</span>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 2. SCHEMA TABLE: "posts"                                 */}
            {/* --------------------------------------------------------- */}
            <div
              style={{ left: '235px', top: '25px' }}
              className="absolute w-36 sm:w-44 bg-white rounded-lg border border-border shadow-card overflow-hidden z-20 transition-transform hover:scale-[1.02]"
            >
              {/* Table Header */}
              <div className="bg-karta-500 text-white px-2.5 py-1 text-xs font-semibold flex items-center justify-between">
                <span>posts</span>
                <span className="text-[9px] bg-karta-600/70 px-1 rounded text-white/90">SQL</span>
              </div>
              {/* Columns */}
              <div className="p-1.5 text-[11px] font-mono divide-y divide-gray-100">
                <div className="py-0.5 px-1 flex items-center justify-between text-ink">
                  <span className="font-semibold flex items-center gap-1">
                    <Key className="w-2.5 h-2.5 text-amber-500" />
                    id
                  </span>
                  <span className="text-[9px] text-muted">uuid · PK</span>
                </div>
                <div className="py-0.5 px-1 flex items-center justify-between text-karta-700 bg-surface/60 rounded">
                  <span className="font-medium">user_id</span>
                  <span className="text-[9px] text-karta-600 font-semibold">uuid · FK</span>
                </div>
                <div className="py-0.5 px-1 flex items-center justify-between text-body">
                  <span>content</span>
                  <span className="text-[9px] text-muted">text</span>
                </div>
                <div className="py-0.5 px-1 flex items-center justify-between text-body">
                  <span>created_at</span>
                  <span className="text-[9px] text-muted">timestamp</span>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3. FLOWCHART NODES                                       */}
            {/* --------------------------------------------------------- */}
            <div className="absolute left-6 bottom-6 sm:bottom-10 z-20 flex flex-col items-center">
              {/* Flowchart Start pill */}
              <div className="px-3.5 py-1 bg-white border border-karta-400 text-karta-700 rounded-full text-xs font-medium shadow-sm mb-3">
                Start
              </div>

              {/* Arrow down */}
              <div className="w-[1.5px] h-3 bg-karta-400 mb-1" />

              {/* Decision Diamond */}
              <div className="relative w-20 h-10 flex items-center justify-center">
                <div className="absolute inset-0 border border-karta-500 bg-surface rounded-md rotate-45 transform scale-75 shadow-sm" />
                <span className="relative z-10 text-[10px] font-semibold text-ink text-center leading-tight">
                  Check Login?
                </span>
              </div>

              {/* Decision branches */}
              <div className="flex items-center gap-6 mt-3">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-karta-600 font-semibold mb-0.5">Yes</span>
                  <div className="px-2.5 py-1 bg-surface border border-karta-400 text-karta-700 rounded text-[10px] font-medium shadow-sm">
                    Dashboard
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-muted font-semibold mb-0.5">No</span>
                  <div className="px-2.5 py-1 bg-white border border-border text-muted rounded text-[10px] font-medium shadow-sm">
                    Show Error
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 4. FLOATING AI ASSISTANT CARD (Bottom Right)             */}
            {/* --------------------------------------------------------- */}
            <div className="absolute right-3 sm:right-6 bottom-3 sm:bottom-6 w-48 sm:w-56 bg-white/95 backdrop-blur-md rounded-xl border border-karta-200 shadow-raised p-3 z-30 transition-all hover:border-karta-400">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <span>AI Assistant</span>
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                </div>
              </div>

              {/* Prompt Text */}
              <p className="text-[11px] text-body mb-2.5 leading-snug">
                Create a complete Instagram database schema.
              </p>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerateClick}
                disabled={aiGenerating}
                className="w-full flex items-center justify-center gap-1.5 bg-karta-500 hover:bg-karta-600 active:bg-karta-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-all shadow-sm disabled:opacity-75"
              >
                {aiGenerating ? (
                  <>
                    <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : aiDone ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span>Schema Generated!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-white" />
                    <span>Generate Schema</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasMockup;
