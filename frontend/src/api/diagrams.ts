/**
 * Diagrams Domain API Client
 * Grounded in: karta_security.md, project_structure_lld.md, and karta_design_system.md
 *
 * ARCHITECTURAL PRINCIPLE:
 * All requests use `credentials: 'include'` to pass HTTP-only signed session cookies.
 * Diagrams use unguessable random slugs (`/d/{slug}`) per Layer 3 Security Architecture.
 *
 * PYTHON BRIDGE:
 * Mirrors `backend/app/domains/diagrams/router.py`.
 */

import { API_BASE_URL } from '../config/env';
import type { DiagramItem } from '../types/workspace';

/**
 * Backend response structure for Diagram Summary
 * Mirrors `DiagramSummaryResponse` in `backend/app/domains/diagrams/schemas.py`
 */
interface BackendDiagramSummaryResponse {
  id: number;
  name: string;
  slug: string;
  type: 'schema' | 'flowchart';
  project_id?: number | null;
  workspace_id?: number | null;
  creator_id?: number | null;
  is_public: boolean;
  is_pinned: boolean;
  current_revision: number;
  created_at: string;
  updated_at: string;
  member_user_ids?: number[];
}

/**
 * Complete Diagram Canvas Detail Response with Schema & Layout Snapshots
 * Mirrors `DiagramDetailResponse` in `backend/app/domains/diagrams/schemas.py`
 */
export interface BackendDiagramDetailResponse extends BackendDiagramSummaryResponse {
  schema_snapshot: {
    tables: Record<string, {
      name: string;
      columns: Array<{
        name: string;
        data_type: string;
        is_primary_key?: boolean;
        is_nullable?: boolean;
      }>;
    }>;
    foreign_keys: Array<{
      source_table: string;
      source_column: string;
      target_table: string;
      target_column: string;
    }>;
  };
  layout_snapshot: {
    nodes: Record<string, { x: number; y: number }>;
  };
  user_role: string;
}

/**
 * ---------------------------------------------------------------------------
 * 1. Fetch all diagrams for a workspace (both standalone and project-nested)
 * ---------------------------------------------------------------------------
 *
 * Endpoint: GET /api/v1/workspaces/{slug}/diagrams
 *
 * Request: None (Workspace slug in URL path, Session cookie in headers)
 *
 * Response (200 OK):
 * [
 *   {
 *     "id": 1,
 *     "name": "E-Commerce Database",
 *     "slug": "d_xK9mP2qR",
 *     "type": "schema",
 *     "project_id": 1,
 *     "is_public": false,
 *     "is_pinned": true,
 *     "current_revision": 1,
 *     "member_user_ids": [2],
 *     "created_at": "2026-10-30T10:00:00Z",
 *     "updated_at": "2026-10-30T10:00:00Z"
 *   }
 * ]
 */
export async function listWorkspaceDiagrams(workspaceSlug: string): Promise<DiagramItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/diagrams`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to fetch diagrams' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const data: BackendDiagramSummaryResponse[] = await response.json();
  return data.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    type: d.type,
    is_pinned: d.is_pinned,
    is_public: d.is_public,
    member_user_ids: d.member_user_ids || [],
    project_id: d.project_id ?? null,
    updated_at: d.updated_at ? d.updated_at.split('T')[0] : 'Just now',
  }));
}

/**
 * ---------------------------------------------------------------------------
 * 2. Create a new diagram canvas in a workspace (Standalone or in Project)
 * ---------------------------------------------------------------------------
 *
 * Endpoint: POST /api/v1/workspaces/{slug}/diagrams
 *
 * Request Payload:
 * {
 *   "name": "unnamed_diagram_1",
 *   "type": "schema",
 *   "is_public": false,
 *   "is_pinned": false,
 *   "project_id": 1
 * }
 *
 * Response (201 Created):
 * {
 *   "id": 2,
 *   "name": "unnamed_diagram_1",
 *   "slug": "d_7vL3pQ9m",
 *   ...
 * }
 */
export async function createWorkspaceDiagram(
  workspaceSlug: string,
  name: string,
  type: 'schema' | 'flowchart',
  projectId?: number,
  isPublic: boolean = false
): Promise<DiagramItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/diagrams`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name,
        type,
        is_public: isPublic,
        is_pinned: false,
        project_id: projectId ?? null,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to create diagram' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const d: BackendDiagramDetailResponse = await response.json();
  return {
    id: d.id,
    name: d.name,
    slug: d.slug,
    type: d.type,
    is_pinned: d.is_pinned,
    is_public: d.is_public,
    member_user_ids: d.member_user_ids || [],
    project_id: d.project_id ?? null,
    updated_at: 'Just now',
  };
}

