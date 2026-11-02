import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  Plus,
  Database,
  GitBranch,
  Star,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  FolderInput,
  Search,
  PanelLeftClose,
  LogOut,
  FolderPlus,
  Sparkles,
  Users,
  Lock,
  Globe,
} from 'lucide-react';
import Logo from '../../../../components/brand/Logo';
import type { AuthUser } from '../../../../types/auth';
import type { ProjectItem, DiagramItem } from '../../../../types/workspace';

export interface CanvasSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  projects: ProjectItem[];
  diagrams: DiagramItem[];
  activeDiagramSlug: string;
  activeMainTab?: 'canvas' | 'members';
  onSelectMainTab?: (tab: 'canvas' | 'members') => void;
  onSelectDiagram: (slug: string) => void;
  onCreateDiagram: (type: 'schema' | 'flowchart', projectId?: number) => void;
  onCreateProject: (name: string) => void;
  onRenameDiagram: (diagramId: number, newName: string) => void;
  onDuplicateDiagram?: (diagramId: number) => void;
  onDeleteDiagram: (diagramId: number) => void;
  onMoveDiagram: (diagramId: number, targetProjectId: number | null) => void;
  onTogglePinDiagram: (diagramId: number) => void;
  onTogglePublicDiagram?: (diagramId: number) => void;
  onRenameProject: (projectId: number, newName: string) => void;
  onDeleteProject: (projectId: number) => void;
  onTogglePinProject: (projectId: number) => void;
  onTogglePublicProject?: (projectId: number) => void;
  onManageProjectMembers?: (project: ProjectItem) => void;
  onManageDiagramMembers?: (diagram: DiagramItem) => void;
  user: AuthUser;
  onSignOut: () => void;
  onUpgradeClick?: () => void;
}

/**
 * CanvasSidebar Component — ChatGPT-Style Persistent Left Dock & Tree
 * Grounded in: karta_design_system.md and project_structure_lld.md
 *
 * HIERARCHY & TYPOGRAPHY ENHANCEMENTS:
 * 1. Clean visual hierarchy: Section Headers -> Project Folders -> Indented Child Diagrams (with vertical tree line).
 * 2. Proper 13px base font for high legibility and genuine IDE/Sidebar feel.
 * 3. Smooth hover and active states (emerald accents).
 * 4. Zero emojis — 100% professional SVG iconography.
 */
