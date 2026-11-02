import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Plus,
  Copy,
  Check,
  Save,
  ChevronDown,
  ChevronLeft,
  Code2,
  Sparkles,
  StickyNote,
  X,
  FileCode,
  Download,
  Share2,
  Workflow,
  Lock,
  Database,
  GitBranch,
  Users,
  Cog,
  HelpCircle,
  Play,
  Filter,
} from 'lucide-react';
import { nodeTypes } from './nodes/nodeRegistry';
import CanvasSidebar from './sidebar/CanvasSidebar';
import SampleDataModal from './modals/SampleDataModal';
import DiagramViewsDrawer from './drawers/DiagramViewsDrawer';
import { WorkspaceMembersView } from '../../workspace/components/WorkspaceMembersView';
import { InviteMemberModal } from '../../workspace/components/InviteMemberModal';
import { ResourceMembersModal } from '../../workspace/components/ResourceMembersModal';
import {
  listWorkspaces,
  createWorkspace,
} from '../../../api/workspaces';
import {
  listProjects,
  createProject,
  renameProject,
  togglePinProjectApi,
  deleteProjectApi,
} from '../../../api/projects';
import {
  listWorkspaceDiagrams,
  createWorkspaceDiagram,
  renameDiagramApi,
  togglePinDiagramApi,
  deleteDiagramApi,
} from '../../../api/diagrams';
import {
  getWorkspaceCollaborators,
  updateCollaboratorPermissions,
  removeCollaborator,
  sendWorkspaceInvitation,
} from '../../../api/collaborators';
import {
  updateProjectMembers,
  updateDiagramMembers,
  toggleProjectPrivacyApi,
  toggleDiagramPrivacyApi,
} from '../../../api/resources';
import type { AuthUser } from '../../../types/auth';
import type {
  WorkspaceItem,
  ProjectItem,
  DiagramItem,
  WorkspaceMemberItem,
  WorkspacePermissions,
} from '../../../types/workspace';
import { DEFAULT_WORKSPACE_PERMISSIONS } from '../../../types/workspace';
import type { ColumnDefinition, ColumnFilterMode } from '../../../types/schema';

/**
 * LocalStorage Persistence Keys
 */
const STORAGE_KEYS = {
  LAST_WORKSPACE: 'karta_last_workspace_slug',
  LAST_DIAGRAM: 'karta_last_diagram_slug',
  WORKSPACES: 'karta_workspaces_store',
  PROJECTS: 'karta_projects_store',
  DIAGRAMS: 'karta_diagrams_store',
  MEMBERS: 'karta_workspace_members_store',
  SIDEBAR_COLLAPSED: 'karta_sidebar_collapsed',
  CANVAS_PREFIX: 'karta_canvas_state_',
};

/**
 * Seed Data for First-Time Users / Guests
 */
const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 101,
    name: 'demo',
    description: 'Quick start walkthrough and schema blueprints',
    is_pinned: true,
    is_public: false,
    member_user_ids: [1],
    diagrams_count: 1,
    created_at: '2026-10-31',
    updated_at: '2026-10-31',
  },
];

const DEFAULT_DIAGRAMS: DiagramItem[] = [
  {
    id: 1,
    name: 'E-Commerce Database Schema',
    slug: 'd_ecommerce_demo',
    type: 'schema',
    is_pinned: true,
    is_public: false,
    member_user_ids: [1],
    project_id: 101,
    updated_at: 'Just now',
  },
  {
    id: 2,
    name: 'OAuth RBAC Flowchart',
    slug: 'd_oauth_rbac',
    type: 'flowchart',
    is_pinned: false,
    is_public: false,
    member_user_ids: [1],
    project_id: null,
    updated_at: 'Yesterday',
  },
];

/**
 * Seed Workspace Members (PBAC 11 Capabilities)
 */
const DEFAULT_WORKSPACE_MEMBERS: WorkspaceMemberItem[] = [
  {
    id: 1,
    name: 'Raj Lohar',
    email: 'rajlohar2006@gmail.com',
    avatar_url: '',
    is_owner: true,
    joined_at: '2026-10-30',
    permissions: {
      can_view_public_diagrams: true,
      can_create_schemas: true,
      can_create_flowcharts: true,
      can_create_public_diagrams: true,
      can_edit_public_schemas: true,
      can_edit_private_diagrams_if_added: true,
      can_create_public_projects: true,
      can_create_private_projects: true,
      can_add_members_to_private_projects_if_added: true,
      can_use_readonly_ai: true,
      can_use_ai_generation: true,
      can_view_permissions: true,
      can_edit_permissions: true,
    },
  },
  {
    id: 2,
    name: 'Aman Sharma',
    email: 'aman.sharma@example.com',
    joined_at: '2026-10-31',
    permissions: {
      can_view_public_diagrams: true,
      can_create_schemas: true,
      can_create_flowcharts: false,
      can_create_public_diagrams: false,
      can_edit_public_schemas: true,
      can_edit_private_diagrams_if_added: true,
      can_create_public_projects: false,
      can_create_private_projects: true,
      can_add_members_to_private_projects_if_added: false,
      can_use_readonly_ai: true,
      can_use_ai_generation: false,
      can_view_permissions: true,
      can_edit_permissions: false,
    },
  },
  {
    id: 3,
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    joined_at: '2026-11-01',
    permissions: {
      ...DEFAULT_WORKSPACE_PERMISSIONS, // Only can_view_public_diagrams: true, all other 10 false
    },
  },
];

/**
 * Initial Sample Schema Nodes (E-Commerce Blueprint)
 */
const initialSchemaNodes: Node[] = [
  {
    id: 'users',
    type: 'table',
    position: { x: 80, y: 100 },
    data: {
      name: 'users',
      style: { header_bg: 'linear-gradient(135deg, #14532d 0%, #166534 100%)' },
      columns: [
        { name: 'id', type: 'uuid', is_primary_key: true, is_nullable: false },
        { name: 'email', type: 'varchar(255)', is_nullable: false },
        { name: 'name', type: 'varchar(100)', is_nullable: false },
        { name: 'role', type: 'varchar(20)', is_nullable: false },
        { name: 'created_at', type: 'timestamptz', is_nullable: false },
      ],
    },
  },
  {
    id: 'orders',
    type: 'table',
    position: { x: 440, y: 80 },
    data: {
      name: 'orders',
      style: { header_bg: 'linear-gradient(135deg, #166534 0%, #15803d 100%)' },
      columns: [
        { name: 'id', type: 'uuid', is_primary_key: true, is_nullable: false },
        {
          name: 'user_id',
          type: 'uuid',
          is_foreign_key: true,
          is_nullable: false,
          references: { table: 'users', column: 'id' },
        },
        { name: 'amount_in_cents', type: 'integer', is_nullable: false },
        { name: 'status', type: 'varchar(30)', is_nullable: false },
        { name: 'created_at', type: 'timestamptz', is_nullable: false },
      ],
    },
  },
  {
    id: 'order_items',
    type: 'table',
    position: { x: 800, y: 130 },
    data: {
      name: 'order_items',
      style: { header_bg: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)' },
      columns: [
        { name: 'id', type: 'uuid', is_primary_key: true, is_nullable: false },
        {
          name: 'order_id',
          type: 'uuid',
          is_foreign_key: true,
          is_nullable: false,
          references: { table: 'orders', column: 'id' },
        },
        { name: 'product_name', type: 'varchar(255)', is_nullable: false },
        { name: 'quantity', type: 'integer', is_nullable: false },
        { name: 'unit_price', type: 'numeric(10,2)', is_nullable: false },
      ],
    },
  },
];

const initialSchemaEdges: Edge[] = [
  {
    id: 'e_users_orders',
    source: 'users',
    sourceHandle: 'users.id.source',
    target: 'orders',
    targetHandle: 'orders.user_id.target',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#16a34a', strokeWidth: 2 },
  },
  {
    id: 'e_orders_order_items',
    source: 'orders',
    sourceHandle: 'orders.id.source',
    target: 'order_items',
    targetHandle: 'order_items.order_id.target',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#047857', strokeWidth: 2 },
  },
];

/**
 * Initial Sample Flowchart Nodes (OAuth RBAC Workflow Blueprint)
 */
