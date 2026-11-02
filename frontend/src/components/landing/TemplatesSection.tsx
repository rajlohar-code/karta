import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Key,
} from 'lucide-react';

/**
 * Template Definition
 */
export interface TemplateItem {
  id: string;
  title: string;
  category: 'schema' | 'architecture' | 'security';
  categoryLabel: string;
  description: string;
  tags: string[];
  type: 'schema' | 'flowchart';
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'ecommerce-schema',
    title: 'E-Commerce Database Schema',
    category: 'schema',
    categoryLabel: 'Database Schema',
    description: 'Relational database schema with users, orders, order items, and product catalog.',
    tags: ['PostgreSQL', '5 Tables', 'Foreign Keys'],
    type: 'schema',
  },
  {
    id: 'auth-rbac-flow',
    title: 'OAuth & Session RBAC Flow',
    category: 'security',
    categoryLabel: 'Security & Auth',
    description: 'Production authentication flow with OAuth, signed session cookies, and role guards.',
    tags: ['Session Auth', 'Flowchart', 'Capability Guards'],
    type: 'flowchart',
  },
  {
    id: 'microservices-topology',
    title: 'Event-Driven Microservices',
    category: 'architecture',
    categoryLabel: 'System Architecture',
    description: 'Distributed topology with API Gateway, event queues, and payment webhook workers.',
    tags: ['Architecture', 'Webhooks', 'Async Queues'],
    type: 'flowchart',
  },
  {
    id: 'multi-tenant-saas',
    title: 'Multi-Tenant SaaS Schema',
    category: 'schema',
    categoryLabel: 'Database Schema',
    description: 'Row-level multi-tenant database design with workspaces, members, and audit logs.',
    tags: ['B2B SaaS', '6 Tables', 'Multi-Tenant'],
    type: 'schema',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'schema', label: 'Database Schemas' },
  { id: 'architecture', label: 'System Architecture' },
  { id: 'security', label: 'Auth & Security' },
] as const;

export interface TemplatesSectionProps {
  onUseTemplate?: (templateId: string) => void;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({
  onUseTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates =
    selectedCategory === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <section id="templates" className="py-16 sm:py-24 bg-canvas border-t border-border/80 relative overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* Background Flowing Organic Waves & Dot Matrix Grids           */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top-Right Soft Wave */}
        <svg
          className="absolute -top-16 -right-16 w-[640px] h-[540px]"
          viewBox="0 0 640 540"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="templatesWaveRight" x1="150" y1="50" x2="600" y2="500" gradientUnits="userSpaceOnUse">
              <stop stopColor="#86efac" stopOpacity="0.50" />
              <stop offset="0.5" stopColor="#bbf7d0" stopOpacity="0.30" />
              <stop offset="0.9" stopColor="#dcfce7" stopOpacity="0.10" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 400,0 C 550,50 680,180 640,340 C 600,480 460,540 320,510 C 260,490 280,380 340,300 C 400,220 340,90 400,0 Z"
            fill="url(#templatesWaveRight)"
          />
        </svg>

        {/* Bottom-Left Soft Wave */}
        <svg
          className="absolute -bottom-20 -left-16 w-[580px] h-[480px]"
          viewBox="0 0 580 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="templatesWaveLeft" x1="50" y1="200" x2="500" y2="450" gradientUnits="userSpaceOnUse">
              <stop stopColor="#bbf7d0" stopOpacity="0.45" />
              <stop offset="0.6" stopColor="#dcfce7" stopOpacity="0.20" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 0,200 C 140,150 280,220 340,340 C 380,420 320,470 200,480 L 0,480 Z"
            fill="url(#templatesWaveLeft)"
          />
        </svg>

        {/* Decorative Dot Matrix near top-left */}
        <div
          className="absolute top-20 left-8 w-28 h-28 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#16a34a 2px, transparent 2px)',
            backgroundSize: '14px 14px',
          }}
        />

