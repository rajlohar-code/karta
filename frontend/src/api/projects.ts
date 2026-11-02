/**
 * Projects API Client
 * Grounded in: karta_security.md, project_structure_lld.md, and karta_design_system.md
 *
 * ARCHITECTURAL PRINCIPLE:
 * All requests use `credentials: 'include'` to pass HTTP-only signed session cookies.
 *
 * PYTHON BRIDGE:
 * Mirrors `backend/app/domains/projects/router.py`.
 */

import { API_BASE_URL } from '../config/env';
import type { ProjectItem } from '../types/workspace';

/**
 * Backend response structure for a Project
 * Mirrors `ProjectResponse` in `backend/app/domains/projects/schemas.py`
 */
interface BackendProjectResponse {
  id: number;
  workspace_id: number;
  name: string;
  description?: string | null;
  is_pinned: boolean;
  is_public: boolean;
  member_user_ids?: number[];
  diagrams_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * ---------------------------------------------------------------------------
 * 1. Fetch all projects in a workspace
 * ---------------------------------------------------------------------------
 *
 * Endpoint: GET /api/v1/workspaces/{slug}/projects
 *
 * Request: None (Slug in URL path, Session cookie in headers)
 *
 * Response (200 OK):
 * [
 *   {
 *     "id": 1,
 *     "workspace_id": 1,
 *     "name": "E-Commerce Platform",
 *     "description": null,
 *     "is_pinned": false,
 *     "is_public": false,
 *     "member_user_ids": [2],
 *     "diagrams_count": 3,
 *     "created_at": "2026-10-30T10:00:00Z",
 *     "updated_at": "2026-10-30T10:00:00Z"
 *   }
 * ]
 */
export async function listProjects(workspaceSlug: string): Promise<ProjectItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/projects`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to fetch projects' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const data: BackendProjectResponse[] = await response.json();
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    is_pinned: p.is_pinned,
    is_public: p.is_public,
    member_user_ids: p.member_user_ids || [],
    diagrams_count: p.diagrams_count || 0,
    created_at: p.created_at ? p.created_at.split('T')[0] : '',
    updated_at: p.updated_at ? p.updated_at.split('T')[0] : '',
  }));
}

/**
 * ---------------------------------------------------------------------------
 * 2. Create a new project inside a workspace
 * ---------------------------------------------------------------------------
 *
 * Endpoint: POST /api/v1/workspaces/{slug}/projects
 *
 * Request Payload:
 * {
 *   "name": "Auth Service",
 *   "description": "User authentication and JWT models",
 *   "is_public": false,
 *   "is_pinned": false
 * }
 *
 * Response (201 Created):
 * {
 *   "id": 2,
 *   "name": "Auth Service",
 *   ...
 * }
 */
export async function createProject(
  workspaceSlug: string,
  name: string,
  description?: string,
  isPublic: boolean = false
): Promise<ProjectItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/projects`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name,
        description: description || null,
        is_public: isPublic,
        is_pinned: false,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to create project' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const p: BackendProjectResponse = await response.json();
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    is_pinned: p.is_pinned,
    is_public: p.is_public,
    member_user_ids: p.member_user_ids || [],
    diagrams_count: 0,
    created_at: p.created_at ? p.created_at.split('T')[0] : '',
    updated_at: p.updated_at ? p.updated_at.split('T')[0] : '',
  };
}

/**
 * ---------------------------------------------------------------------------
 * 3. Rename an existing project
 * ---------------------------------------------------------------------------
 *
 * Endpoint: PATCH /api/v1/workspaces/{slug}/projects/{project_id}
 *
 * Request Payload:
 * {
 *   "name": "Renamed Project"
 * }
 */
export async function renameProject(
  workspaceSlug: string,
  projectId: number,
  name: string
): Promise<ProjectItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${projectId}`,
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
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to rename project' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const p: BackendProjectResponse = await response.json();
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    is_pinned: p.is_pinned,
    is_public: p.is_public,
    member_user_ids: p.member_user_ids || [],
    diagrams_count: p.diagrams_count || 0,
    created_at: p.created_at ? p.created_at.split('T')[0] : '',
    updated_at: p.updated_at ? p.updated_at.split('T')[0] : '',
  };
}

/**
 * ---------------------------------------------------------------------------
 * 4. Toggle Pinned status for a project
 * ---------------------------------------------------------------------------
 *
 * Endpoint: PATCH /api/v1/workspaces/{slug}/projects/{project_id}
 *
 * Request Payload:
 * {
 *   "is_pinned": true
 * }
 */
export async function togglePinProjectApi(
  workspaceSlug: string,
  projectId: number,
  isPinned: boolean
): Promise<ProjectItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${projectId}`,
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
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to toggle project pin' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const p: BackendProjectResponse = await response.json();
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    is_pinned: p.is_pinned,
    is_public: p.is_public,
    member_user_ids: p.member_user_ids || [],
    diagrams_count: p.diagrams_count || 0,
    created_at: p.created_at ? p.created_at.split('T')[0] : '',
    updated_at: p.updated_at ? p.updated_at.split('T')[0] : '',
  };
}

/**
 * ---------------------------------------------------------------------------
 * 5. Delete a project and its child diagrams
 * ---------------------------------------------------------------------------
 *
 * Endpoint: DELETE /api/v1/workspaces/{slug}/projects/{project_id}
 *
 * Response (200 OK):
 * {
 *   "status": "ok",
 *   "message": "Project deleted successfully"
 * }
 */
export async function deleteProjectApi(
  workspaceSlug: string,
  projectId: number
): Promise<{ status: string; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${projectId}`,
    {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to delete project' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

