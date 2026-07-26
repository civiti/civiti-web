import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { environment } from './environments/environment';
import { SITE_URL } from './app/constants/urls';
import { GUIDE_ARTICLES } from './app/generated/guide-data';

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

/**
 * One <url> entry. `<priority>` and `<changefreq>` are deliberately omitted —
 * Google ignores both, and emitting them on pages we don't actually revisit at
 * that cadence is noise. `<lastmod>` is emitted only where we have a real date;
 * a fabricated one is worse than none, because Google learns to distrust the
 * field across the whole sitemap.
 */
function urlEntry(loc: string, lastmod?: string): string {
  const modLine = lastmod ? `\n    <lastmod>${xmlEscape(lastmod)}</lastmod>` : '';
  return `  <url>\n    <loc>${loc}</loc>${modLine}\n  </url>`;
}

function buildSitemapXml(issues: SitemapIssue[]): string {
  // Only URLs that resolve 200 with their own content belong here. Notably
  // absent, and intentionally so:
  //   /location — 301s to / (the city picker moved onto the homepage)
  //   /issues   — has always been a redirect to /bucuresti
  // Submitting a redirect asks Google to spend crawl budget learning it is a
  // redirect, and on a domain this small that budget is the scarce resource.
  const staticEntries = [
    `${SITE_URL}/`,
    `${SITE_URL}/bucuresti`,
    `${SITE_URL}/ghid`,
    `${SITE_URL}/despre`,
    `${SITE_URL}/privacy`,
    `${SITE_URL}/terms`,
  ].map((loc) => urlEntry(loc));

  // Guides are the densest editorial content on the domain and were missing
  // from the sitemap entirely. Built from the same generated module that
  // app.routes.server.ts uses to prerender them, so the two cannot drift.
  const guideEntries = GUIDE_ARTICLES.map((article) =>
    urlEntry(`${SITE_URL}/ghid/${xmlEscape(article.slug)}`, article.publishedAt),
  );

  const issueEntries = issues.map((issue) =>
    urlEntry(
      `${SITE_URL}/issue/${xmlEscape(issue.id)}`,
      new Date(issue.updatedAt ?? issue.createdAt).toISOString(),
    ),
  );

  const body = [...staticEntries, ...guideEntries, ...issueEntries].join('\n');

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
    // Fail CLOSED, not open. The previous behaviour served a truncated sitemap
    // with HTTP 200, which authoritatively tells Google "the issue URLs I
    // previously declared are gone" every time Railway is slow — and the
    // s-maxage pinned that claim at the edge for the next 5 minutes.
    //
    // A 503 says "ask again later": Google retries and keeps the URL set from
    // the last successful fetch intact. no-store keeps a transient backend
    // blip from being cached as an outage.
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '600');
    res.status(503).send('Sitemap temporarily unavailable');
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
