/**
 * Resource-Level Privacy & Member Assignment API Client
 * Grounded in: karta_security.md, project_structure_lld.md, and karta_design_system.md
 *
 * ARCHITECTURAL PRINCIPLE:
 * Implements resource-level access control for Projects and Diagrams.
 * Projects and Diagrams are Private by default (`is_public = False`).
 * Collaborators can be explicitly assigned via junction tables `project_members` and `diagram_members`.
 *
 * PYTHON BRIDGE:
 * - Mirrors `projects/router.py` and `diagrams/router.py` in backend.
 * - HTTP-Only signed session cookies sent via `credentials: 'include'`.
 */

import { API_BASE_URL } from '../config/env';

/**
 * ---------------------------------------------------------------------------
 * 1. Assign Collaborators to a Private Project
 * ---------------------------------------------------------------------------
 *
 * Endpoint: PUT /api/v1/workspaces/{workspace_slug}/projects/{project_id}/members
 *
 * Request Payload:
 * {
 *   "member_user_ids": [2, 3]
 * }
 *
 * Response (200 OK):
 * {
 *   "id": 1,
 *   "name": "E-Commerce",
 *   "is_public": false,
 *   "member_user_ids": [2, 3],
 *   ...
 * }
 */
export async function updateProjectMembers(
  workspaceSlug: string,
  projectId: number,
  memberUserIds: number[]
): Promise<{ member_user_ids: number[] }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${projectId}/members`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ member_user_ids: memberUserIds }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to update project members' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

/**
 * ---------------------------------------------------------------------------
 * 2. Assign Collaborators to a Private Diagram
 * ---------------------------------------------------------------------------
 *
 * Endpoint: PUT /api/v1/diagrams/{diagram_slug}/members
 *
 * Request Payload:
 * {
 *   "member_user_ids": [2, 3]
 * }
 *
 * Response (200 OK):
 * {
 *   "status": "ok",
 *   "member_user_ids": [2, 3]
 * }
 */
export async function updateDiagramMembers(
  diagramSlug: string,
  memberUserIds: number[]
): Promise<{ status: string; member_user_ids: number[] }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/diagrams/${encodeURIComponent(diagramSlug)}/members`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ member_user_ids: memberUserIds }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to update diagram members' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

/**
 * ---------------------------------------------------------------------------
 * 3. Toggle Public / Private Privacy for a Project
 * ---------------------------------------------------------------------------
 *
 * Endpoint: PATCH /api/v1/workspaces/{workspace_slug}/projects/{project_id}
 *
 * Request Payload:
 * {
 *   "is_public": true
 * }
 */
export async function toggleProjectPrivacyApi(
  workspaceSlug: string,
  projectId: number,
  isPublic: boolean
): Promise<{ id: number; is_public: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${projectId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ is_public: isPublic }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to update project privacy' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

/**
 * ---------------------------------------------------------------------------
 * 4. Toggle Public / Private Privacy for a Diagram
 * ---------------------------------------------------------------------------
 *
 * Endpoint: PATCH /api/v1/diagrams/{diagram_slug}
 *
 * Request Payload:
 * {
 *   "is_public": true
 * }
 */
export async function toggleDiagramPrivacyApi(
  diagramSlug: string,
  isPublic: boolean
): Promise<{ id: number; is_public: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/diagrams/${encodeURIComponent(diagramSlug)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ is_public: isPublic }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Failed to update diagram privacy' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

