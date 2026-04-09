import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static public pages — build-time prerender for instant response
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'location', renderMode: RenderMode.Prerender },
  { path: 'privacy', renderMode: RenderMode.Prerender },
  { path: 'terms', renderMode: RenderMode.Prerender },

  // Dynamic public pages — server-rendered on demand for freshness
  { path: 'issues', renderMode: RenderMode.Server },
  { path: 'issue/:id', renderMode: RenderMode.Server },

  // Auth pages — client-side only (no SEO value)
  { path: 'auth/**', renderMode: RenderMode.Client },

  // Protected pages — client-side only
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'my-issues', renderMode: RenderMode.Client },
  { path: 'edit-issue/:id', renderMode: RenderMode.Client },
  { path: 'create-issue/**', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },

  // Fallback
  { path: '**', renderMode: RenderMode.Client },
];
