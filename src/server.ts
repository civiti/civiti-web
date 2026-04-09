import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { environment } from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// ============================================================================
// Dynamic sitemap
// ============================================================================
//
// Serves /sitemap.xml by fetching public issues from the backend and emitting
// an XML sitemap with static routes plus every /issue/:id. Edge-cached for
// 1 hour via s-maxage so the backend is hit at most once per hour per region.
// ============================================================================

const SITE_URL = 'https://civiti.ro';
// The backend clamps `pageSize` to a maximum of 100 (verified in
// IssueEndpoints.cs), so requesting more just gets silently reduced. We
// match the cap exactly and paginate to get everything.
const SITEMAP_ISSUE_PAGE_SIZE = 100;
// Hard safety cap on pagination iterations. At 100 issues per page this is
// 10,000 public issues — far more than the Bucuresti pilot needs. If the
// platform ever approaches this, switch to a dedicated /api/issues/sitemap
// lightweight endpoint instead of paginating the full listing.
const SITEMAP_MAX_PAGES = 100;
const SITEMAP_FETCH_TIMEOUT_MS = 5000;

interface SitemapIssue {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

interface PagedIssuesResponse {
  items: SitemapIssue[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function xmlEscape(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

async function fetchPublicIssues(): Promise<SitemapIssue[]> {
  // One global timeout for the entire pagination loop — if the whole
  // operation doesn't finish in SITEMAP_FETCH_TIMEOUT_MS, abort and fall
  // back to the static-only sitemap. This prevents a slow backend from
  // eating unbounded function time one page at a time.
  const signal = AbortSignal.timeout(SITEMAP_FETCH_TIMEOUT_MS);

  // `status=Active,Resolved` includes resolved issues, whose detail pages
  // remain publicly viewable and are high-value long-tail SEO content
  // ("success story" pages). Without this the endpoint defaults to Active
  // only and every resolved issue is invisible to Google.
  const baseQuery = `pageSize=${SITEMAP_ISSUE_PAGE_SIZE}&status=Active,Resolved&sortBy=date`;

  const all: SitemapIssue[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= SITEMAP_MAX_PAGES) {
    const url = `${environment.apiUrl}/issues?page=${page}&${baseQuery}`;
    const res = await fetch(url, { signal });
    if (!res.ok) {
      throw new Error(`Issues API returned ${res.status} on page ${page}`);
    }
    const data = (await res.json()) as PagedIssuesResponse;
    all.push(...(data.items ?? []));
    totalPages = data.totalPages ?? 1;
    if (page >= totalPages) {
      break;
    }
    page++;
  }

  if (page >= SITEMAP_MAX_PAGES && totalPages > SITEMAP_MAX_PAGES) {
    console.warn(
      `[sitemap] Hit SITEMAP_MAX_PAGES=${SITEMAP_MAX_PAGES} safety cap. ` +
        `Backend reported totalPages=${totalPages} — the sitemap is incomplete. ` +
        `Switch to a dedicated lightweight endpoint before this matters for SEO.`,
    );
  }

  return all;
}

function buildSitemapXml(issues: SitemapIssue[]): string {
  const staticEntries = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/location`, changefreq: 'weekly', priority: '0.9' },
    { loc: `${SITE_URL}/issues`, changefreq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/privacy`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${SITE_URL}/terms`, changefreq: 'yearly', priority: '0.3' },
  ]
    .map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
    )
    .join('\n');

  const issueEntries = issues
    .map((issue) => {
      const loc = `${SITE_URL}/issue/${xmlEscape(issue.id)}`;
      const lastmod = new Date(issue.updatedAt ?? issue.createdAt).toISOString();
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
    })
    .join('\n');

  const body = [staticEntries, issueEntries].filter(Boolean).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

// Define the sitemap route BEFORE express.static so the dynamic handler wins
// over any stale file left in the build output.
app.get('/sitemap.xml', async (_req, res) => {
  try {
    const issues = await fetchPublicIssues();
    const xml = buildSitemapXml(issues);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400',
    );
    res.status(200).send(xml);
  } catch (error) {
    console.error('[sitemap] Failed to build dynamic sitemap:', error);
    // Fallback to static-only sitemap with a shorter cache window so a recovered
    // backend takes effect quickly on the next crawl.
    const xml = buildSitemapXml([]);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=3600',
    );
    res.status(200).send(xml);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
