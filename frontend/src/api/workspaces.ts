/**
 * Workspaces API Client
 * Grounded in: karta_security.md, project_structure_lld.md, and karta_design_system.md
 *
 * ARCHITECTURAL PRINCIPLE:
 * All requests use `credentials: 'include'` to pass HTTP-only signed session cookies.
 *
 * PYTHON BRIDGE:
 * Mirrors `backend/app/domains/workspaces/router.py`.
 */

import { API_BASE_URL } from '../config/env';
import type { WorkspaceItem } from '../types/workspace';

/**
 * Backend response structure for a Workspace
 * Mirrors `WorkspaceResponse` in `backend/app/domains/workspaces/schemas.py`
 */
interface BackendWorkspaceResponse {
  id: number;
  name: string;
  slug: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  user_role: 'owner' | 'editor' | 'viewer';
}

/**
 * ---------------------------------------------------------------------------
 * 1. Fetch all workspaces the current user belongs to
 * ---------------------------------------------------------------------------
 *
 * Endpoint: GET /api/v1/workspaces
 *
 * Request: None (Session cookie in headers)
 *
 * Response (200 OK):
 * [
 *   {
 *     "id": 1,
 *     "name": "Raj's Workspace",
 *     "slug": "w_xK9mP2qR",
 *     "owner_id": 1,
 *     "user_role": "owner",
 *     "created_at": "2026-10-30T10:00:00Z",
 *     "updated_at": "2026-10-30T10:00:00Z"
 *   }
 * ]
 */
export async function listWorkspaces(): Promise<WorkspaceItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workspaces`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to fetch workspaces' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const data: BackendWorkspaceResponse[] = await response.json();
  return data.map((ws) => ({
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    user_role: ws.user_role,
  }));
}

/**
 * ---------------------------------------------------------------------------
 * 2. Create a new workspace
 * ---------------------------------------------------------------------------
 *
 * Endpoint: POST /api/v1/workspaces
 *
 * Request Payload:
 * {
 *   "name": "Acme Corp Systems"
 * }
 *
 * Response (201 Created):
 * {
 *   "id": 2,
 *   "name": "Acme Corp Systems",
 *   "slug": "w_a8L1p9Km",
 *   "owner_id": 1,
 *   "user_role": "owner",
 *   ...
 * }
 */
export async function createWorkspace(name: string): Promise<WorkspaceItem> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to create workspace' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const ws: BackendWorkspaceResponse = await response.json();
  return {
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    user_role: ws.user_role,
  };
}

/**
 * ---------------------------------------------------------------------------
 * 3. Rename a workspace
 * ---------------------------------------------------------------------------
 *
 * Endpoint: PATCH /api/v1/workspaces/{slug}
 *
 * Request Payload:
 * {
 *   "name": "New Workspace Name"
 * }
 */
export async function updateWorkspaceName(slug: string, name: string): Promise<WorkspaceItem> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to update workspace name' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const ws: BackendWorkspaceResponse = await response.json();
  return {
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    user_role: ws.user_role,
  };
}

