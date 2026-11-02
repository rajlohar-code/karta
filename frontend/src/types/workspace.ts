/**
 * Workspace, Project, and Diagram Domain Types
 * Grounded in: project_structure_lld.md and karta_design_system.md
 *
 * PYTHON BRIDGE:
 * Mirrors Pydantic models in `backend/app/domains/workspaces/schemas.py`,
 * `projects/schemas.py`, and `diagrams/schemas.py`.
 */

/**
 * Fine-Grained Capability-Based Permissions Matrix (PBAC)
 * Replaces rigid static roles (viewer/editor) with granular boolean flags.
 */
export interface WorkspacePermissions {
  can_view_public_diagrams: boolean;
  can_create_schemas: boolean;
  can_create_flowcharts: boolean;
  can_create_public_diagrams: boolean;
  can_edit_public_schemas: boolean;
  can_edit_private_diagrams_if_added: boolean;
  can_create_public_projects: boolean;
  can_create_private_projects: boolean;
  can_add_members_to_private_projects_if_added: boolean;
  can_use_readonly_ai: boolean;
  can_use_ai_generation: boolean;
  can_view_permissions: boolean;
  can_edit_permissions: boolean;
}

/**
 * Default permission values for new invitations:
 * Only `can_view_public_diagrams` is TRUE by default, all others are FALSE.
 */
export const DEFAULT_WORKSPACE_PERMISSIONS: WorkspacePermissions = {
  can_view_public_diagrams: true,
  can_create_schemas: false,
  can_create_flowcharts: false,
  can_create_public_diagrams: false,
  can_edit_public_schemas: false,
  can_edit_private_diagrams_if_added: false,
  can_create_public_projects: false,
  can_create_private_projects: false,
  can_add_members_to_private_projects_if_added: false,
  can_use_readonly_ai: false,
  can_use_ai_generation: false,
  can_view_permissions: false,
  can_edit_permissions: false,
};

/**
 * Human-readable metadata and descriptions for UI permission checkboxes
 */
export const PERMISSION_METADATA: Record<
  keyof WorkspacePermissions,
  { label: string; description: string; category: 'Diagrams' | 'Projects' | 'AI' | 'Collaborators' }
> = {
  can_view_public_diagrams: {
    label: 'View Public Diagrams',
    description: 'Can inspect and view all public diagrams in workspace',
    category: 'Diagrams',
  },
  can_create_schemas: {
    label: 'Create Schemas',
    description: 'Can create new relational database schema canvases',
    category: 'Diagrams',
  },
  can_create_flowcharts: {
    label: 'Create Flowcharts',
    description: 'Can create system architecture and logic flowcharts',
    category: 'Diagrams',
  },
  can_create_public_diagrams: {
    label: 'Create Public Diagrams',
    description: 'Can publish diagrams as visible to everyone in workspace',
    category: 'Diagrams',
  },
  can_edit_public_schemas: {
    label: 'Edit Public Schemas',
    description: 'Can modify tables, columns, and foreign keys on public schemas',
    category: 'Diagrams',
  },
  can_edit_private_diagrams_if_added: {
    label: 'Edit Private Diagrams (If Added)',
    description: 'Can edit private diagrams only when explicitly assigned as a collaborator',
    category: 'Diagrams',
  },
  can_create_public_projects: {
    label: 'Create Public Projects',
    description: 'Can create public project folders accessible to all collaborators',
    category: 'Projects',
  },
  can_create_private_projects: {
    label: 'Create Private Projects',
    description: 'Can create restricted private project folders',
    category: 'Projects',
  },
  can_add_members_to_private_projects_if_added: {
    label: 'Manage Collaborators in Private Projects (If Added)',
    description: 'Can add/remove other collaborators inside private projects they belong to',
    category: 'Projects',
  },
  can_use_readonly_ai: {
    label: 'Read-Only AI Assistant',
    description: 'Can ask AI questions about architecture without mutating diagrams',
    category: 'AI',
  },
  can_use_ai_generation: {
    label: 'AI Generation & Schema Synthesis',
    description: 'Can use AI Copilot to generate and auto-apply schema modifications',
    category: 'AI',
  },
  can_view_permissions: {
    label: 'View Collaborator Permissions',
    description: 'Can inspect capability configurations and collaborator access levels',
    category: 'Collaborators',
  },
  can_edit_permissions: {
    label: 'Edit Collaborator Permissions',
    description: 'Can update permissions and capability settings for workspace collaborators',
    category: 'Collaborators',
  },
};

export interface WorkspaceMemberItem {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  is_owner?: boolean;
  permissions: WorkspacePermissions;
  joined_at: string;
}

export interface WorkspaceItem {
  id: number;
  name: string;
  slug: string;
  user_role: 'owner' | 'editor' | 'viewer';
}

export interface ProjectItem {
  id: number;
  name: string;
  description?: string | null;
  is_pinned: boolean;
  is_public: boolean; // By default FALSE (Private)
  member_user_ids?: number[]; // Explicit workspace members granted access to private project
  diagrams_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DiagramItem {
  id: number;
  name: string;
  slug: string;
  type: 'schema' | 'flowchart';
  is_pinned: boolean;
  is_public: boolean; // By default FALSE (Private)
  member_user_ids?: number[]; // Explicit workspace members granted access to private diagram
  project_id?: number | null;
  updated_at: string;
}
