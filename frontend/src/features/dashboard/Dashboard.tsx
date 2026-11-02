import React, { useState } from 'react';
import {
  Folder,
  Plus,
  Database,
  GitBranch,
  Star,
  ChevronDown,
  Clock,
  Sparkles,
  LogOut,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Logo from '../../components/brand/Logo';
import type { AuthUser } from '../../types/auth';
import type { WorkspaceItem, ProjectItem, DiagramItem } from '../../types/workspace';

export interface DashboardProps {
  user: AuthUser;
  onOpenDiagram: (diagram: DiagramItem) => void;
  onCreateNewDiagram: (type: 'schema' | 'flowchart', projectId?: number) => void;
  onSignOut: () => void;
}

/**
 * Initial Mock Workspaces, Projects, and Diagrams
 * (Mirrors backend data structure from PostgreSQL)
 */
const initialWorkspaces: WorkspaceItem[] = [
  { id: 1, name: "Raj's Personal Workspace", slug: 'w_personal', user_role: 'owner' },
  { id: 2, name: 'Cloud Engineering Team', slug: 'w_engineering', user_role: 'editor' },
];

const initialProjects: ProjectItem[] = [
  {
    id: 101,
    name: 'E-Commerce Platform',
    description: 'PostgreSQL schema for store, cart, inventory, and Stripe billing',
    is_pinned: true,
    is_public: false,
    diagrams_count: 2,
    created_at: '2026-10-31T10:00:00Z',
    updated_at: '2026-11-01T12:30:00Z',
  },
  {
    id: 102,
    name: 'Auth & Identity Gateway',
    description: 'OAuth 2.0 PKCE flowchart and RBAC permission tables',
    is_pinned: false,
    is_public: false,
    diagrams_count: 1,
    created_at: '2026-10-28T08:00:00Z',
    updated_at: '2026-10-30T15:00:00Z',
  },
];

const initialDiagrams: DiagramItem[] = [
  {
    id: 1,
    name: 'E-Commerce Database Schema',
    slug: 'd_ecom_prod',
    type: 'schema',
    is_pinned: true,
    is_public: false,
    project_id: 101,
    updated_at: 'Just now',
  },
  {
    id: 2,
    name: 'OAuth 2.0 RBAC Flowchart',
    slug: 'd_oauth_rbac',
    type: 'flowchart',
    is_pinned: false,
    is_public: true,
    project_id: 102,
    updated_at: '2 hours ago',
  },
  {
    id: 3,
    name: 'Notification Microservice (Draft)',
    slug: 'd_notif_draft',
    type: 'schema',
    is_pinned: false,
    is_public: false,
    project_id: null, // Standalone Draft (No Project!)
    updated_at: 'Yesterday',
  },
];

/**
 * Dashboard Component — Developer Workspace Hub
 * Grounded in: karta_design_system.md and project_structure_lld.md
 */
export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onOpenDiagram,
  onCreateNewDiagram,
  onSignOut,
}) => {
  const [workspaces] = useState<WorkspaceItem[]>(initialWorkspaces);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem>(initialWorkspaces[0]);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState<boolean>(false);

  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [diagrams, setDiagrams] = useState<DiagramItem[]>(initialDiagrams);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const [filterType, setFilterType] = useState<'all' | 'schema' | 'flowchart' | 'pinned'>('all');

  // Toggle favorite pin on diagram
  const handleTogglePinDiagram = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDiagrams((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_pinned: !d.is_pinned } : d))
    );
  };

  // Toggle favorite pin on project
  const handleTogglePinProject = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_pinned: !p.is_pinned } : p))
    );
  };

  // Filtered diagrams list
  const filteredDiagrams = diagrams.filter((d) => {
    if (selectedProjectId !== null && d.project_id !== selectedProjectId) return false;
    if (filterType === 'schema') return d.type === 'schema';
    if (filterType === 'flowchart') return d.type === 'flowchart';
    if (filterType === 'pinned') return d.is_pinned;
    return true;
  });

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans text-ink selection:bg-karta-200 selection:text-karta-900">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Top Navbar: Workspace Switcher & User Profile                  */}
      {/* ----------------------------------------------------------------- */}
      <header className="h-16 border-b border-border bg-white px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Logo size="md" />

          <div className="h-5 w-px bg-border hidden sm:block" />

          {/* Workspace Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-gray-50 transition-colors text-xs font-semibold text-ink"
            >
              <div className="w-4 h-4 rounded bg-karta-100 text-karta-700 flex items-center justify-center text-[10px] font-bold">
                W
              </div>
              <span className="truncate max-w-[150px] sm:max-w-[200px]">
                {activeWorkspace.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted" />
            </button>

            {/* Dropdown Menu */}
            {workspaceMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl border border-border shadow-lg p-1.5 z-40 animate-in fade-in-50 duration-100">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Workspaces
                </div>
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setActiveWorkspace(w);
                      setWorkspaceMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeWorkspace.id === w.id
                        ? 'bg-surface text-karta-800 font-semibold'
                        : 'text-body hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{w.name}</span>
                    <span className="text-[10px] text-muted capitalize bg-gray-100 px-1.5 py-0.5 rounded">
                      {w.user_role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right User Actions */}
        <div className="flex items-center gap-4">
          {user.role === 'admin' && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Admin
            </span>
          )}

          <div className="flex items-center gap-2.5 pl-3 border-l border-border">
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
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-ink leading-tight">{user.name}</span>
              <span className="text-[10px] text-muted truncate max-w-[140px]">{user.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Main Content Container                                         */}
      {/* ----------------------------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Welcome & Quick Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Welcome back, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Select a project or create a blank standalone diagram to start visual thinking.
            </p>
          </div>

          {/* Quick Creation Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onCreateNewDiagram('schema')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-karta-500 hover:bg-karta-600 active:bg-karta-700 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-karta-300"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Schema</span>
            </button>

            <button
              type="button"
              onClick={() => onCreateNewDiagram('flowchart')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-karta-900 bg-surface hover:bg-karta-100 border border-karta-300 rounded-xl transition-all shadow-xs"
            >
              <GitBranch className="w-4 h-4 text-karta-600" />
              <span>+ New Flowchart</span>
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* 3. Projects (Folders View) Section                              */}
        {/* --------------------------------------------------------------- */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-karta-600" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                Project Folders ({projects.length})
              </h2>
            </div>

            {selectedProjectId !== null && (
              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="text-xs font-semibold text-karta-600 hover:text-karta-800 transition-colors"
              >
                Clear filter (Show all)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => {
              const isSelected = selectedProjectId === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() =>
                    setSelectedProjectId(isSelected ? null : proj.id)
                  }
                  className={`group p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-karta-500 ring-2 ring-karta-200 shadow-md bg-surface/30'
                      : 'border-border shadow-xs hover:border-karta-300 hover:shadow-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-surface border border-karta-200 flex items-center justify-center text-karta-700 group-hover:scale-105 transition-transform">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-ink group-hover:text-karta-700 transition-colors truncate max-w-[180px]">
                          {proj.name}
                        </h3>
                        <span className="text-[11px] text-muted">
                          {proj.diagrams_count || 0} diagrams
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleTogglePinProject(proj.id, e)}
                      className={`p-1 rounded-md transition-colors ${
                        proj.is_pinned
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-gray-300 hover:text-gray-500'
                      }`}
                      title={proj.is_pinned ? 'Unpin project' : 'Pin to favorites'}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {proj.description && (
                    <p className="text-xs text-muted mt-3 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Create New Project Card */}
            <div
              onClick={() => alert('📁 Launching New Project Modal')}
              className="p-4 bg-gray-50/60 hover:bg-surface/50 border border-dashed border-gray-300 hover:border-karta-300 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 min-h-[110px]"
            >
              <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-muted group-hover:text-karta-600">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-body hover:text-ink">
                + Create Project Folder
              </span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* 4. Diagrams Grid Section (Schemas, Flowcharts & Standalone)      */}
        {/* --------------------------------------------------------------- */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-karta-600" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                {selectedProjectId !== null
                  ? `Diagrams in "${projects.find((p) => p.id === selectedProjectId)?.name}"`
                  : 'All Diagrams (Schemas & Flowcharts)'}
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-medium text-muted">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'all'
                    ? 'bg-white text-ink font-semibold shadow-xs'
                    : 'hover:text-ink'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('schema')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'schema'
                    ? 'bg-white text-ink font-semibold shadow-xs'
                    : 'hover:text-ink'
                }`}
              >
                Schemas
              </button>
              <button
                type="button"
                onClick={() => setFilterType('flowchart')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'flowchart'
                    ? 'bg-white text-ink font-semibold shadow-xs'
                    : 'hover:text-ink'
                }`}
              >
                Flowcharts
              </button>
              <button
                type="button"
                onClick={() => setFilterType('pinned')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'pinned'
                    ? 'bg-white text-ink font-semibold shadow-xs'
                    : 'hover:text-ink'
                }`}
              >
                Favorites ★
              </button>
            </div>
          </div>

          {/* Diagram Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDiagrams.map((diag) => {
              const isSchema = diag.type === 'schema';
              const parentProject = projects.find((p) => p.id === diag.project_id);

              return (
                <div
                  key={diag.id}
                  onClick={() => onOpenDiagram(diag)}
                  className="group bg-white rounded-2xl border border-border hover:border-karta-400 p-5 shadow-xs hover:shadow-card transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Top Type Badge & Pin */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isSchema
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isSchema ? (
                          <Database className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <GitBranch className="w-3 h-3 text-blue-600" />
                        )}
                        <span>{isSchema ? 'Database Schema' : 'Flowchart'}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleTogglePinDiagram(diag.id, e)}
                        className={`p-1 rounded-md transition-colors ${
                          diag.is_pinned
                            ? 'text-amber-500 hover:text-amber-600'
                            : 'text-gray-300 hover:text-gray-500'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {/* Diagram Title */}
                    <h3 className="text-base font-bold text-ink group-hover:text-karta-700 transition-colors line-clamp-1 mb-1">
                      {diag.name}
                    </h3>

                    {/* Parent Project Label (or Standalone Draft badge) */}
                    <div className="mb-4">
                      {parentProject ? (
                        <span className="text-[11px] text-muted flex items-center gap-1">
                          <Folder className="w-3 h-3" />
                          <span>{parentProject.name}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
                          Standalone Draft (No Project)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Meta & Open Action */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {diag.updated_at}
                    </span>

                    <span className="inline-flex items-center gap-1 text-karta-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Open Canvas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

