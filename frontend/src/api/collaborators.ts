/**
 * Collaborators & Workspace PBAC API Client
 * Grounded in: karta_security.md, project_structure_lld.md, and karta_design_system.md
 *
 * ARCHITECTURAL PRINCIPLE:
 * All requests use `credentials: 'include'` to pass HTTP-only signed session cookies.
 * In development, Vite reverse-proxies `/api` to `http://127.0.0.1:8000`.
 * In production, the reverse proxy / CDN handles this same-origin path.
 *
 * PYTHON BRIDGE:
 * - `fetch()` with `credentials: 'include'` <---> Python `httpx.AsyncClient()` with cookies
 * - TypeScript interfaces <---> Pydantic request/response schemas
 */

import { API_BASE_URL } from '../config/env';
import type {
  WorkspaceMemberItem,
  WorkspacePermissions,
} from '../types/workspace';

/**
 * Backend response structure for a Workspace Member
 * Mirrors `WorkspaceMemberResponse` in `backend/app/domains/workspaces/schemas.py`
 */
interface BackendWorkspaceMemberResponse {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: string;
  is_owner: boolean;
  permissions: WorkspacePermissions;
  joined_at: string;
}

/**
 * ---------------------------------------------------------------------------
 * 1. Fetch all collaborators for a workspace
 * ---------------------------------------------------------------------------
 *
 * Endpoint: GET /api/v1/workspaces/{slug}/members
 *
 * Request: None (Slug in URL path, Session cookie in headers)
 *
 * Response (200 OK):
 * [
 *   {
 *     "id": 1,
 *     "user_id": 1,
 *     "name": "Raj Lohar",
 *     "email": "rajlohar2006@gmail.com",
 *     "avatar_url": null,
 *     "role": "owner",
 *     "is_owner": true,
 *     "permissions": { "can_view_public_diagrams": true, ... },
 *     "joined_at": "2026-10-30T10:00:00Z"
 *   }
 * ]
 */
export async function getWorkspaceCollaborators(
  workspaceSlug: string
): Promise<WorkspaceMemberItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/members`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to fetch collaborators' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const data: BackendWorkspaceMemberResponse[] = await response.json();

  // Normalize backend response to frontend WorkspaceMemberItem format
  return data.map((item) => ({
    id: item.user_id, // We use user_id as the primary identifier for member operations
    user_id: item.user_id,
    name: item.name,
    email: item.email,
    avatar_url: item.avatar_url,
    is_owner: item.is_owner,
    permissions: item.permissions,
    joined_at: item.joined_at ? item.joined_at.split('T')[0] : '',
  }));
}

/**
 * ---------------------------------------------------------------------------
 * 2. Update fine-grained capability permissions for a collaborator
 * ---------------------------------------------------------------------------
 *
 * Endpoint: PATCH /api/v1/workspaces/{slug}/members/{user_id}/permissions
 *
 * Request Payload:
 * {
 *   "permissions": {
 *     "can_view_public_diagrams": true,
 *     "can_create_schemas": true,
 *     "can_create_flowcharts": false,
 *     ...
 *   }
 * }
 *
 * Response (200 OK):
 * {
 *   "id": 2,
 *   "user_id": 2,
 *   "name": "Aman Sharma",
 *   "permissions": { ... }
 * }
 */
export async function updateCollaboratorPermissions(
  workspaceSlug: string,
  userId: number,
  permissions: WorkspacePermissions
): Promise<WorkspaceMemberItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/members/${userId}/permissions`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ permissions }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to update permissions' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  const item: BackendWorkspaceMemberResponse = await response.json();

  return {
    id: item.user_id,
    user_id: item.user_id,
    name: item.name,
    email: item.email,
    avatar_url: item.avatar_url,
    is_owner: item.is_owner,
    permissions: item.permissions,
    joined_at: item.joined_at ? item.joined_at.split('T')[0] : '',
  };
}

/**
 * ---------------------------------------------------------------------------
 * 3. Remove a collaborator from the workspace
 * ---------------------------------------------------------------------------
 *
 * Endpoint: DELETE /api/v1/workspaces/{slug}/members/{user_id}
 *
 * Request: None (Slug and user_id in URL path)
 *
 * Response (200 OK):
 * {
 *   "status": "success",
 *   "message": "Collaborator removed successfully"
 * }
 */
export async function removeCollaborator(
  workspaceSlug: string,
  userId: number
): Promise<{ status: string; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/members/${userId}`,
    {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to remove collaborator' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

