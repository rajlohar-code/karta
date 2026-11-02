/**
 * Environment & Runtime Configuration
 * Grounded in: 12-Factor App methodology
 *
 * ARCHITECTURAL PRINCIPLE:
 * In modern fullstack architectures, frontend uses relative API paths (`/api/...`).
 * - In Development: Vite's built-in reverse proxy forwards `/api` to the backend.
 * - In Production: Cloudflare, Nginx, or the hosting edge routes `/api` to the backend container.
 * This ensures cookies are ALWAYS first-party, same-origin, and never dropped by browsers.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string) || '';
