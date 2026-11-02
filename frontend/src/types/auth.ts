/**
 * Auth & User Domain Types
 * Grounded in: karta_security.md and project_structure_lld.md
 *
 * ARCHITECTURAL PRINCIPLE:
 * Shared domain contracts must NEVER be declared ad-hoc inside UI presentation
 * components (like Navbar.tsx). They belong in dedicated domain type definitions
 * under `src/types/` so all components and hooks share the exact same source of truth.
 *
 * PYTHON BRIDGE:
 * Equivalent to Pydantic models in `backend/app/domains/users/schemas.py`.
 */

export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  avatar_url?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}