const initialFlowchartNodes: Node[] = [
  {
    id: 'flow_start',
    type: 'flowNode',
    position: { x: 380, y: 40 },
    data: {
      label: 'Incoming User Request',
      node_type: 'terminal',
      status: 'start',
    },
  },
  {
    id: 'flow_verify_session',
    type: 'flowNode',
    position: { x: 345, y: 135 },
    data: {
      label: 'Verify Session Cookie',
      node_type: 'process',
      description: 'HMAC-SHA256 signature check & user lookup',
    },
  },
  {
    id: 'flow_decision_auth',
    type: 'flowNode',
    position: { x: 340, y: 255 },
    data: {
      label: 'Session Valid & Active?',
      node_type: 'decision',
      description: 'Checks expiration and active user status',
    },
  },
  {
    id: 'flow_check_rbac',
    type: 'flowNode',
    position: { x: 640, y: 260 },
    data: {
      label: 'Capability Authorization',
      node_type: 'process',
      description: 'Verify capability permission for workspace',
    },
  },
  {
    id: 'flow_deny_401',
    type: 'flowNode',
    position: { x: 340, y: 440 },
    data: {
      label: '401 Unauthorized',
      node_type: 'terminal',
      status: 'end',
    },
  },
  {
    id: 'flow_allow_200',
    type: 'flowNode',
    position: { x: 660, y: 440 },
    data: {
      label: 'Allow Action (200 OK)',
      node_type: 'terminal',
      status: 'end',
    },
  },
];

const initialFlowchartEdges: Edge[] = [
  {
    id: 'e_start_verify',
    source: 'flow_start',
    sourceHandle: 'terminal-bottom',
    target: 'flow_verify_session',
    targetHandle: 'process-top',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
  },
  {
    id: 'e_verify_decision',
    source: 'flow_verify_session',
    sourceHandle: 'process-bottom',
    target: 'flow_decision_auth',
    targetHandle: 'decision-in',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
  },
  {
    id: 'e_decision_true',
    source: 'flow_decision_auth',
    sourceHandle: 'decision-true',
    target: 'flow_check_rbac',
    targetHandle: 'process-left',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
  },
  {
    id: 'e_decision_false',
    source: 'flow_decision_auth',
    sourceHandle: 'decision-false',
    target: 'flow_deny_401',
    targetHandle: 'terminal-top',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#f43f5e', strokeWidth: 2 },
  },
  {
    id: 'e_rbac_allow',
    source: 'flow_check_rbac',
    sourceHandle: 'process-bottom',
    target: 'flow_allow_200',
    targetHandle: 'terminal-top',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
  },
];

interface SchemaCanvasProps {
  user: AuthUser | null;
  onBackToHome?: () => void;
  onOpenAuthModal: () => void;
  onSignOut?: () => void;
}

/**
 * SchemaCanvas Component
 * Main Visual Canvas View with Dynamic Schema & Flowchart Support
 */
