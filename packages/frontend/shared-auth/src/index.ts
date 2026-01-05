// Use this file to export React client components (e.g. those with 'use client' directive) or other non-server utilities
// NOTE: Do NOT import '@pokehub/frontend/global-next-types' here - it causes Turbopack to
// trace into next-auth's server code, breaking client component bundling.
// Type augmentations are imported in server.ts where they're actually needed.

export { useAuthSession } from './lib/useAuthSession';
export { getSession as getAuthSession } from 'next-auth/react';
