import { RenderMode, ServerRoute } from '@angular/ssr';
import { GUIDE_ARTICLES } from './generated/guide-data';

export const serverRoutes: ServerRoute[] = [
  // Static public pages — build-time prerender for instant response.
  // '' now resolves to HomeComponent. While it was a `redirectTo` route the
  // extractor refused to prerender it and the build emitted no index.html at
  // all, so the apex domain served a bare CSR shell.
  { path: '', renderMode: RenderMode.Prerender },
  // 'location' is deliberately absent: it is a redirect now, and prerendering
  // it would keep emitting a stale static file that wins over the vercel.json
  // 301 (Vercel checks the filesystem before applying rewrites).
  { path: 'privacy', renderMode: RenderMode.Prerender },
  { path: 'terms', renderMode: RenderMode.Prerender },
  { path: 'despre', renderMode: RenderMode.Prerender },

  // Guides — content is static (built from markdown into GUIDE_ARTICLES at
  // build time), so prerender every slug instead of paying for SSR per request.
  { path: 'ghid', renderMode: RenderMode.Prerender },
  {
    path: 'ghid/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      GUIDE_ARTICLES.map((article) => ({ slug: article.slug })),
  },

  // Dynamic public pages — server-rendered on demand for freshness
  { path: 'bucuresti', renderMode: RenderMode.Server },
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