        {/* Decorative Dot Matrix near bottom-right */}
        <div
          className="absolute bottom-16 right-8 w-32 h-32 opacity-40"
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
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-karta-200 text-karta-800 text-xs sm:text-sm font-semibold mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-karta-600" />
            <span>Curated Starter Blueprints</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight mb-4">
            Start faster with templates
          </h2>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Jumpstart your schema design or system architecture with production-ready blueprints.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Category Filter Tabs                                          */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-karta-500 text-white shadow-sm'
                    : 'bg-white text-body hover:text-ink hover:bg-gray-50 border border-border'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* High-End Template Cards (Authentic Miniature Diagram Canvas)  */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-raised hover:border-karta-300 transition-all group flex flex-col justify-between"
            >
              {/* Top Miniature Diagram Canvas View */}
              <div className="relative h-48 sm:h-52 bg-[#fbfcfb] border-b border-border/80 p-4 overflow-hidden select-none flex items-center justify-center">
                {/* Subtle dot grid */}
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
                    backgroundSize: '14px 14px',
                  }}
                />

                {/* 1. Miniature E-Commerce Schema Preview */}
                {template.id === 'ecommerce-schema' && (
                  <div className="relative z-10 w-full h-full flex items-center justify-between px-2">
                    {/* SVG Connector */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                      <path
                        d="M 115 70 C 150 70, 160 85, 195 85"
                        stroke="#16a34a"
                        strokeWidth="1.5"
                        fill="none"
                        strokeDasharray="3 2"
                      />
                      <circle cx="115" cy="70" r="2.5" fill="#16a34a" />
                      <circle cx="195" cy="85" r="2.5" fill="#16a34a" />
                    </svg>

                    {/* Table 1: users */}
                    <div className="w-28 bg-white rounded-md border border-border shadow-xs overflow-hidden">
                      <div className="bg-karta-500 text-white px-2 py-0.5 text-[10px] font-semibold">
                        users
                      </div>
                      <div className="p-1 text-[9px] font-mono divide-y divide-gray-100">
                        <div className="py-0.5 flex items-center justify-between text-ink font-semibold">
                          <span className="flex items-center gap-0.5">
                            <Key className="w-2 h-2 text-amber-500" />
                            id
                          </span>
                          <span className="text-[8px] text-muted font-normal">uuid</span>
                        </div>
                        <div className="py-0.5 text-body">email</div>
                        <div className="py-0.5 text-body">created_at</div>
                      </div>
                    </div>

                    {/* Table 2: orders */}
                    <div className="w-28 bg-white rounded-md border border-border shadow-xs overflow-hidden">
                      <div className="bg-karta-500 text-white px-2 py-0.5 text-[10px] font-semibold">
                        orders
                      </div>
                      <div className="p-1 text-[9px] font-mono divide-y divide-gray-100">
                        <div className="py-0.5 flex items-center justify-between text-ink font-semibold">
                          <span className="flex items-center gap-0.5">
                            <Key className="w-2 h-2 text-amber-500" />
                            id
                          </span>
                          <span className="text-[8px] text-muted font-normal">uuid</span>
                        </div>
                        <div className="py-0.5 text-karta-700 bg-surface rounded px-0.5 font-semibold">
                          user_id (FK)
                        </div>
                        <div className="py-0.5 text-body">total_amount</div>
                      </div>
                    </div>

                    {/* Table 3: products */}
                    <div className="w-28 bg-white rounded-md border border-border shadow-xs overflow-hidden hidden sm:block">
                      <div className="bg-karta-500 text-white px-2 py-0.5 text-[10px] font-semibold">
                        products
                      </div>
                      <div className="p-1 text-[9px] font-mono divide-y divide-gray-100">
                        <div className="py-0.5 flex items-center justify-between text-ink font-semibold">
                          <span className="flex items-center gap-0.5">
                            <Key className="w-2 h-2 text-amber-500" />
                            id
                          </span>
                          <span className="text-[8px] text-muted font-normal">uuid</span>
                        </div>
                        <div className="py-0.5 text-body">title</div>
                        <div className="py-0.5 text-body">price</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Miniature OAuth Flowchart Preview */}
                {template.id === 'auth-rbac-flow' && (
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="px-3 py-1 bg-white border border-karta-500 text-karta-700 rounded-full text-[10px] font-semibold shadow-xs">
                      OAuth Login
                    </div>
                    <div className="w-4 h-[1.5px] bg-karta-400" />
                    <div className="relative w-16 h-9 flex items-center justify-center">
                      <div className="absolute inset-0 border border-karta-500 bg-surface rounded rotate-45 transform scale-75" />
                      <span className="relative z-10 text-[9px] font-bold text-ink">
                        Valid?
                      </span>
                    </div>
                    <div className="w-4 h-[1.5px] bg-karta-400" />
                    <div className="flex flex-col gap-1.5">
                      <div className="px-2 py-0.5 bg-surface border border-karta-400 text-karta-700 rounded text-[9px] font-semibold">
                        Set Cookie
                      </div>
                      <div className="px-2 py-0.5 bg-white border border-border text-muted rounded text-[9px]">
                        Deny 401
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Miniature Microservices Topology Preview */}
                {template.id === 'microservices-topology' && (
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="px-2.5 py-1.5 bg-white border border-karta-500 rounded-lg text-[10px] font-semibold text-ink shadow-xs">
                      API Gateway
                    </div>
                    <div className="w-4 h-[1.5px] bg-karta-400" />
                    <div className="px-3 py-1 bg-surface border border-karta-400 text-karta-700 rounded-md text-[10px] font-semibold">
                      Event Bus
                    </div>
                    <div className="w-4 h-[1.5px] bg-karta-400" />
                    <div className="flex flex-col gap-1.5">
                      <div className="px-2 py-0.5 bg-white border border-border text-body rounded text-[9px]">
                        Billing Queue
                      </div>
                      <div className="px-2 py-0.5 bg-white border border-border text-body rounded text-[9px]">
                        Webhook Worker
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Miniature Multi-Tenant SaaS Schema Preview */}
                {template.id === 'multi-tenant-saas' && (
                  <div className="relative z-10 w-full h-full flex items-center justify-around px-2">
                    {/* SVG Connector */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                      <path
                        d="M 120 70 C 160 70, 170 85, 210 85"
                        stroke="#16a34a"
                        strokeWidth="1.5"
                        fill="none"
                        strokeDasharray="3 2"
                      />
                      <circle cx="120" cy="70" r="2.5" fill="#16a34a" />
                      <circle cx="210" cy="85" r="2.5" fill="#16a34a" />
                    </svg>

                    <div className="w-28 bg-white rounded-md border border-border shadow-xs overflow-hidden">
                      <div className="bg-karta-500 text-white px-2 py-0.5 text-[10px] font-semibold">
                        workspaces
                      </div>
                      <div className="p-1 text-[9px] font-mono divide-y divide-gray-100">
                        <div className="py-0.5 flex items-center justify-between text-ink font-semibold">
                          <span>id (PK)</span>
                        </div>
                        <div className="py-0.5 text-body">name</div>
                        <div className="py-0.5 text-body">slug</div>
                      </div>
                    </div>

                    <div className="w-28 bg-white rounded-md border border-border shadow-xs overflow-hidden">
                      <div className="bg-karta-500 text-white px-2 py-0.5 text-[10px] font-semibold">
                        members
                      </div>
                      <div className="p-1 text-[9px] font-mono divide-y divide-gray-100">
                        <div className="py-0.5 flex items-center justify-between text-ink font-semibold">
                          <span>id (PK)</span>
                        </div>
                        <div className="py-0.5 text-karta-700 bg-surface rounded px-0.5 font-semibold">
                          workspace_id
                        </div>
                        <div className="py-0.5 text-body">role</div>
                      </div>
                    </div>

                    <div className="w-28 bg-white rounded-md border border-border shadow-xs overflow-hidden hidden sm:block">
                      <div className="bg-karta-500 text-white px-2 py-0.5 text-[10px] font-semibold">
                        audit_logs
                      </div>
                      <div className="p-1 text-[9px] font-mono divide-y divide-gray-100">
                        <div className="py-0.5 text-ink font-semibold">id (PK)</div>
                        <div className="py-0.5 text-body">action</div>
                        <div className="py-0.5 text-body">created_at</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating Category Pill in Top-Right */}
                <div className="absolute top-2.5 right-2.5 z-20">
                  <span className="text-[10px] font-semibold text-karta-800 bg-surface border border-karta-200 px-2 py-0.5 rounded-full shadow-xs">
                    {template.categoryLabel}
                  </span>
                </div>
              </div>

              {/* Bottom Card Content & Actions */}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-ink group-hover:text-karta-700 transition-colors mb-1.5">
                    {template.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted leading-relaxed mb-4">
                    {template.description}
                  </p>

                  {/* Clean Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-5">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium text-body bg-gray-50 border border-border px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sleek Action Button */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onUseTemplate?.(template.id)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-karta-600 hover:text-karta-700 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Use Template in Playground</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TemplatesSection;