export const SchemaCanvas: React.FC<SchemaCanvasProps> = ({
  user,
  onOpenAuthModal,
  onSignOut,
}) => {
  // ---------------------------------------------------------------------------
  // 1. Projects & Diagrams State with LocalStorage Persistence
  // ---------------------------------------------------------------------------
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return stored ? JSON.parse(stored) : DEFAULT_PROJECTS;
    } catch {
      return DEFAULT_PROJECTS;
    }
  });

  const [diagrams, setDiagrams] = useState<DiagramItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DIAGRAMS);
      return stored ? JSON.parse(stored) : DEFAULT_DIAGRAMS;
    } catch {
      return DEFAULT_DIAGRAMS;
    }
  });

  // Save projects & diagrams whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage:', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(diagrams));
    } catch (e) {
      console.error('Failed to save diagrams to localStorage:', e);
    }
  }, [diagrams]);

  // ---------------------------------------------------------------------------
  // 2. Workspaces State & Persistence (Workspace Switcher in Top Right)
  // ---------------------------------------------------------------------------
  const defaultWorkspaceName = useMemo(() => {
    if (!user) return 'Guest Workspace';
    const firstName = user.name.split(' ')[0];
    return `${firstName}'s Workspace`;
  }, [user]);

  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WORKSPACES);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [
      {
        id: user?.id || 1,
        name: defaultWorkspaceName,
        slug: user ? `ws_user_${user.id}` : 'ws_guest',
        user_role: 'owner',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(workspaces));
    } catch (e) {
      console.error('Failed to save workspaces to localStorage:', e);
    }
  }, [workspaces]);

  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem>(() => {
    const lastSlug = localStorage.getItem(STORAGE_KEYS.LAST_WORKSPACE);
    const found = workspaces.find((w) => w.slug === lastSlug);
    return found || workspaces[0];
  });

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState<boolean>(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState<boolean>(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  // Close workspace menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as unknown as globalThis.Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Persist active selections
  useEffect(() => {
    if (activeWorkspace) {
      localStorage.setItem(STORAGE_KEYS.LAST_WORKSPACE, activeWorkspace.slug);
    }
  }, [activeWorkspace]);

  // Load user workspaces from backend API when authenticated
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    listWorkspaces()
      .then((backendWorkspaces) => {
        if (isMounted && backendWorkspaces && backendWorkspaces.length > 0) {
          setWorkspaces(backendWorkspaces);
          // Preserve currently selected workspace if valid, else pick first
          setActiveWorkspace((current) => {
            const exists = backendWorkspaces.find((w) => w.slug === current?.slug);
            return exists || backendWorkspaces[0];
          });
        }
      })
      .catch((err) => {
        console.warn('Backend workspaces fetch skipped/failed, using local state:', err?.message || err);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Load workspace projects from backend API whenever active workspace changes
  useEffect(() => {
    if (!activeWorkspace?.slug || !user) return;
    let isMounted = true;

    listProjects(activeWorkspace.slug)
      .then((backendProjects) => {
        if (isMounted && backendProjects && backendProjects.length > 0) {
          setProjects(backendProjects);
        }
      })
      .catch((err) => {
        console.warn('Backend projects fetch skipped/failed, using local state:', err?.message || err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeWorkspace?.slug, user]);

  // Handler to create a new workspace (Backend API with local fallback)
  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newWorkspaceName.trim();
    if (!trimmed) return;

    if (user) {
      try {
        const createdWs = await createWorkspace(trimmed);
        setWorkspaces((prev) => [createdWs, ...prev]);
        setActiveWorkspace(createdWs);
        setNewWorkspaceName('');
        setIsCreatingWorkspace(false);
        setIsWorkspaceMenuOpen(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create workspace';
        console.error('Failed to create workspace on backend:', err);
        alert(msg);
      }
    } else {
      const newWs: WorkspaceItem = {
        id: Date.now(),
        name: trimmed,
        slug: `ws_${Date.now()}`,
        user_role: 'owner',
      };
      setWorkspaces((prev) => [...prev, newWs]);
      setActiveWorkspace(newWs);
      setNewWorkspaceName('');
      setIsCreatingWorkspace(false);
      setIsWorkspaceMenuOpen(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2b. View Routing & PBAC Workspace Members Management
  // ---------------------------------------------------------------------------
  const [activeMainTab, setActiveMainTab] = useState<'canvas' | 'members'>('canvas');

  // Workspace Members State (stored in localStorage)
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMemberItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      if (stored) {
        const parsed: WorkspaceMemberItem[] = JSON.parse(stored);
        // Self-healing migration: Ensure every member has all new capabilities & owner flag
        return parsed.map((m) => ({
          ...m,
          is_owner: m.id === 1 || m.email === 'rajlohar2006@gmail.com' || Boolean(m.is_owner),
          permissions: {
            ...DEFAULT_WORKSPACE_PERMISSIONS,
            ...m.permissions,
          },
        }));
      }
      return DEFAULT_WORKSPACE_MEMBERS;
    } catch {
      return DEFAULT_WORKSPACE_MEMBERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(workspaceMembers));
    } catch (e) {
      console.error('Failed to save members to localStorage:', e);
    }
  }, [workspaceMembers]);

  // Load workspace collaborators from backend API whenever active workspace or tab changes
  useEffect(() => {
    if (!activeWorkspace?.slug) return;
    let isMounted = true;

    getWorkspaceCollaborators(activeWorkspace.slug)
      .then((backendMembers) => {
        if (isMounted && backendMembers && backendMembers.length > 0) {
          setWorkspaceMembers(backendMembers);
        }
      })
      .catch((err) => {
        // Fallback silently to existing local storage state if offline or guest session
        console.warn('Backend collaborators fetch skipped/failed, using local state:', err?.message || err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeWorkspace?.slug, activeMainTab]);

  // Modal target for managing members of a private project or private diagram
  const [resourceModalTarget, setResourceModalTarget] = useState<{
    type: 'project' | 'diagram';
    item: ProjectItem | DiagramItem;
  } | null>(null);

  // Workspace Invitation State & Handler
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [isSendingInvite, setIsSendingInvite] = useState<boolean>(false);

  const handleOpenInviteModal = () => {
    if (!user) {
      onOpenAuthModal();
      return;
    }
    setIsInviteModalOpen(true);
  };

  const handleSendInviteSubmit = async (email: string, permissions: WorkspacePermissions) => {
    setIsSendingInvite(true);
    const trimmedEmail = email.trim();

    if (activeWorkspace?.slug && user) {
      try {
        const inviteRes = await sendWorkspaceInvitation(activeWorkspace.slug, trimmedEmail, permissions);
        alert(`Invitation link created for ${trimmedEmail}!\n\nLink: ${inviteRes.invitation_link}`);
        setIsInviteModalOpen(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send invitation';
        console.error('Failed to send invitation on backend:', err);
        alert(msg);
      } finally {
        setIsSendingInvite(false);
      }
    } else {
      const newMember: WorkspaceMemberItem = {
        id: Date.now(),
        name: trimmedEmail.split('@')[0],
        email: trimmedEmail,
        joined_at: new Date().toISOString().split('T')[0],
        permissions,
      };
      setWorkspaceMembers((prev) => [...prev, newMember]);
      setIsSendingInvite(false);
      setIsInviteModalOpen(false);
      alert(`Invitation sent to ${trimmedEmail}! Member has been granted selected capabilities.`);
    }
  };

  const handleUpdateMemberPermissions = async (userId: number, permissions: WorkspacePermissions) => {
    // 1. Optimistic UI update (feels instantaneous to the user)
    const previousMembers = workspaceMembers;
    setWorkspaceMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, permissions } : m))
    );

    // 2. Persist to Backend API if active workspace slug exists
    if (activeWorkspace?.slug) {
      try {
        await updateCollaboratorPermissions(activeWorkspace.slug, userId, permissions);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Server error';
        console.error('Failed to update permissions on backend:', err);
        alert(`Failed to update permissions: ${errorMsg}`);
        // Rollback optimistic update
        setWorkspaceMembers(previousMembers);
      }
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this collaborator from the workspace?')) {
      return;
    }

    // 1. Optimistic UI update
    const previousMembers = workspaceMembers;
    setWorkspaceMembers((prev) => prev.filter((m) => m.id !== userId));

    // 2. Persist to Backend API if active workspace slug exists
    if (activeWorkspace?.slug) {
      try {
        await removeCollaborator(activeWorkspace.slug, userId);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Server error';
        console.error('Failed to remove collaborator on backend:', err);
        alert(`Failed to remove collaborator: ${errorMsg}`);
        // Rollback optimistic removal
        setWorkspaceMembers(previousMembers);
      }
    }
  };

  const handleTogglePublicDiagram = async (diagramId: number) => {
    const target = diagrams.find((d) => d.id === diagramId);
    if (!target) return;
    const nextPublic = !target.is_public;

    // 1. Optimistic update
    const previousDiagrams = diagrams;
    setDiagrams((prev) =>
      prev.map((d) => (d.id === diagramId ? { ...d, is_public: nextPublic } : d))
    );

    // 2. Persist to Backend API if diagram has a slug
    if (target.slug) {
      try {
        await toggleDiagramPrivacyApi(target.slug, nextPublic);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Server error';
        console.error('Failed to update diagram privacy on backend:', err);
        alert(`Failed to update diagram privacy: ${errorMsg}`);
        setDiagrams(previousDiagrams); // Rollback
      }
    }
  };

  const handleTogglePublicProject = async (projectId: number) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    const nextPublic = !target.is_public;

    // 1. Optimistic update
    const previousProjects = projects;
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, is_public: nextPublic } : p))
    );

    // 2. Persist to Backend API if active workspace exists
    if (activeWorkspace?.slug) {
      try {
        await toggleProjectPrivacyApi(activeWorkspace.slug, projectId, nextPublic);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Server error';
        console.error('Failed to update project privacy on backend:', err);
        alert(`Failed to update project privacy: ${errorMsg}`);
        setProjects(previousProjects); // Rollback
      }
    }
  };

  const handleManageProjectMembers = (project: ProjectItem) => {
    setResourceModalTarget({ type: 'project', item: project });
  };

  const handleManageDiagramMembers = (diagram: DiagramItem) => {
    setResourceModalTarget({ type: 'diagram', item: diagram });
  };

  const handleSaveResourceMembers = async (selectedUserIds: number[]) => {
    if (!resourceModalTarget) return;

    if (resourceModalTarget.type === 'project') {
      const projId = resourceModalTarget.item.id;
      const prevProjects = projects;

      // 1. Optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === projId ? { ...p, member_user_ids: selectedUserIds } : p))
      );
      setResourceModalTarget(null);

      // 2. Persist to Backend API
      if (activeWorkspace?.slug) {
        try {
          await updateProjectMembers(activeWorkspace.slug, projId, selectedUserIds);
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Server error';
          console.error('Failed to update project collaborators on backend:', err);
          alert(`Failed to update project collaborators: ${errorMsg}`);
          setProjects(prevProjects); // Rollback
        }
      }
    } else {
      const diag = resourceModalTarget.item as DiagramItem;
      const diagSlug = diag.slug;
      const diagId = diag.id;
      const prevDiagrams = diagrams;

      // 1. Optimistic update
      setDiagrams((prev) =>
        prev.map((d) => (d.id === diagId ? { ...d, member_user_ids: selectedUserIds } : d))
      );
      setResourceModalTarget(null);

      // 2. Persist to Backend API
      if (diagSlug) {
        try {
          await updateDiagramMembers(diagSlug, selectedUserIds);
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Server error';
          console.error('Failed to update diagram collaborators on backend:', err);
          alert(`Failed to update diagram collaborators: ${errorMsg}`);
          setDiagrams(prevDiagrams); // Rollback
        }
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Active Diagram Tracking & Type Detection (Schema vs Flowchart)
  // ---------------------------------------------------------------------------
  const [activeDiagramSlug, setActiveDiagramSlug] = useState<string>(() => {
    const lastSlug = localStorage.getItem(STORAGE_KEYS.LAST_DIAGRAM);
    const found = diagrams.find((d) => d.slug === lastSlug);
    return found ? found.slug : (diagrams[0]?.slug || 'd_ecommerce_demo');
  });

  useEffect(() => {
    if (activeDiagramSlug) {
      localStorage.setItem(STORAGE_KEYS.LAST_DIAGRAM, activeDiagramSlug);
    }
  }, [activeDiagramSlug]);

  // Load workspace diagrams from backend API whenever active workspace changes
  useEffect(() => {
    if (!activeWorkspace?.slug || !user) return;
    let isMounted = true;

    listWorkspaceDiagrams(activeWorkspace.slug)
      .then((backendDiagrams) => {
        if (isMounted && backendDiagrams && backendDiagrams.length > 0) {
          setDiagrams(backendDiagrams);
          // Preserve currently selected diagram if it exists in this workspace, else pick first
          setActiveDiagramSlug((curr) => {
            const exists = backendDiagrams.find((d) => d.slug === curr);
            return exists ? curr : backendDiagrams[0].slug;
          });
        }
      })
      .catch((err) => {
        console.warn('Backend diagrams fetch skipped/failed, using local state:', err?.message || err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeWorkspace?.slug, user]);

  const activeDiagram = useMemo(() => {
    return diagrams.find((d) => d.slug === activeDiagramSlug) || diagrams[0] || null;
  }, [diagrams, activeDiagramSlug]);

  const isFlowchart = activeDiagram?.type === 'flowchart';

  // ---------------------------------------------------------------------------
  // 4. Persistent Sidebar Collapse State
  // ---------------------------------------------------------------------------
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, JSON.stringify(next));
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // 5. Canvas State with Diagram Swapping (Nodes & Edges per Diagram)
  // ---------------------------------------------------------------------------
  const sanitizeLoadedNodes = (loadedNodes: Node[]): Node[] => {
    return loadedNodes.map((node) => {
      // If node is a sticky note or corrupted legacy node with raw JSX in data.label:
      if (
        node.type === 'default' ||
        node.type === 'noteNode' ||
        (node.data && typeof (node.data as Record<string, unknown>).label === 'object' && (node.data as Record<string, unknown>).label !== null)
      ) {
        const rawData = (node.data || {}) as Record<string, unknown>;
        return {
          ...node,
          type: 'noteNode',
          data: {
            title: typeof rawData.title === 'string' ? rawData.title : 'Architecture Note',
            text:
              typeof rawData.text === 'string'
                ? rawData.text
                : typeof rawData.label === 'string'
                ? rawData.label
                : 'Documenting table constraints, index strategies, and foreign key triggers.',
          },
          style: undefined,
        };
      }
      return node;
    });
  };

  const getInitialNodesForSlug = (slug: string, diagType: 'schema' | 'flowchart'): Node[] => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEYS.CANVAS_PREFIX}${slug}_nodes`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? sanitizeLoadedNodes(parsed) : [];
      }
    } catch {
      // fallback
    }
    return diagType === 'flowchart' ? initialFlowchartNodes : initialSchemaNodes;
  };

  const getInitialEdgesForSlug = (slug: string, diagType: 'schema' | 'flowchart'): Edge[] => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEYS.CANVAS_PREFIX}${slug}_edges`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return diagType === 'flowchart' ? initialFlowchartEdges : initialSchemaEdges;
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(
    getInitialNodesForSlug(activeDiagramSlug, isFlowchart ? 'flowchart' : 'schema')
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    getInitialEdgesForSlug(activeDiagramSlug, isFlowchart ? 'flowchart' : 'schema')
  );

  // Save State with Unsaved Changes Indicator
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  // Switch canvas nodes/edges whenever active diagram changes
  const prevSlugRef = useRef<string>(activeDiagramSlug);
  useEffect(() => {
    if (prevSlugRef.current !== activeDiagramSlug && activeDiagram) {
      const nextNodes = getInitialNodesForSlug(activeDiagram.slug, activeDiagram.type);
      const nextEdges = getInitialEdgesForSlug(activeDiagram.slug, activeDiagram.type);
      setNodes(nextNodes);
      setEdges(nextEdges);
      prevSlugRef.current = activeDiagramSlug;
      setHasUnsavedChanges(false);
    }
  }, [activeDiagramSlug, activeDiagram, setNodes, setEdges]);

  // Explicit Save Diagram Handler (LocalStorage + Timestamp)
  const handleSaveDiagram = useCallback(() => {
    if (!activeDiagramSlug) return;
    try {
      localStorage.setItem(`${STORAGE_KEYS.CANVAS_PREFIX}${activeDiagramSlug}_nodes`, JSON.stringify(nodes));
      localStorage.setItem(`${STORAGE_KEYS.CANVAS_PREFIX}${activeDiagramSlug}_edges`, JSON.stringify(edges));

      // Update diagram timestamp in state
      setDiagrams((prev) =>
        prev.map((d) => (d.slug === activeDiagramSlug ? { ...d, updated_at: 'Just now' } : d))
      );

      setHasUnsavedChanges(false);
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2000);
    } catch (e) {
      console.error('Failed to save diagram:', e);
    }
  }, [activeDiagramSlug, nodes, edges, setDiagrams]);

  // Keyboard Shortcut: Ctrl + S / Cmd + S to Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveDiagram();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveDiagram]);

  // Meaningful change wrappers to detect unsaved changes
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      const isMeaningful = changes.some(
        (c) =>
          (c.type === 'position' && (c as { dragging?: boolean }).dragging === false) ||
          c.type === 'remove' ||
          c.type === 'add' ||
          c.type === 'replace'
      );
      if (isMeaningful) {
        setHasUnsavedChanges(true);
      }
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      if (changes.some((c) => c.type === 'remove' || c.type === 'add')) {
        setHasUnsavedChanges(true);
      }
    },
    [onEdgesChange]
  );

  // ---------------------------------------------------------------------------
  // 6. Diagram Creation & Default Numbering Logic: unnamed_diagram_1, 2, ...
  // ---------------------------------------------------------------------------
  const handleCreateDiagram = async (type: 'schema' | 'flowchart', projectId?: number) => {
    let maxIndex = 0;
    const unnamedRegex = /^unnamed_diagram(?:_(\d+))?$/i;

    diagrams.forEach((diag) => {
      const match = diag.name.match(unnamedRegex);
      if (match) {
        const num = match[1] ? parseInt(match[1], 10) : 0;
        if (num > maxIndex) maxIndex = num;
      }
    });

    const nextIndex = maxIndex + 1;
    const newName = `unnamed_diagram_${nextIndex}`;

    if (activeWorkspace?.slug && user) {
      try {
        const createdDiag = await createWorkspaceDiagram(
          activeWorkspace.slug,
          newName,
          type,
          projectId
        );
        setDiagrams((prev) => [createdDiag, ...prev]);

        // Blank initial local cache
        localStorage.setItem(`${STORAGE_KEYS.CANVAS_PREFIX}${createdDiag.slug}_nodes`, JSON.stringify([]));
        localStorage.setItem(`${STORAGE_KEYS.CANVAS_PREFIX}${createdDiag.slug}_edges`, JSON.stringify([]));

        setActiveDiagramSlug(createdDiag.slug);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create diagram';
        console.error('Failed to create diagram on backend:', err);
        alert(msg);
      }
    } else {
      const newSlug = `d_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newDiagram: DiagramItem = {
        id: Date.now(),
        name: newName,
        slug: newSlug,
        type,
        is_pinned: false,
        is_public: false,
        member_user_ids: user ? [user.id] : [1],
        project_id: projectId ?? null,
        updated_at: 'Just now',
      };

      setDiagrams((prev) => [newDiagram, ...prev]);

      // Set initial nodes for blank diagram
      if (type === 'schema') {
        localStorage.setItem(`${STORAGE_KEYS.CANVAS_PREFIX}${newSlug}_nodes`, JSON.stringify([]));
        localStorage.setItem(`${STORAGE_KEYS.CANVAS_PREFIX}${newSlug}_edges`, JSON.stringify([]));
      } else {
        const starterNode: Node[] = [
          {
            id: 'flow_start',
            type: 'flowNode',
            position: { x: 300, y: 120 },
            data: { label: 'Start Flow', node_type: 'terminal', status: 'start' },
          },
        ];
        localStorage.setItem(`${STORAGE_KEYS.CANVAS_PREFIX}${newSlug}_nodes`, JSON.stringify(starterNode));
        localStorage.setItem(`${STORAGE_KEYS.CANVAS_PREFIX}${newSlug}_edges`, JSON.stringify([]));
      }

      setActiveDiagramSlug(newSlug);
    }
  };

  // ---------------------------------------------------------------------------
  // 7. Diagram & Project Actions (Rename, Delete, Move, Pin)
  // ---------------------------------------------------------------------------
  const handleRenameDiagram = async (diagramId: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const target = diagrams.find((d) => d.id === diagramId);
    if (!target) return;

    // 1. Optimistic update
    const prevDiagrams = diagrams;
    setDiagrams((prev) =>
      prev.map((d) => (d.id === diagramId ? { ...d, name: trimmed, updated_at: 'Just now' } : d))
    );

    // 2. Persist to Backend API
    if (target.slug && user) {
      try {
        await renameDiagramApi(target.slug, trimmed);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to rename diagram';
        console.error('Failed to rename diagram on backend:', err);
        alert(msg);
        setDiagrams(prevDiagrams); // Rollback
      }
    }
  };

  const handleDuplicateDiagram = (diagramId: number) => {
    const source = diagrams.find((d) => d.id === diagramId);
    if (!source) return;

    // Suffix calculation logic: "Diagram" -> "Diagram 2", "Diagram 3", etc.
    const suffixMatch = source.name.trim().match(/^(.*?)(?:\s+(\d+))?$/);
    const baseName = suffixMatch && suffixMatch[1] ? suffixMatch[1].trim() : source.name.trim();

    // Check all existing diagrams sharing this base name
    const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escapedBase}(?:\\s+(\\d+))?$`, 'i');
    let maxSuffix = 1;

    diagrams.forEach((d) => {
      const match = d.name.trim().match(pattern);
      if (match) {
        if (match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxSuffix) maxSuffix = num;
        }
      }
    });

    const newName = `${baseName} ${maxSuffix + 1}`;
    const newSlug = `d_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Clone canvas content: live if active, else from localStorage
    let clonedNodes: Node[] = [];
    let clonedEdges: Edge[] = [];

    if (source.slug === activeDiagramSlug) {
      clonedNodes = JSON.parse(JSON.stringify(nodes));
      clonedEdges = JSON.parse(JSON.stringify(edges));
    } else {
      try {
        const storedNodes = localStorage.getItem(`${STORAGE_KEYS.CANVAS_PREFIX}${source.slug}_nodes`);
        if (storedNodes) clonedNodes = JSON.parse(storedNodes);
        const storedEdges = localStorage.getItem(`${STORAGE_KEYS.CANVAS_PREFIX}${source.slug}_edges`);
        if (storedEdges) clonedEdges = JSON.parse(storedEdges);
      } catch (err) {
        console.error('Failed to clone source canvas state:', err);
      }
    }

    // Save cloned canvas state in localStorage
    localStorage.setItem(`${STORAGE_KEYS.CANVAS_PREFIX}${newSlug}_nodes`, JSON.stringify(clonedNodes));
    localStorage.setItem(`${STORAGE_KEYS.CANVAS_PREFIX}${newSlug}_edges`, JSON.stringify(clonedEdges));

    const newDiagram: DiagramItem = {
      id: Date.now(),
      name: newName,
      slug: newSlug,
      type: source.type,
      is_pinned: false,
      is_public: false, // Default private
      member_user_ids: source.member_user_ids ? [...source.member_user_ids] : [1],
      project_id: source.project_id ?? null,
      updated_at: 'Just now',
    };

    setDiagrams((prev) => [newDiagram, ...prev]);
    setActiveDiagramSlug(newSlug);
    setActiveMainTab('canvas');
  };

  const handleDeleteDiagram = async (diagramId: number) => {
    const target = diagrams.find((d) => d.id === diagramId);
    if (!target) return;

    if (!confirm(`Are you sure you want to delete "${target.name}"?`)) {
      return;
    }

    // 1. Optimistic update
    const prevDiagrams = diagrams;
    const remaining = diagrams.filter((d) => d.id !== diagramId);
    setDiagrams(remaining);
    if (activeDiagram?.id === diagramId && remaining.length > 0) {
      setActiveDiagramSlug(remaining[0].slug);
    }

    // 2. Persist to Backend API
    if (target.slug && user) {
      try {
        await deleteDiagramApi(target.slug);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete diagram';
        console.error('Failed to delete diagram on backend:', err);
        alert(msg);
        setDiagrams(prevDiagrams); // Rollback
      }
    }
  };

  const handleMoveDiagram = (diagramId: number, targetProjectId: number | null) => {
    setDiagrams((prev) =>
      prev.map((d) => (d.id === diagramId ? { ...d, project_id: targetProjectId } : d))
    );
  };

  const handleTogglePinDiagram = async (diagramId: number) => {
    const target = diagrams.find((d) => d.id === diagramId);
    if (!target) return;
    const nextPinned = !target.is_pinned;

    // 1. Optimistic update
    const prevDiagrams = diagrams;
    setDiagrams((prev) =>
      prev.map((d) => (d.id === diagramId ? { ...d, is_pinned: nextPinned } : d))
    );

    // 2. Persist to Backend API
    if (target.slug && user) {
      try {
        await togglePinDiagramApi(target.slug, nextPinned);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to toggle diagram pin';
        console.error('Failed to toggle diagram pin on backend:', err);
        alert(msg);
        setDiagrams(prevDiagrams); // Rollback
      }
    }
  };

  const handleCreateProject = async (projectName: string) => {
    const trimmed = projectName.trim();
    if (!trimmed) return;

    if (activeWorkspace?.slug && user) {
      try {
        const createdProj = await createProject(activeWorkspace.slug, trimmed);
        setProjects((prev) => [...prev, createdProj]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create project';
        console.error('Failed to create project on backend:', err);
        alert(msg);
      }
    } else {
      const newProj: ProjectItem = {
        id: Date.now(),
        name: trimmed,
        is_pinned: false,
        is_public: false,
        member_user_ids: user ? [user.id] : [1],
        diagrams_count: 0,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };
      setProjects((prev) => [...prev, newProj]);
    }
  };

  const handleRenameProject = async (projectId: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    // 1. Optimistic update
    const previousProjects = projects;
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: trimmed } : p))
    );

    // 2. Persist to Backend API
    if (activeWorkspace?.slug && user) {
      try {
        await renameProject(activeWorkspace.slug, projectId, trimmed);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to rename project';
        console.error('Failed to rename project on backend:', err);
        alert(msg);
        setProjects(previousProjects); // Rollback
      }
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project and all its diagrams?')) {
      return;
    }

    // 1. Optimistic update
    const previousProjects = projects;
    const previousDiagrams = diagrams;

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setDiagrams((prev) =>
      prev.map((d) => (d.project_id === projectId ? { ...d, project_id: null } : d))
    );

    // 2. Persist to Backend API
    if (activeWorkspace?.slug && user) {
      try {
        await deleteProjectApi(activeWorkspace.slug, projectId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete project';
        console.error('Failed to delete project on backend:', err);
        alert(msg);
        setProjects(previousProjects); // Rollback
        setDiagrams(previousDiagrams); // Rollback
      }
    }
  };

  const handleTogglePinProject = async (projectId: number) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    const nextPinned = !target.is_pinned;

    // 1. Optimistic update
    const previousProjects = projects;
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, is_pinned: nextPinned } : p))
    );

    // 2. Persist to Backend API
    if (activeWorkspace?.slug && user) {
      try {
        await togglePinProjectApi(activeWorkspace.slug, projectId, nextPinned);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to toggle pin';
        console.error('Failed to toggle pin on backend:', err);
        alert(msg);
        setProjects(previousProjects); // Rollback
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 8. Dynamic Node Adders (Schema Tables vs Flowchart Nodes)
  // ---------------------------------------------------------------------------
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { stroke: isFlowchart ? '#3b82f6' : '#16a34a', strokeWidth: 2 },
          },
          eds
        )
      );
      setHasUnsavedChanges(true);
    },
    [setEdges, isFlowchart]
  );

  // Schema: Add Table
  const handleAddTable = () => {
    const tableIndex = nodes.filter((n) => n.type === 'table').length + 1;
    const newTableName = `table_${tableIndex}`;
    const newNode: Node = {
      id: newTableName,
      type: 'table',
      position: { x: 320 + (tableIndex % 5) * 35, y: 180 + (tableIndex % 5) * 25 },
      data: {
        name: newTableName,
        style: { header_bg: 'linear-gradient(135deg, #14532d 0%, #166534 100%)' },
        columns: [
          { name: 'id', type: 'uuid', is_primary_key: true, is_nullable: false },
          { name: 'title', type: 'varchar(255)', is_nullable: false },
          { name: 'created_at', type: 'timestamptz', is_nullable: false },
        ],
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  };

  // ---------------------------------------------------------------------------
  // 8a. Table Visual Mutation Handlers (dbdiagram.io Standard)
  // ---------------------------------------------------------------------------
  const handleRenameTable = useCallback((tableId: string, newName: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === tableId
          ? {
              ...n,
              data: {
                ...n.data,
                name: newName,
              },
            }
          : n
      )
    );
    setHasUnsavedChanges(true);
  }, [setNodes]);

  const handleChangeTableColor = useCallback((tableId: string, bg: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === tableId
          ? {
              ...n,
              data: {
                ...n.data,
                style: {
                  ...((n.data as { style?: Record<string, unknown> }).style || {}),
                  header_bg: bg,
                },
              },
            }
          : n
      )
    );
    setHasUnsavedChanges(true);
  }, [setNodes]);

  const handleDeleteTable = useCallback((tableId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== tableId));
    setEdges((eds) => eds.filter((e) => e.source !== tableId && e.target !== tableId));
    setHasUnsavedChanges(true);
  }, [setNodes, setEdges]);

  const handleAddColumnToTable = useCallback((tableId: string, col: ColumnDefinition) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === tableId) {
          const currentCols = (((n.data as { columns?: ColumnDefinition[] }).columns) || []) as ColumnDefinition[];
          return {
            ...n,
            data: {
              ...n.data,
              columns: [...currentCols, col],
            },
          };
        }
        return n;
      })
    );
    setHasUnsavedChanges(true);
  }, [setNodes]);

  const handleDeleteColumnFromTable = useCallback((tableId: string, colName: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === tableId) {
          const currentCols = (((n.data as { columns?: ColumnDefinition[] }).columns) || []) as ColumnDefinition[];
          return {
            ...n,
            data: {
              ...n.data,
              columns: currentCols.filter((c) => c.name !== colName),
            },
          };
        }
        return n;
      })
    );
    setHasUnsavedChanges(true);
  }, [setNodes]);

  const handleTogglePkColumnInTable = useCallback((tableId: string, colName: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === tableId) {
          const currentCols = (((n.data as { columns?: ColumnDefinition[] }).columns) || []) as ColumnDefinition[];
          return {
            ...n,
            data: {
              ...n.data,
              columns: currentCols.map((c) =>
                c.name === colName
                  ? {
                      ...c,
                      is_primary_key: !c.is_primary_key,
                      is_nullable: !c.is_primary_key ? false : c.is_nullable,
                    }
                  : c
              ),
            },
          };
        }
        return n;
      })
    );
    setHasUnsavedChanges(true);
  }, [setNodes]);

  const handleUpdateColumnInTable = useCallback(
    (tableId: string, oldColName: string, updatedCol: ColumnDefinition) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === tableId) {
            const currentCols = (((n.data as { columns?: ColumnDefinition[] }).columns) || []) as ColumnDefinition[];
            return {
              ...n,
              data: {
                ...n.data,
                columns: currentCols.map((c) => (c.name === oldColName ? updatedCol : c)),
              },
            };
          }
          return n;
        })
      );
      setHasUnsavedChanges(true);
    },
    [setNodes]
  );

  // Sample Data Records Modal State (dbdiagram Image 2)
  const [sampleModalTable, setSampleModalTable] = useState<{
    name: string;
    columns: ColumnDefinition[];
  } | null>(null);

  const handleViewRecords = useCallback((tableName: string) => {
    const targetNode = nodes.find(
      (n) => n.type === 'table' && (n.data as { name?: string }).name === tableName
    );
    if (targetNode) {
      const cols = (((targetNode.data as { columns?: ColumnDefinition[] }).columns) || []) as ColumnDefinition[];
      setSampleModalTable({ name: tableName, columns: cols });
    }
  }, [nodes]);

  // Diagram Views Drawer State & Hidden Nodes
  const [isViewsDrawerOpen, setIsViewsDrawerOpen] = useState<boolean>(false);
  const [hiddenNodeIds, setHiddenNodeIds] = useState<Set<string>>(new Set());
  const reactFlowInstanceRef = useRef<{ setCenter: (x: number, y: number, options?: { duration?: number; zoom?: number }) => void } | null>(null);

  const handleToggleNodeVisibility = useCallback((nodeId: string) => {
    setHiddenNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleToggleAllVisibility = useCallback((visible: boolean) => {
    if (visible) {
      setHiddenNodeIds(new Set());
    } else {
      const allIds = new Set(nodes.map((n) => n.id));
      setHiddenNodeIds(allIds);
    }
  }, [nodes]);

  // 1-Click Select & Center Table from Outline Sidebar
  const handleSelectTableFromOutline = useCallback(
    (tableId: string) => {
      // Mark node as selected in React Flow state
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === tableId,
        }))
      );

      // Automatically unhide if it was hidden
      setHiddenNodeIds((prev) => {
        if (prev.has(tableId)) {
          const next = new Set(prev);
          next.delete(tableId);
          return next;
        }
        return prev;
      });

      // Smoothly center and zoom onto the chosen table
      const targetNode = nodes.find((n) => n.id === tableId);
      if (targetNode && reactFlowInstanceRef.current) {
        const x = targetNode.position.x + 140;
        const y = targetNode.position.y + 120;
        reactFlowInstanceRef.current.setCenter(x, y, { duration: 600, zoom: 1 });
      }
    },
    [nodes, setNodes]
  );

  // Canvas-Wide Column Filter Mode (All, Keys Only, PK Only, FK Only)
  const [columnFilterMode, setColumnFilterMode] = useState<ColumnFilterMode>('all');

  // Collapsed Tables State (per table collapse toggle)
  const [collapsedTableIds, setCollapsedTableIds] = useState<Set<string>>(new Set());

  const handleToggleTableCollapse = useCallback((tableId: string) => {
    setCollapsedTableIds((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) {
        next.delete(tableId);
      } else {
        next.add(tableId);
      }
      return next;
    });
  }, []);

  const handleToggleAllCollapse = useCallback(() => {
    const tableNodes = nodes.filter((n) => n.type === 'table');
    if (collapsedTableIds.size === tableNodes.length && tableNodes.length > 0) {
      setCollapsedTableIds(new Set());
    } else {
      setCollapsedTableIds(new Set(tableNodes.map((n) => n.id)));
    }
  }, [nodes, collapsedTableIds]);

  // Rendered Nodes & Edges with Dynamic Callbacks and Visibility Filtering
  const renderedNodes = useMemo(() => {
    return nodes.map((node) => {
      const isHidden = hiddenNodeIds.has(node.id);
      if (node.type === 'table') {
        const isCollapsed = collapsedTableIds.has(node.id);

        return {
          ...node,
          hidden: isHidden,
          data: {
            ...node.data,
            isCollapsed,
            columnFilter: columnFilterMode,
            onToggleCollapse: () => handleToggleTableCollapse(node.id),
            onRenameTable: (newName: string) => handleRenameTable(node.id, newName),
            onChangeColor: (bg: string) => handleChangeTableColor(node.id, bg),
            onDeleteTable: () => handleDeleteTable(node.id),
            onAddColumn: (col: ColumnDefinition) => handleAddColumnToTable(node.id, col),
            onUpdateColumn: (oldName: string, updatedCol: ColumnDefinition) =>
              handleUpdateColumnInTable(node.id, oldName, updatedCol),
            onDeleteColumn: (colName: string) => handleDeleteColumnFromTable(node.id, colName),
            onTogglePkColumn: (colName: string) => handleTogglePkColumnInTable(node.id, colName),
            onViewRecords: (tableName: string) => handleViewRecords(tableName),
          },
        };
      }
      if (node.type === 'noteNode' || node.type === 'default') {
        return {
          ...node,
          type: 'noteNode',
          hidden: isHidden,
          data: {
            ...node.data,
            onDelete: () => setNodes((nds) => nds.filter((n) => n.id !== node.id)),
            onUpdateText: (newText: string) =>
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === node.id ? { ...n, data: { ...n.data, text: newText } } : n
                )
              ),
          },
        };
      }
      return {
        ...node,
        hidden: isHidden,
      };
    });
  }, [
    nodes,
    hiddenNodeIds,
    handleRenameTable,
    handleChangeTableColor,
    handleDeleteTable,
    handleAddColumnToTable,
    handleUpdateColumnInTable,
    handleDeleteColumnFromTable,
    handleTogglePkColumnInTable,
    handleViewRecords,
    columnFilterMode,
    collapsedTableIds,
    handleToggleTableCollapse,
    setNodes,
  ]);

  const renderedEdges = useMemo(() => {
    return edges.map((edge) => {
      const isHidden = hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target);
      return {
        ...edge,
        hidden: isHidden,
      };
    });
  }, [edges, hiddenNodeIds]);

  // Flowchart: Add Process Action Node
  const handleAddProcessNode = () => {
    const count = nodes.filter((n) => n.id.startsWith('process_')).length + 1;
    const newNode: Node = {
      id: `process_${count}`,
      type: 'flowNode',
      position: { x: 360 + (count % 4) * 30, y: 220 + (count % 4) * 30 },
      data: {
        label: `Action Step #${count}`,
        node_type: 'process',
        description: 'Execute business logic or call external API',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  };

  // Flowchart: Add Decision Node
  const handleAddDecisionNode = () => {
    const count = nodes.filter((n) => n.id.startsWith('decision_')).length + 1;
    const newNode: Node = {
      id: `decision_${count}`,
      type: 'flowNode',
      position: { x: 340 + (count % 4) * 25, y: 240 + (count % 4) * 25 },
      data: {
        label: `Evaluate Condition #${count}?`,
        node_type: 'decision',
        description: 'Branch on boolean truth condition',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  };

  // Flowchart: Add Terminal (Start/End)
  const handleAddTerminalNode = (isEnd?: boolean) => {
    const count = nodes.filter((n) => n.id.startsWith('term_')).length + 1;
    const newNode: Node = {
      id: `term_${count}`,
      type: 'flowNode',
      position: { x: 380, y: isEnd ? 480 : 60 },
      data: {
        label: isEnd ? 'End Workflow' : 'Start Workflow',
        node_type: 'terminal',
        status: isEnd ? 'end' : 'start',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  };

  // Sticky Note
  const handleAddStickyNote = () => {
    const noteIndex = nodes.filter((n) => n.type === 'noteNode' || n.id.startsWith('note_')).length + 1;
    const newNoteId = `note_${noteIndex}`;
    const newNode: Node = {
      id: newNoteId,
      type: 'noteNode',
      position: { x: 140, y: 320 },
      data: {
        title: `Architecture Note #${noteIndex}`,
        text: 'Documenting table constraints, index strategies, and foreign key triggers.',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  };

  // Complex Operations
  const handleComplexAction = (actionName: string) => {
    if (!user) {
      onOpenAuthModal();
    } else {
      alert(`Triggering ${actionName} layout algorithm.`);
    }
  };

  // Share Diagram Action
  const handleShareDiagram = () => {
    if (!user) {
      onOpenAuthModal();
      return;
    }
    const shareUrl = `${window.location.origin}/d/${activeDiagram?.slug || ''}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Public share link copied to clipboard:\n${shareUrl}`);
  };

  // Export Diagram Action
  const handleExportDiagram = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ diagram: activeDiagram, nodes, edges }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeDiagram?.name || 'diagram'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // ---------------------------------------------------------------------------
  // 9. Side Drawer Preview Engine: SQL (for Schemas) & Mermaid (for Flowcharts)
  // ---------------------------------------------------------------------------
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // PostgreSQL DDL generator
  const generatedSql = useMemo(() => {
    return nodes
      .filter((n) => n.type === 'table')
      .map((n) => {
        const tableData = n.data as {
          name: string;
          columns: Array<{
            name: string;
            type: string;
            is_primary_key?: boolean;
            is_nullable?: boolean;
          }>;
        };
        const cols = (tableData.columns || []).map(
          (c) =>
            `  "${c.name}" ${c.type.toUpperCase()}${
              c.is_primary_key ? ' PRIMARY KEY' : c.is_nullable === false ? ' NOT NULL' : ''
            }`
        );
        return `CREATE TABLE "${tableData.name}" (\n${cols.join(',\n')}\n);`;
      })
      .join('\n\n');
  }, [nodes]);

  // Mermaid.js code generator for Flowcharts
  const generatedMermaid = useMemo(() => {
    const nodeLines = nodes
      .filter((n) => n.type === 'flowNode')
      .map((n) => {
        const d = n.data as { label?: string; node_type?: string };
        const label = d.label || n.id;
        if (d.node_type === 'terminal') return `  ${n.id}(["${label}"])`;
        if (d.node_type === 'decision') return `  ${n.id}{"${label}"}`;
        return `  ${n.id}["${label}"]`;
      });

    const edgeLines = edges.map((e) => {
      let label = '';
      if (e.sourceHandle === 'decision-true') label = '|Yes|';
      if (e.sourceHandle === 'decision-false') label = '|No|';
      return `  ${e.source} -->${label} ${e.target}`;
    });

    return `flowchart TD\n${nodeLines.join('\n')}\n\n${edgeLines.join('\n')}`;
  }, [nodes, edges]);

  const activeCodeContent = isFlowchart ? generatedMermaid : generatedSql;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCodeContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadCode = () => {
    const ext = isFlowchart ? 'mmd' : 'sql';
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(activeCodeContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeDiagram?.name || 'export'}.${ext}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-screen h-screen flex flex-row bg-[#fafafa] overflow-hidden select-none">
      {/* ----------------------------------------------------------------- */}
      {/* 1. PERSISTENT LEFT SIDEBAR DOCK (with Logo, Projects, Recents)    */}
      {/* ----------------------------------------------------------------- */}
      <CanvasSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        projects={projects}
        diagrams={diagrams}
        activeDiagramSlug={activeDiagramSlug}
        activeMainTab={activeMainTab}
        onSelectMainTab={setActiveMainTab}
        onSelectDiagram={setActiveDiagramSlug}
        onCreateDiagram={handleCreateDiagram}
        onCreateProject={handleCreateProject}
        onRenameDiagram={handleRenameDiagram}
        onDuplicateDiagram={handleDuplicateDiagram}
        onDeleteDiagram={handleDeleteDiagram}
        onMoveDiagram={handleMoveDiagram}
        onTogglePinDiagram={handleTogglePinDiagram}
        onTogglePublicDiagram={handleTogglePublicDiagram}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onTogglePinProject={handleTogglePinProject}
        onTogglePublicProject={handleTogglePublicProject}
        onManageProjectMembers={handleManageProjectMembers}
        onManageDiagramMembers={handleManageDiagramMembers}
        user={user || { id: 0, email: '', name: 'Guest', avatar_url: null, role: 'user', is_active: true, created_at: '' }}
        onSignOut={onSignOut || (() => {})}
        onUpgradeClick={() => alert('Razorpay checkout will launch for Karta Pro Plan')}
      />

      {/* ----------------------------------------------------------------- */}
      {/* 2. MAIN WORKSPACE VIEWPORT                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOP BAR 1: Diagram Icon + Name on left, Invite & Workspace Switcher on right */}
        <header className="h-12 border-b border-border bg-white px-3 flex items-center justify-between z-20 flex-shrink-0">
          {/* Left: Diagram Type Icon + Name OR Members */}
          <div className="flex items-center gap-2">
            {activeMainTab === 'members' ? (
              <>
                <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-ink">
                  Collaborators
                </span>
              </>
            ) : (
              <>
                {isFlowchart ? (
                  <GitBranch className="w-4 h-4 text-blue-600 flex-shrink-0" />
                ) : (
                  <Database className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-bold text-ink truncate max-w-[200px] sm:max-w-[360px]">
                  {activeDiagram?.name || 'Unnamed Diagram'}
                </span>
              </>
            )}
          </div>

          {/* Right: Workspace Switcher with '+' Add Workspace */}
          <div className="flex items-center gap-2" ref={workspaceDropdownRef}>
            <div className="relative">
              <div className="flex items-center bg-gray-50 border border-border rounded-lg overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-gray-100 transition-colors"
                  title="Switch workspace"
                >
                  <span className="w-2 h-2 rounded-full bg-karta-500" />
                  <span className="truncate max-w-[130px] sm:max-w-[190px]">
                    {activeWorkspace?.name || defaultWorkspaceName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted ml-0.5" />
                </button>

                <div className="h-4 w-px bg-border" />

                <button
                  type="button"
                  onClick={() => setIsCreatingWorkspace(true)}
                  className="p-1.5 text-muted hover:text-karta-700 hover:bg-gray-100 transition-colors"
                  title="Add new workspace"
                  aria-label="Add new workspace"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {isWorkspaceMenuOpen && (
                <div className="absolute right-0 top-10 w-56 bg-white border border-border rounded-xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in-50 duration-100">
                  <div className="px-2 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                    Workspaces
                  </div>
                  {workspaces.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setActiveWorkspace(w);
                        setIsWorkspaceMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        activeWorkspace.id === w.id
                          ? 'bg-surface text-karta-800 font-semibold'
                          : 'text-body hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{w.name}</span>
                      <span className="text-[10px] text-muted capitalize">{w.user_role}</span>
                    </button>
                  ))}

                  <div className="h-px bg-border my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      setIsCreatingWorkspace(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-surface text-karta-800 font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-karta-600" />
                    <span>Create Workspace</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeMainTab === 'members' ? (
          <div className="flex-1 overflow-y-auto bg-gray-50/40">
            <WorkspaceMembersView
              workspaceName={activeWorkspace.name}
              members={workspaceMembers}
              onBackToCanvas={() => setActiveMainTab('canvas')}
              onOpenInviteModal={handleOpenInviteModal}
              onUpdateMemberPermissions={handleUpdateMemberPermissions}
              onRemoveMember={handleRemoveMember}
            />
          </div>
        ) : (
          <>
            {/* TOP BAR 2: Operational Ribbon (Dynamic Schema vs Flowchart Tools) */}
        <div className="h-11 border-b border-border bg-white px-3 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {/* DYNAMIC TOOLS: FLOWCHART VS SCHEMA */}
            {isFlowchart ? (
              <>
                {/* + Action / Process Step */}
                <button
                  type="button"
                  onClick={handleAddProcessNode}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-2xs"
                  title="Add process / action step"
                >
                  <Cog className="w-3.5 h-3.5 text-blue-600" />
                  <span>Action</span>
                </button>

                {/* + Decision Condition */}
                <button
                  type="button"
                  onClick={handleAddDecisionNode}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-2xs"
                  title="Add branching decision"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Decision</span>
                </button>

                {/* + Terminal (Start/End) */}
                <button
                  type="button"
                  onClick={() => handleAddTerminalNode(false)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-2xs"
                  title="Add start or end terminal"
                >
                  <Play className="w-3 h-3 text-emerald-600" />
                  <span>Terminal</span>
                </button>
              </>
            ) : (
              /* Schema: + Table */
              <button
                type="button"
                onClick={handleAddTable}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Table</span>
              </button>
            )}

            {/* Note Memo */}
            <button
              type="button"
              onClick={handleAddStickyNote}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-2xs"
            >
              <StickyNote className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Note</span>
            </button>

            {/* Schema Field Filter Dropdown (All Fields, Keys Only, PK Only, FK Only) */}
            {!isFlowchart && (
              <>
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1 shadow-2xs">
                  <Filter className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <select
                    value={columnFilterMode}
                    onChange={(e) => setColumnFilterMode(e.target.value as ColumnFilterMode)}
                    className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer pr-1 font-sans"
                    title="Filter table columns across diagram"
                  >
                    <option value="all">All Fields</option>
                    <option value="keys_only">Keys Only (PK &amp; FK)</option>
                    <option value="pk_only">Primary Keys (PK)</option>
                    <option value="fk_only">Foreign Keys (FK)</option>
                  </select>
                </div>

                {/* Batch Collapse / Expand All Tables Toggle */}
                <button
                  type="button"
                  onClick={handleToggleAllCollapse}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-2xs font-sans"
                  title="Toggle collapse all tables"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                      collapsedTableIds.size > 0 ? '-rotate-90' : ''
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {collapsedTableIds.size > 0 ? 'Expand All' : 'Collapse All'}
                  </span>
                </button>
              </>
            )}

            <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />

            {/* Auto Arrange (ELK Algorithm) */}
            <button
              type="button"
              onClick={() => handleComplexAction('Auto Layout')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-2xs"
              title={!user ? 'Sign in to use Auto-Arrangement' : 'Auto arrange diagram layout'}
            >
              <Workflow className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden md:inline">Auto Layout</span>
              {!user && <Lock className="w-3 h-3 text-muted ml-0.5" />}
            </button>

            {/* AI Copilot */}
            <button
              type="button"
              onClick={() => handleComplexAction('AI Copilot')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 rounded-lg transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">AI Copilot</span>
              {!user && <Lock className="w-3 h-3 text-emerald-500 ml-0.5" />}
            </button>
          </div>

          {/* Right Ribbon: Save, Share, Export & Code Drawer Toggle (SQL vs Mermaid) */}
          <div className="flex items-center gap-1.5">
            {/* Save Button with Unsaved Green Dot Indicator */}
            <button
              type="button"
              onClick={handleSaveDiagram}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all shadow-2xs relative ${
                isSavedFeedback
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : hasUnsavedChanges
                  ? 'bg-white text-gray-900 border-emerald-400 hover:bg-emerald-50/40 shadow-xs ring-1 ring-emerald-400/30'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title={
                hasUnsavedChanges
                  ? 'Save diagram (Ctrl+S) • Unsaved changes'
                  : 'All changes saved (Ctrl+S)'
              }
            >
              {isSavedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-gray-600" />
                  <span>Save</span>
                  {/* Glowing Green Dot Indicator when changes are unsaved */}
                  {hasUnsavedChanges && (
                    <span className="relative flex h-2 w-2 ml-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareDiagram}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-2xs"
              title="Share diagram"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              type="button"
              onClick={handleExportDiagram}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-2xs"
              title="Export diagram as JSON"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <div className="h-4 w-px bg-gray-200 mx-0.5" />

            {/* Dynamic Code Toggle: SQL for Schema vs Mermaid for Flowcharts */}
            <button
              type="button"
              onClick={() => setIsCodeDrawerOpen(!isCodeDrawerOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition-all shadow-2xs ${
                isCodeDrawerOpen
                  ? isFlowchart
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
              }`}
            >
              <Code2 className={`w-3.5 h-3.5 ${isFlowchart ? 'text-blue-400' : 'text-emerald-400'}`} />
              <span>{isFlowchart ? 'Mermaid' : 'SQL'}</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 3. Central Canvas Viewport + Right Code Drawer                    */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex-1 w-full h-full relative flex overflow-hidden">
          {/* dbdiagram-style Right Slide-Over Toggle Button (<) */}
          {!isViewsDrawerOpen && (
            <button
              type="button"
              onClick={() => {
                setIsViewsDrawerOpen(true);
                setIsCodeDrawerOpen(false);
              }}
              className="absolute right-0 top-14 z-20 bg-emerald-600 hover:bg-emerald-700 border-l border-y border-emerald-700 text-white shadow-md shadow-emerald-900/25 py-2.5 px-1.5 rounded-l-xl transition-all flex items-center justify-center cursor-pointer group active:scale-95"
              title="Open Diagram Views & Table Outline"
              aria-label="Open Diagram Views"
            >
              <ChevronLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* REACT FLOW INFINITE CANVAS */}
          <main className="flex-1 w-full h-full relative">
            <ReactFlow
              nodes={renderedNodes}
              edges={renderedEdges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onInit={(instance) => {
                reactFlowInstanceRef.current = instance;
              }}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              maxZoom={2}
              className="bg-[#fafafa]"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.5}
                color="#e5e7eb"
              />
              <Controls
                position="bottom-right"
                className="!bg-white !border !border-border !rounded-xl !shadow-card !p-1 overflow-hidden"
              />
            </ReactFlow>
          </main>

          {/* RIGHT DRAWER 1: Live Code Panel (SQL for Schema, Mermaid for Flowcharts) */}
          {isCodeDrawerOpen && (
            <aside className="w-80 sm:w-96 border-l border-border bg-white flex flex-col z-10 animate-in slide-in-from-right duration-150">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider">
                  <FileCode className={`w-4 h-4 ${isFlowchart ? 'text-blue-600' : 'text-emerald-600'}`} />
                  <span>{isFlowchart ? 'Mermaid.js Flow' : 'PostgreSQL DDL'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-body hover:text-ink bg-gray-50 hover:bg-gray-100 border border-border rounded-md transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-muted" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCodeDrawerOpen(false)}
                    className="p-1 text-muted hover:text-ink rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Code Monospace Editor Preview */}
              <div className="flex-1 p-3 bg-gray-900 overflow-auto font-mono text-xs text-emerald-400 selection:bg-emerald-900">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {activeCodeContent || (isFlowchart ? '%% No flow nodes on canvas' : '-- No tables defined on canvas')}
                </pre>
              </div>

              <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted">
                <span>{isFlowchart ? 'Mermaid v10+ compliant' : 'PostgreSQL 16 compliant'}</span>
                <button
                  type="button"
                  onClick={handleDownloadCode}
                  className="text-karta-600 font-semibold hover:text-karta-800 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .{isFlowchart ? 'mmd' : 'sql'}</span>
                </button>
              </div>
            </aside>
          )}

          {/* RIGHT DRAWER 2: Clean Tables Outline Drawer */}
          <DiagramViewsDrawer
            isOpen={isViewsDrawerOpen}
            onClose={() => setIsViewsDrawerOpen(false)}
            nodes={nodes}
            hiddenNodeIds={hiddenNodeIds}
            onToggleNodeVisibility={handleToggleNodeVisibility}
            onToggleAllVisibility={handleToggleAllVisibility}
            onSelectTable={handleSelectTableFromOutline}
          />
        </div>
          </>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Sample Data Records Modal Dialog (dbdiagram Image 2)              */}
      {/* ----------------------------------------------------------------- */}
      {sampleModalTable && (
        <SampleDataModal
          isOpen={!!sampleModalTable}
          tableName={sampleModalTable.name}
          columns={sampleModalTable.columns}
          onClose={() => setSampleModalTable(null)}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Create Workspace Modal Dialog                                     */}
      {/* ----------------------------------------------------------------- */}
      {isCreatingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateWorkspaceSubmit}
            className="bg-white rounded-2xl border border-border p-5 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-100"
          >
            <h4 className="text-sm font-bold text-ink mb-1">Create New Workspace</h4>
            <p className="text-xs text-muted mb-3">Organize diagrams into a separate team or client workspace.</p>
            <input
              type="text"
              autoFocus
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g. Acme Corp Schema"
              className="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-karta-400 focus:bg-white"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsCreatingWorkspace(false)}
                className="px-3 py-1.5 text-xs text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-karta-500 hover:bg-karta-600 rounded-lg shadow-xs"
              >
                Create Workspace
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Workspace Member Invitation Modal (PBAC 11 Capabilities)          */}
      {/* ----------------------------------------------------------------- */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        workspaceName={activeWorkspace.name}
        onClose={() => setIsInviteModalOpen(false)}
        onSendInvite={handleSendInviteSubmit}
        isSending={isSendingInvite}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Resource Collaborator Members Modal (Private Projects & Diagrams) */}
      {/* ----------------------------------------------------------------- */}
      <ResourceMembersModal
        isOpen={!!resourceModalTarget}
        resourceTitle={resourceModalTarget?.item.name || ''}
        resourceType={resourceModalTarget?.type || 'diagram'}
        workspaceMembers={workspaceMembers}
        assignedMemberIds={resourceModalTarget?.item.member_user_ids || []}
        onSave={handleSaveResourceMembers}
        onClose={() => setResourceModalTarget(null)}
      />
    </div>
  );
};

export default SchemaCanvas;