export const CanvasSidebar: React.FC<CanvasSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  projects,
  diagrams,
  activeDiagramSlug,
  activeMainTab = 'canvas',
  onSelectMainTab,
  onSelectDiagram,
  onCreateDiagram,
  onCreateProject,
  onRenameDiagram,
  onDuplicateDiagram,
  onDeleteDiagram,
  onMoveDiagram,
  onTogglePinDiagram,
  onTogglePublicDiagram,
  onRenameProject,
  onDeleteProject,
  onTogglePinProject,
  onTogglePublicProject,
  onManageProjectMembers,
  onManageDiagramMembers,
  user,
  onSignOut,
  onUpgradeClick,
}) => {
  // Dropdowns and menus state
  const [isNewDiagramMenuOpen, setIsNewDiagramMenuOpen] = useState<boolean>(false);
  const [isProjectsSectionCollapsed, setIsProjectsSectionCollapsed] = useState<boolean>(false);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<number>>(new Set([101]));
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Three-dots Context Menu State
  const [activeMenu, setActiveMenu] = useState<{
    type: 'diagram' | 'project';
    id: number;
  } | null>(null);

  // Inline creation / rename states
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');

  const [editingItemId, setEditingItemId] = useState<{
    type: 'diagram' | 'project';
    id: number;
    name: string;
  } | null>(null);

  const [movingDiagramId, setMovingDiagramId] = useState<number | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setIsNewDiagramMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle project folder expand/collapse
  const toggleProjectExpand = (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  // Submit new project creation
  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreatingProject(false);
    }
  };

  // Submit rename
  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId || !editingItemId.name.trim()) return;

    if (editingItemId.type === 'diagram') {
      onRenameDiagram(editingItemId.id, editingItemId.name.trim());
    } else {
      onRenameProject(editingItemId.id, editingItemId.name.trim());
    }
    setEditingItemId(null);
  };

  // Standalone diagrams (diagrams without a parent project)
  const standaloneDiagrams = diagrams.filter((d) => d.project_id === null || d.project_id === undefined);

  // Filter items by search query if present
  const matchesSearch = (text: string) =>
    searchQuery === '' || text.toLowerCase().includes(searchQuery.toLowerCase());

  // Render diagram 3-dots context menu helper
  const renderDiagramContextMenu = (diag: DiagramItem) => {
    if (activeMenu?.type !== 'diagram' || activeMenu.id !== diag.id) return null;

    return (
      <div
        ref={menuRef}
        className="absolute right-2 top-7 w-48 bg-white border border-border rounded-xl shadow-xl p-1 z-50 text-xs font-medium"
      >
        <button
          type="button"
          onClick={() => {
            setEditingItemId({ type: 'diagram', id: diag.id, name: diag.name });
            setActiveMenu(null);
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-body hover:text-ink rounded-lg"
        >
          <Edit3 className="w-3.5 h-3.5 text-muted" />
          <span>Rename</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onDuplicateDiagram) onDuplicateDiagram(diag.id);
            setActiveMenu(null);
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-body hover:text-ink rounded-lg"
        >
          <Copy className="w-3.5 h-3.5 text-muted" />
          <span>Duplicate</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onTogglePinDiagram(diag.id);
            setActiveMenu(null);
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-body hover:text-ink rounded-lg"
        >
          <Star className="w-3.5 h-3.5 text-muted" />
          <span>{diag.is_pinned ? 'Unpin' : 'Pin to favorites'}</span>
        </button>

        {/* Toggle Public / Private */}
        <button
          type="button"
          onClick={() => {
            if (onTogglePublicDiagram) onTogglePublicDiagram(diag.id);
            setActiveMenu(null);
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-body hover:text-ink rounded-lg"
        >
          {diag.is_public ? (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Make Private</span>
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Make Public</span>
            </>
          )}
        </button>

        {/* Collaborators Management (for private diagram outside projects) */}
        {!diag.is_public && !diag.project_id && (
          <button
            type="button"
            onClick={() => {
              if (onManageDiagramMembers) onManageDiagramMembers(diag);
              setActiveMenu(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-emerald-700 hover:text-emerald-900 rounded-lg"
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Collaborators ({diag.member_user_ids?.length || 0})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setMovingDiagramId(diag.id);
            setActiveMenu(null);
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-body hover:text-ink rounded-lg"
        >
          <FolderInput className="w-3.5 h-3.5 text-muted" />
          <span>Move to project...</span>
        </button>

        <div className="h-px bg-border my-1" />

        <button
          type="button"
          onClick={() => {
            onDeleteDiagram(diag.id);
            setActiveMenu(null);
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded-lg"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete diagram</span>
        </button>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 1. COLLAPSED MODE: Slim 52px Icon Dock (Click Logo to Expand)
  // ---------------------------------------------------------------------------
  if (isCollapsed) {
    return (
      <aside className="w-[52px] h-screen bg-white border-r border-border flex flex-col items-center justify-between py-3 z-30 select-none flex-shrink-0">
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Square Logo Mark (Clicking toggles/expands sidebar) */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hover:opacity-85 transition-opacity focus:outline-none p-1 rounded-lg hover:bg-gray-100"
            title="Expand Karta Workspace"
          >
            <Logo size="sm" showWordmark={false} />
          </button>

          <div className="w-6 h-px bg-border my-0.5" />

          {/* Quick '+ New Diagram' Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNewDiagramMenuOpen(!isNewDiagramMenuOpen)}
              className="p-2 text-white bg-karta-500 hover:bg-karta-600 active:bg-karta-700 rounded-lg transition-colors shadow-xs"
              title="Create new diagram"
              aria-label="Create new diagram"
            >
              <Plus className="w-4 h-4" />
            </button>

            {isNewDiagramMenuOpen && (
              <div
                ref={menuRef}
                className="absolute left-12 top-0 w-52 bg-white border border-border rounded-xl shadow-xl p-1.5 z-50 text-xs font-medium animate-in fade-in-50 duration-100"
              >
                <button
                  type="button"
                  onClick={() => {
                    onCreateDiagram('schema');
                    setIsNewDiagramMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface text-ink hover:text-karta-800 rounded-lg transition-colors"
                >
                  <Database className="w-4 h-4 text-karta-600" />
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-[13px]">Database Schema</span>
                    <span className="text-[11px] text-muted">Tables, columns, foreign keys</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCreateDiagram('flowchart');
                    setIsNewDiagramMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface text-ink hover:text-karta-800 rounded-lg transition-colors mt-0.5"
                >
                  <GitBranch className="w-4 h-4 text-blue-600" />
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-[13px]">Flowchart</span>
                    <span className="text-[11px] text-muted">Nodes, logic flow, decisions</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="w-6 h-px bg-border my-0.5" />

          {/* Members Dock Icon */}
          <button
            type="button"
            onClick={() => {
              if (onSelectMainTab) onSelectMainTab('members');
            }}
            className={`p-2 rounded-lg transition-colors ${activeMainTab === 'members'
              ? 'bg-gray-100 text-gray-900 font-semibold'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
              }`}
            title="Collaborators"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Search Toggle icon */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 text-muted hover:text-ink hover:bg-gray-100 rounded-lg transition-colors"
            title="Search diagrams"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom: Upgrade Icon + User Avatar */}
        <div className="flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={onUpgradeClick || (() => alert('Upgrade to Pro: Unlimited diagrams, team collaboration, and AI generation.'))}
            className="p-2 text-karta-700 hover:text-karta-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            title="Upgrade to Pro"
          >
            <Sparkles className="w-4 h-4 text-karta-600" />
          </button>

          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-8 h-8 rounded-full border border-border object-cover"
              title={user.name}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full bg-karta-100 border border-karta-300 text-karta-800 font-bold text-xs flex items-center justify-center"
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </aside>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. EXPANDED MODE: Full 264px Sidebar Tree with High-Grade Hierarchy
  // ---------------------------------------------------------------------------
  return (
    <aside className="w-[264px] h-screen bg-white border-r border-border flex flex-col justify-between z-30 select-none flex-shrink-0 animate-in slide-in-from-left-2 duration-150">
      {/* ----------------------------------------------------------------- */}
      {/* Top Header: Logo (Full) & Collapse Button                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <Logo size="sm" showWordmark={true} />

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 text-muted hover:text-ink hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* + New Diagram Button                                            */}
        {/* --------------------------------------------------------------- */}
        <div className="p-3 pb-2 relative">
          <button
            type="button"
            onClick={() => setIsNewDiagramMenuOpen(!isNewDiagramMenuOpen)}
            className="w-full h-9 flex items-center justify-center gap-2 px-3 text-[13px] font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.99] rounded-xl transition-all shadow-sm shadow-emerald-800/15"
          >
            <Plus className="w-4 h-4" />
            <span>New Diagram</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {isNewDiagramMenuOpen && (
            <div
              ref={menuRef}
              className="absolute left-3 right-3 top-13 bg-white border border-border rounded-xl shadow-xl p-1.5 z-50 text-xs font-medium animate-in fade-in-50 duration-100"
            >
              <button
                type="button"
                onClick={() => {
                  onCreateDiagram('schema');
                  setIsNewDiagramMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface text-ink hover:text-karta-800 rounded-lg transition-colors"
              >
                <Database className="w-4 h-4 text-emerald-600" />
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-[13px]">Database Schema</span>
                  <span className="text-[11px] text-muted">Tables, columns, foreign keys</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onCreateDiagram('flowchart');
                  setIsNewDiagramMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface text-ink hover:text-karta-800 rounded-lg transition-colors mt-0.5"
              >
                <GitBranch className="w-4 h-4 text-blue-600" />
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-[13px]">Flowchart</span>
                  <span className="text-[11px] text-muted">Nodes, logic flow, decisions</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Quick Search Input with Shortcut Badge */}
        <div className="px-3 pb-2.5">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search diagrams..."
              className="w-full h-8 pl-8 pr-12 bg-gray-50 border border-border rounded-lg text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:bg-white transition-all"
            />
            <kbd className="absolute right-2 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white border border-gray-200 rounded shadow-2xs pointer-events-none">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Scrollable Navigation Tree: Projects & Recents                    */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto px-2 space-y-3">
        {/* =============================================================== */}
        {/* MEMBERS DOCK TAB                                                */}
        {/* =============================================================== */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              if (onSelectMainTab) onSelectMainTab('members');
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${activeMainTab === 'members'
              ? 'bg-gray-100 text-gray-900 font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium'
              }`}
          >
            <Users className={`w-4 h-4 flex-shrink-0 ${activeMainTab === 'members' ? 'text-emerald-600' : 'text-gray-500'}`} />
            <span>Collaborators</span>
          </button>
        </div>

        {/* =============================================================== */}
        {/* SECTION A: PROJECTS (With Indented Folders and Child Diagrams)   */}
        {/* =============================================================== */}
        <div>
          {/* Section Category Header */}
          <div className="flex items-center justify-between px-2 pt-1 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setIsProjectsSectionCollapsed(!isProjectsSectionCollapsed)}
              className="flex items-center gap-1.5 hover:text-ink transition-colors focus:outline-none"
              title={isProjectsSectionCollapsed ? 'Expand projects' : 'Collapse projects'}
            >
              {isProjectsSectionCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span>Projects</span>
              <span className="text-[10px] font-medium text-gray-400 lowercase">
                ({projects.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreatingProject(true)}
              className="p-1 text-gray-400 hover:text-ink hover:bg-gray-100 rounded-md transition-colors"
              title="Add new project folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Inline New Project Input Form */}
          {isCreatingProject && (
            <form onSubmit={handleCreateProjectSubmit} className="p-2 mb-1.5 bg-surface rounded-xl border border-karta-200 shadow-2xs">
              <input
                type="text"
                autoFocus
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Folder name..."
                className="w-full px-2.5 py-1 text-[13px] bg-white border border-border rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-karta-400"
              />
              <div className="flex items-center justify-end gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="px-2.5 py-1 text-xs text-muted hover:text-ink font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold text-white bg-karta-500 rounded-lg shadow-xs"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* Project Folders Tree */}
          {!isProjectsSectionCollapsed && (
            <div className="space-y-1 mt-1">
              {projects.filter((p) => matchesSearch(p.name)).map((project) => {
                const isExpanded = expandedProjectIds.has(project.id);
                const projectDiagrams = diagrams.filter((d) => d.project_id === project.id);

                return (
                  <div key={project.id} className="group/project">
                    {/* Project Folder Row (Indented Level 1) */}
                    <div
                      onClick={(e) => toggleProjectExpand(project.id, e)}
                      className="mx-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-gray-100/80 cursor-pointer text-gray-800 text-[13px] font-semibold transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        )}
                        <Folder className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{project.name}</span>
                        {project.is_public ? (
                          <span title="Public project" className="flex-shrink-0 flex items-center">
                            <Globe className="w-3 h-3 text-emerald-600" />
                          </span>
                        ) : (
                          <span title="Private project" className="flex-shrink-0 flex items-center">
                            <Lock className="w-3 h-3 text-gray-400" />
                          </span>
                        )}
                      </div>

                      {/* Right icons: Pin & Three-dots */}
                      <div className="flex items-center gap-1">
                        {project.is_pinned && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(
                              activeMenu?.type === 'project' && activeMenu.id === project.id
                                ? null
                                : { type: 'project', id: project.id }
                            );
                          }}
                          className="opacity-0 group-hover/project:opacity-100 p-1 hover:bg-gray-200/70 rounded-md text-muted hover:text-ink transition-opacity"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Project Folder Context Menu */}
                    {activeMenu?.type === 'project' && activeMenu.id === project.id && (
                      <div
                        ref={menuRef}
                        className="ml-6 mr-2 mb-1 bg-white border border-border rounded-xl shadow-xl p-1 z-50 text-xs font-medium"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onCreateDiagram('schema', project.id);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-body hover:text-ink rounded-lg"
                        >
                          <Database className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Add Schema</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onCreateDiagram('flowchart', project.id);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-body hover:text-ink rounded-lg"
                        >
                          <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                          <span>Add Flowchart</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemId({ type: 'project', id: project.id, name: project.name });
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-body hover:text-ink rounded-lg"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-muted" />
                          <span>Rename</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onTogglePinProject(project.id);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-body hover:text-ink rounded-lg"
                        >
                          <Star className="w-3.5 h-3.5 text-muted" />
                          <span>{project.is_pinned ? 'Unpin' : 'Pin to favorites'}</span>
                        </button>

                        {/* Toggle Public / Private */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onTogglePublicProject) onTogglePublicProject(project.id);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-body hover:text-ink rounded-lg"
                        >
                          {project.is_public ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Make Private</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Make Public</span>
                            </>
                          )}
                        </button>

                        {/* Project Collaborators (for private project) */}
                        {!project.is_public && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onManageProjectMembers) onManageProjectMembers(project);
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-emerald-700 hover:text-emerald-900 rounded-lg"
                          >
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Collaborators ({project.member_user_ids?.length || 0})</span>
                          </button>
                        )}

                        <div className="h-px bg-border my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteProject(project.id);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete project</span>
                        </button>
                      </div>
                    )}

                    {/* Child Diagrams strictly belonging to this Project (Indented Level 2 with Guide Line) */}
                    {isExpanded && (
                      <div className="ml-5 pl-3 border-l-2 border-gray-100 space-y-1 my-1">
                        {projectDiagrams.length === 0 ? (
                          <div className="px-2 py-1 text-xs text-muted italic">
                            No diagrams in folder
                          </div>
                        ) : (
                          projectDiagrams.filter((d) => matchesSearch(d.name)).map((diag) => {
                            const isActive = diag.slug === activeDiagramSlug && activeMainTab === 'canvas';
                            return (
                              <div
                                key={diag.id}
                                className="relative group/diag"
                              >
                                <div
                                  onClick={() => {
                                    if (onSelectMainTab) onSelectMainTab('canvas');
                                    onSelectDiagram(diag.slug);
                                  }}
                                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[13px] transition-colors ${isActive
                                    ? 'bg-gray-100 text-gray-900 font-semibold'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {diag.type === 'schema' ? (
                                      <Database className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                                    ) : (
                                      <GitBranch className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                    )}
                                    <span className="truncate">{diag.name}</span>
                                    {diag.is_public ? (
                                      <span title="Public diagram" className="flex-shrink-0 flex items-center">
                                        <Globe className="w-3 h-3 text-emerald-600" />
                                      </span>
                                    ) : (
                                      <span title="Private diagram" className="flex-shrink-0 flex items-center">
                                        <Lock className="w-3 h-3 text-gray-400" />
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenu(
                                        activeMenu?.type === 'diagram' && activeMenu.id === diag.id
                                          ? null
                                          : { type: 'diagram', id: diag.id }
                                      );
                                    }}
                                    className="opacity-0 group-hover/diag:opacity-100 p-1 hover:bg-gray-200/70 rounded-md text-muted hover:text-ink transition-opacity"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Context Menu */}
                                {renderDiagramContextMenu(diag)}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =============================================================== */}
        {/* SECTION B: RECENTS (Standalone Diagrams)                        */}
        {/* =============================================================== */}
        <div>
          {/* Section Category Header */}
          <div className="px-2 pt-2 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Recents
          </div>

          <div className="space-y-1 mt-1">
            {standaloneDiagrams.length === 0 ? (
              <div className="px-2 py-1 text-xs text-muted italic">
                No recent standalone diagrams
              </div>
            ) : (
              standaloneDiagrams.filter((d) => matchesSearch(d.name)).map((diag) => {
                const isActive = diag.slug === activeDiagramSlug && activeMainTab === 'canvas';
                return (
                  <div
                    key={diag.id}
                    className="relative group/standalone"
                  >
                    <div
                      onClick={() => {
                        if (onSelectMainTab) onSelectMainTab('canvas');
                        onSelectDiagram(diag.slug);
                      }}
                      className={`mx-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[13px] transition-colors ${isActive
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium'
                        }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {diag.type === 'schema' ? (
                          <Database className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                        ) : (
                          <GitBranch className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        )}
                        <span className="truncate">{diag.name}</span>
                        {diag.is_public ? (
                          <span title="Public diagram" className="flex-shrink-0 flex items-center">
                            <Globe className="w-3 h-3 text-emerald-600" />
                          </span>
                        ) : (
                          <span title="Private diagram" className="flex-shrink-0 flex items-center">
                            <Lock className="w-3 h-3 text-gray-400" />
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(
                            activeMenu?.type === 'diagram' && activeMenu.id === diag.id
                              ? null
                              : { type: 'diagram', id: diag.id }
                          );
                        }}
                        className="opacity-0 group-hover/standalone:opacity-100 p-1 hover:bg-gray-200/70 rounded-md text-muted hover:text-ink transition-opacity"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Diagram Context Menu */}
                    {renderDiagramContextMenu(diag)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Bottom Section: Upgrade Button & User Profile                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-3 border-t border-border flex flex-col gap-2.5 flex-shrink-0">
        {/* Upgrade Plan Card / Button */}
        <button
          type="button"
          onClick={onUpgradeClick || (() => alert('Upgrade to Pro: Unlimited diagrams, team collaboration, and AI generation.'))}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-karta-200 hover:border-karta-300 text-ink transition-all group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-karta-500 text-white group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-karta-900 leading-tight">Upgrade Plan</span>
              <span className="text-[11px] text-muted leading-tight">Unlimited AI & ELK Layouts</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-karta-700 bg-white border border-karta-200 px-1.5 py-0.5 rounded-md shadow-2xs">
            Pro
          </span>
        </button>

        {/* User Profile & Sign Out */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-border object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-karta-100 border border-karta-300 text-karta-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-[13px] font-semibold text-ink truncate leading-tight">
                {user.name}
              </span>
              <span className="text-[11px] text-muted truncate leading-tight">
                {user.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Move to Project Modal Dialog                                      */}
      {/* ----------------------------------------------------------------- */}
      {movingDiagramId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-border p-4 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-100">
            <h4 className="text-sm font-bold text-ink mb-1">Move Diagram to Project</h4>
            <p className="text-xs text-muted mb-3">Select destination project folder:</p>
            <div className="space-y-1 max-h-48 overflow-y-auto mb-4">
              <button
                type="button"
                onClick={() => {
                  onMoveDiagram(movingDiagramId, null);
                  setMovingDiagramId(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-50 border border-border flex items-center justify-between"
              >
                <span>Standalone (Recents)</span>
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onMoveDiagram(movingDiagramId, p.id);
                    setMovingDiagramId(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-surface border border-border flex items-center justify-between"
                >
                  <span className="font-medium text-ink">{p.name}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMovingDiagramId(null)}
                className="px-3 py-1.5 text-xs text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Inline Rename Modal Dialog                                        */}
      {/* ----------------------------------------------------------------- */}
      {editingItemId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleRenameSubmit}
            className="bg-white rounded-2xl border border-border p-4 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-100"
          >
            <h4 className="text-sm font-bold text-ink mb-1">Rename {editingItemId.type}</h4>
            <input
              type="text"
              autoFocus
              value={editingItemId.name}
              onChange={(e) =>
                setEditingItemId({ ...editingItemId, name: e.target.value })
              }
              className="w-full px-3 py-2 mt-2 bg-gray-50 border border-border rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-karta-400 focus:bg-white"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setEditingItemId(null)}
                className="px-3 py-1.5 text-xs text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-karta-500 hover:bg-karta-600 rounded-lg"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};

export default CanvasSidebar;