/**
 * ---------------------------------------------------------------------------
 * 3. Load Diagram Canvas State & Snapshots by Slug
 * ---------------------------------------------------------------------------
 *
 * Endpoint: GET /api/v1/diagrams/{slug}
 *
 * Response (200 OK):
 * {
 *   "id": 1,
 *   "name": "E-Commerce",
 *   "slug": "d_xK9mP2qR",
 *   "schema_snapshot": { "tables": { ... }, "foreign_keys": [ ... ] },
 *   "layout_snapshot": { "nodes": { ... } },
 *   "user_role": "owner",
 *   ...
 * }
 */
export async function getDiagramCanvas(diagramSlug: string): Promise<BackendDiagramDetailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/diagrams/${encodeURIComponent(diagramSlug)}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to load diagram canvas' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

/**
 * ---------------------------------------------------------------------------
 * 4. Rename an existing diagram
 * ---------------------------------------------------------------------------
 *
 * Endpoint: PATCH /api/v1/diagrams/{slug}
 *
 * Request Payload:
 * {
 *   "name": "Renamed Diagram"
 * }
 */
export async function renameDiagramApi(
  diagramSlug: string,
  name: string
): Promise<DiagramItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/diagrams/${encodeURIComponent(diagramSlug)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to rename diagram' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const d: BackendDiagramSummaryResponse = await response.json();
  return {
    id: d.id,
    name: d.name,
    slug: d.slug,
    type: d.type,
    is_pinned: d.is_pinned,
    is_public: d.is_public,
    member_user_ids: d.member_user_ids || [],
    project_id: d.project_id ?? null,
    updated_at: 'Just now',
  };
}

/**
 * ---------------------------------------------------------------------------
 * 5. Toggle Pinned status for a diagram
 * ---------------------------------------------------------------------------
 *
 * Endpoint: PATCH /api/v1/diagrams/{slug}
 *
 * Request Payload:
 * {
 *   "is_pinned": true
 * }
 */
export async function togglePinDiagramApi(
  diagramSlug: string,
  isPinned: boolean
): Promise<DiagramItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/diagrams/${encodeURIComponent(diagramSlug)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ is_pinned: isPinned }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to toggle diagram pin' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const d: BackendDiagramSummaryResponse = await response.json();
  return {
    id: d.id,
    name: d.name,
    slug: d.slug,
    type: d.type,
    is_pinned: d.is_pinned,
    is_public: d.is_public,
    member_user_ids: d.member_user_ids || [],
    project_id: d.project_id ?? null,
    updated_at: 'Just now',
  };
}

/**
 * ---------------------------------------------------------------------------
 * 6. Delete a diagram
 * ---------------------------------------------------------------------------
 *
 * Endpoint: DELETE /api/v1/diagrams/{slug}
 *
 * Response (200 OK):
 * {
 *   "status": "ok",
 *   "message": "Diagram deleted successfully"
 * }
 */
export async function deleteDiagramApi(
  diagramSlug: string
): Promise<{ status: string; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/diagrams/${encodeURIComponent(diagramSlug)}`,
    {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to delete diagram' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

