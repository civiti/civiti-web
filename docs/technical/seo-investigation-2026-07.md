# Civiti SEO Investigation — July 2026

Six independent audit dimensions (rendering/routing, indexability/crawl, on-page metadata,
structured data, content/keyword strategy, performance) each adversarially verified, then merged
and critiqued for completeness. Refuted findings dropped, severities corrected, duplicates collapsed,
two actively harmful recommendations struck.

Supersedes `docs/technical/seo-implementation-plan.md` (an older audit describing a pre-SSR state —
most of its Phase 1–2 has since shipped).

---

## TL;DR

The site has only been **genuinely crawlable for about eight weeks**, and the evidence says its
pages are **probably not in Google's index yet** — not ranked low, absent. Layered on top of that
are three real bugs and a content base too small to rank for anything competitive.

Do the six edits in **Gate 0** this week. Then look at Search Console before touching anything else —
the indexing verdict decides whether the rest of this document is the right work at all.

---

## Calibration: how long has this state existed?

Every finding below is an audit of a *snapshot*. The snapshot is new. From git:

| Date | Event |
|---|---|
| 2025-07-29 | `vercel.json` first added — site goes live |
| 2026-02-27 | `robots.txt` added |
| 2026-04-08 | SSR + dynamic sitemap code added (`src/server.ts`) |
| 2026-04-14 | The four guides committed (`a9a47c4`) — the only content commit |
| **2026-05-27** | **`fix: deploy Angular SSR server function on Vercel`** |

Before that last commit, `vercel.json` was literally `{"framework": "angular"}` — no `rewrites`,
no `functions`, and `api/index.mjs` did not exist. Consequences nobody had stated:

- `/bucuresti` and every `/issue/:id` are `RenderMode.Server`. With no server function deployed,
  **nothing rendered them.**
- `/sitemap.xml` is generated inside `src/server.ts`. Between 2026-04-08 and 2026-05-27 it
  **did not exist at all.**

So the crawl history is: ~7 months as a CSR-only shell with no robots.txt and no sitemap → ~7 weeks
with SSR in code but no function deployed → **~8 weeks of actually working server-rendered HTML.**

A one-year-old domain that spent ten of twelve months teaching Googlebot that every URL is an empty
JS shell, with 14 sitemap URLs and no referring domains, being unfindable at week eight is the
**expected** outcome — not a symptom of the defect list. Most findings below are real defects that
are nonetheless *not* the binding constraint.

---

## Is the site even indexed?

This is the question that was actually asked, and it is answerable without Search Console.

**The test:** exact-phrase search a page's own unique title. Any indexed page wins its own verbatim
45-character title at #1, regardless of authority.

| Query | civiti.ro in results |
|---|---|
| `"Cum să scrii o petiție care nu va fi respinsă"` | **zero** — europarl, legestart, anfp.gov.ro, jandarmeriaalba PDF, petitieonline |
| `"Dreptul tău la informații publice: Legea 544/2001"` | **zero** — lege5, cdep, edu.ro, ghidullegal |

Two flagship guides, live for 3.5 months, prerendered, footer-linked sitewide, fail to surface for
their own exact titles. **That is not a ranking outcome. That is absence from the index.**

> One audit reached the opposite conclusion — "the guide loses on authority and depth, not on crawl
> discovery." That is structurally wrong: no page loses its own unique title on authority. The error
> propagated through the bundle and is why the raw findings read as ranking-optimization when the
> problem is indexation.

**Correcting a premise this investigation started from.** The initial brief assumed Google had
indexed the root as *"Civiti: Selectează Localitatea"*. It has not. Searching a string that exists
only in `/location`'s body returns `https://www.civiti.ro/` titled **"Civiti — Participare Civică"** —
the static `<title>` from `src/index.html:5`.

What that actually reveals: **Google is matching `/location`'s body text against the root URL while
displaying the root's title.** Googlebot rendered the JS, followed the client-side redirect, and
merged the two URLs. Two consequences:

1. `/location` is not separately indexed. The root is indexed with content it does not serve.
2. The empty homepage is **less catastrophic than a raw curl suggests** — Google's second-pass
   rendering does eventually reach the content. But second-pass rendering is deferred, rationed, and
   unreliable for a low-authority domain, and it means the indexed title is your generic brand string,
   not any route title. Retitling `/location`'s route (`app.routes.ts:140`) changes nothing for the
   URL Google actually holds; `src/index.html:5` is the title that matters today.

**Ruled out — no bot blocking or cloaking.** Vercel bot management / Attack Challenge Mode can
silently serve crawlers a challenge, which would produce exactly this symptom and be invisible to a
browser-UA check. Tested Googlebot UA vs Chrome UA on `/`, `/ghid/cum-sa-scrii-o-petitie`,
`/sitemap.xml`, `/robots.txt`: identical status codes, byte-for-byte identical sizes
(200/34264, 200/70039, 200/2486, 200/303), `x-vercel-cache: HIT`, no mitigation headers. Clean.
Do not re-investigate this.

**Not determinable from here:** domain registration date and prior ownership (`whois` unavailable in
this environment; rotld.ro's form is not fetchable). If `civiti.ro` predates 2025 significantly,
check archive.org for prior content before assuming the domain is clean. Run `whois civiti.ro` locally —
30 seconds.

---

## The two real problems

### Problem 1 — there is almost nothing to rank for

The whole domain holds roughly **2,600 words of unique editorial content across 6 content URLs** —
four guides (428 / 484 / 561 / 618 words), `/ghid`, `/despre` — plus 8 user-generated issue pages
averaging ~150 unique words. The sitemap lists 14 URLs. There has been one content commit, in April.

Meanwhile four direct competitors already occupy the space:

| Competitor | Footprint | Threat |
|---|---|---|
| **civia.ro** | 154 live sesizări, AI-drafted complaints citing OG 27/2002, petitions, protests, 544/2001 requests, "Promisometru", primării ranking. Advertises **all 42 counties** | Near-collision on the brand name; deeper footprint absorbs the ambiguity |
| **vremschimbare.ro** | Page 1 for `model sesizare primarie`; per-sector authority contacts broken out by issue type | **Already occupies the wedge** — and targets illegal sidewalk parking, which is 5 of your 7 live reports |
| **bucuresti.help** | 17 URLs, 7 practical posts, `/map`, `/puncte-civice`, `/in-presa` | Page 1 for `groapa in asfalt Bucuresti cine repara` with ~400 words and **zero authority contacts** |
| **statulroman.ro** | Civic reporting + voting | Adjacent |

And nothing in the route data targets what Romanians type. The titles are `Selectează Localitatea`,
`Ghid Civic`, `Probleme Civice în București`, `Participare Civică` — interface labels. Not one
contains *sesizare*, *reclamație*, *raportez* or *primărie*. On `/bucuresti`, the money page, the
word **"primărie" appears zero times**.

### Problem 2 — three genuine bugs

**a) The homepage has no prerendered content.** `src/app/app.routes.ts:7-11` declares
`{ path: '', redirectTo: '/location', pathMatch: 'full' }`. A route carrying `redirectTo` cannot be
prerendered, so the build emits **no `dist/Civica/browser/index.html`** — only `index.csr.html`.
The manifest records it verbatim:

```js
// dist/Civica/server/angular-app-manifest.mjs
{ "renderMode": 2, "redirectTo": "/location", "route": "/" }
```

`diff live/root.html dist/Civica/browser/index.csr.html` differs on exactly one line (the hashed
`main-*.js` name). And because **Vercel's filesystem check runs before the `vercel.json` rewrite**,
the static shell wins and `api/index.mjs` is never invoked for `/` — the manifest's own 302 is dead
code in production. Only `<h1>` is `Loading Civiti...` (`src/index.html:63`) on a `lang="ro"`
document; 555 of 627 visible characters are the cookie banner.

**b) Every issue page declares a canonical on a host that does not exist.** Verified live:

```html
<link rel="canonical" href="http://localhost:4200/issue/4ca65c7b-0b0d-4d72-b357-cdb0f9ee5e3b">
<meta property="og:url" content="http://localhost:4200/issue/4ca65c7b-...">
```

…while `sitemap.xml` submits the same page as `https://civiti.ro/issue/...`. That is 8 of 14 sitemap
URLs contradicting their own canonical — the textbook trigger for *"Duplicate, Google chose a
different canonical."* No other page has a canonical at all.

**c) Nothing on the site links to an issue page.** `grep -o 'href="/issue/[^"]*"'` across all seven
live captures → **zero hits**. The cards are `<nz-card (click)=...>` divs. Googlebot does not click.
The entire long-tail layer is sitemap-only orphans, depending on the sitemap whose canonical they
contradict.

### The honest summary

Fix (a), (b), (c) and you have a technically sound 14-URL site with no backlinks — which still will
not rank for anything competitive. Ship 25 content pages and earn 10 referring domains without
fixing them and you rank slowly and unevenly, with your best pages repeatedly excluded.

Do the technical fixes because they cost a week. Understand that content and authority is what
actually moves you. **Nothing meaningful before ~90 days.**

---

## Gate 0 — this week, hours not days

Six edits. Everything here plausibly moves *indexation*. Nothing else in this document does.

### 0.1 Verify Google Search Console — do this first, today

`grep -rn 'google-site-verification|msvalidate' src/ public/ *.json` → zero, and no `google*.html`
in `public/`. Statlark is used instead of GA/GTM, so neither auto-verification path exists.
*(Caveat: DNS verification leaves no repo trace. The repo proves "no repo-based verification,"
not "no property." Skip if you already have one.)*

Verify a **Domain property via DNS TXT** at the .ro registrar — it covers apex + www + http/https in
one, which is exactly this site's ambiguity. Fallback: `<meta name="google-site-verification">` in
`src/index.html` head, which is the static shell behind all three render modes and so survives even
on the empty `/`.

Then **run URL Inspection on `/ghid/cum-sa-scrii-o-petitie`, `/bucuresti`, `/despre` and one
`/issue/:id`.** The "Page indexing" verdict decides the plan:

- **"Discovered / Crawled – currently not indexed"** → the correct next action is manual *Request
  Indexing* on ~10 URLs plus sitemap resubmission. Schema, breadcrumbs, ItemList and CWV are all
  downstream of a problem they do not touch.
- **Indexed but not ranking** → proceed to Gate 1 as written.

Also add **Bing Webmaster Tools** (2 minutes, free) — it exposes an IndexNow key so new sesizări can
be pushed to Bing/ChatGPT-search instantly.

### 0.2 Kill the localhost canonical — one line

`src/app/components/issue-detail/issue-detail.component.ts:230`:

```ts
const baseUrl = environment.production ? 'https://civiti.ro' : 'http://localhost:4200';
```

**Deterministic, not environment-dependent.** `scripts/inject-env-vars.js:62` writes the literal
`production: false,` into the generated `src/environments/environment.ts` (verified: line 5 reads
`production: false`). Line 27 computes the real value and discards it — it only feeds
`environment.prod.ts`, which is **never loaded**, because `angular.json` has no `fileReplacements`
key. So `environment.production` is `false` in every build, forever.
`grep -rn 'environment.production' src/` → exactly one hit, this line.

Fix: `src/server.ts:25` already hardcodes `const SITE_URL = 'https://civiti.ro'`. Hoist it into
`src/app/constants/urls.ts` (which already holds `APP_STORE_URL`/`GITHUB_URL`) and import in both
places. Then delete the dead `environment.prod.ts`, or fix `inject-env-vars.js:62` to emit the
computed value.

Verify: `curl -s https://civiti.ro/issue/<id> | grep -E 'canonical|og:url'`.

> **Severity note:** three agents rated this critical (deindexation expected); one verifier
> downgraded to high — Google often ignores an uncrawlable canonical and self-canonicalises, so
> deindexation is a risk rather than a certainty. The *guaranteed* damage is narrower: broken
> Facebook/WhatsApp unfurls on every shared sesizare, plus GSC canonical noise. GSC's
> "Google-selected canonical" field settles it in two weeks. Fix it either way — it is one line.

### 0.3 Rewrite the sitemap — 15 lines, one file

`src/server.ts:108-115` hardcodes six static entries. Two are un-indexable; five of the best pages
are absent.

| In sitemap today | Status |
|---|---|
| `/` priority 1.0 | 96-word CSR shell |
| `/location` 0.9 | 44 words of unique copy |
| `/issues` 0.9 daily | **302 redirect** (`app.routes.ts:146-147` → `/bucuresti`) |
| `/despre`, `/privacy`, `/terms` | fine |
| **Absent** | `/bucuresti` (543 words, the hub), `/ghid` (293), all four `/ghid/:slug` — `cum-sa-scrii-o-petitie` alone is 773 words / 12 headings, the densest Romanian content on the domain |

`src/app/app.routes.server.ts:2` already imports `GUIDE_ARTICLES` from `./generated/guide-data` — do
the same in `src/server.ts`. Drop `/issues`, add `/bucuresti` and `/ghid` and the four guides.
Drop `<priority>` and `<changefreq>` (Google ignores both); emit `<lastmod>` instead.

**Same file, same commit — the sitemap fails open.** `src/server.ts:147-158`, on backend timeout:

```ts
const xml = buildSitemapXml([]);
res.setHeader('Cache-Control', 'public, s-maxage=300, ...');
res.status(200).send(xml);   // ← authoritatively asserts the 8 issue URLs are gone
```

Return **503**. Google retries a 5xx and leaves the submitted URL set intact; a 200 with a truncated
document says the pages were removed — and the 300 s `s-maxage` pins that lie at the edge.

### 0.4 Make issue cards real links, and give issue pages a footer

**Inbound — zero.** `src/app/components/issues-list/issues-list.component.html:163-164`:

```html
<nz-card class="issue-card cursor-pointer" (click)="viewIssueDetails(issue.id)"
```

**Outbound — two.** `app.routes.ts:193-200` omits `showFooter: true`, which every other public route
sets (`:137, :154, :172, :187, :206, :216, :228`); `app.ts:35-37` gates the footer on it.
`live/issue.html` has exactly two internal anchors: `/ghid` (header) and `/privacy` (cookie banner).

```html
<a [routerLink]="['/issue', issue.id]" class="issue-card-link">
  <nz-card class="issue-card" [nzCover]="coverTemplate"> … </nz-card>
</a>
```

`routerLink` on an `<a>` emits a real `href` under SSR — proven by the header's own
`<a routerlink="/ghid" href="/ghid">` in the live captures. Drop the `(click)` and the duplicate at
`:236-239`. Style with `display:block; color:inherit; text-decoration:none` in the component SCSS
(no inline styles). Add `showFooter: true` to the `issue/:id` route.

While in that template: issue titles render as `<div class="ant-card-meta-title">` via `[nzTitle]` —
no heading, no anchor text. Render as `<h2><a [routerLink]=...>{{ issue.title }}</a></h2>`.

This roughly doubles the value of 0.3.

> *Refuted:* one audit claimed a sitewide logo link into `/`. The `href="/"` on every page is
> `<base href="/">`. There is no `<a href="/">` anywhere — `/` is one of the *least*-linked URLs on
> the site.

### 0.5 Fix `/issues/<id>` — every email you send authorities contains a broken link

`src/app/components/issue-detail/email-modal.component.ts:194`, inside the composed petition body:

```ts
${photosSection}Documentație completă: https://civiti.ro/issues/${this.issue.id}
```

Plural `/issues/`. No route matches — `app.routes.ts:146-149` uses `pathMatch: 'full'`, so
`/issues/<uuid>` falls through to `{ path: '**', redirectTo: '/location' }`. **Every primărie, ADP
and Poliție Locală that clicks the link in your petition lands on a two-dropdown city picker.**

Emails to authorities are the single most likely path by which a civil servant or journalist
encounters a Civiti URL — the closest thing this project has to an organic citation source.

Three more call sites use the same plural stub:
- `src/app/store/issues/issue.effects.ts:120` — `navigate(['/issues', response.id])` right after
  `createIssue` succeeds. **The author of a brand-new sesizare is dumped on `/location` and never
  sees the page they just created.**
- `issue-detail.component.ts:213`, `:471`, `admin-dashboard.component.ts:79` — extra 302 hop.

Use `/issue/${id}` singular everywhere with the shared `SITE_URL`. Keep the `app.routes.ts:146-149`
redirect stub for links already in the wild.

**Then check the backend.** The comment at `email-modal.component.ts:192` says this block *"mirrors
the backend scaffold"* — the frontend string is the *fallback*; the .NET
`AssemblePetitionBody` / `ClaudeEnhancementService` composes the body users actually send.
**`grep civiti.ro/issues` in the civiti-server repo.** This is the highest-value unrun check in the
whole investigation — every petition Civiti has ever sent may carry a dead link, and the frontend
fix does not touch it.

### 0.6 Give `/` a real page

The redirect route cannot be fixed in `app.routes.server.ts` — the artifact is decided at build time
and Vercel's static layer serves whatever the build emitted.

1. Create `src/app/components/home/home.component.{ts,html,scss}`. 600–800 words of Romanian: what a
   sesizare is, how the email campaign works, the 30-day deadline under OG 27/2002 art. 8, which
   Bucharest authorities get emailed, the city picker, a latest-issues teaser linking `/bucuresti`,
   links to all four guides.
2. Replace `app.routes.ts:7-11` with a real `loadComponent` route. Keep `RenderMode.Prerender` at
   `app.routes.server.ts:6` — once `''` has a component the extractor drops `redirectTo` and the
   build emits `dist/Civica/browser/index.html`.
3. **301 `/location` → `/` in `vercel.json`, not `src/server.ts`.** Vercel applies
   `redirects` → filesystem → `rewrites`, and `dist/Civica/browser/location/index.html` is a real
   file, so an express redirect works locally and does nothing in production:
   ```json
   { "source": "/location", "destination": "/", "permanent": true }
   ```
   Also remove `{ path: 'location', renderMode: RenderMode.Prerender }` from
   `app.routes.server.ts:7` so the stale file stops being emitted.
4. **Free regression test:** after `ng build`, assert `dist/Civica/browser/index.html` exists.
   Its absence is the exact signature of this bug.

Verify: `curl -sI https://civiti.ro/location` must return 301.

---

## Gate 1 — only after Gate 0 shows pages entering the index

### 1.1 Rewrite every title and meta description

The highest keyword-relevance-per-minute item in the report. Character counts verified.

| URL | Now | Proposed (chars) |
|---|---|---|
| `/` | `Civiti — Participare Civică` | `Sesizări către primărie, online și gratuit \| Civiti` (51) |
| `/bucuresti` | `Probleme Civice în București` | `Sesizări București: probleme raportate de cetățeni` (50) |
| `/ghid` | `Ghid Civic` | `Ghid: cum faci o sesizare sau o petiție în România` (50) |
| `/ghid/cum-sa-scrii-o-petitie` | *already good* | `Cum scrii o petiție care nu e respinsă + model` (46) |
| `/ghid/cum-sa-raportezi-o-problema` | `…pe Civiti` | `Cum raportezi o problemă la primărie: ghid pas cu pas` (53) |
| `/ghid/drepturile-cetateanului` | `Dreptul tău la informații publice` | `Legea 544/2001: cum ceri informații publice` (43) |

Descriptions (≤157 chars):

- `/bucuresti` — *"Gropi, trotuare blocate, gunoi și iluminat defect în București. Vezi sesizările
  active pe sectoare și trimite un email către Primăria Sectorului responsabil."*
- `/ghid` — *"Ghiduri gratuite despre petiții, sesizări și dreptul la informații publice:
  OG 27/2002, Legea 544/2001, termene legale și modele gata de trimis."*
- `/ghid/cum-sa-scrii-o-petitie` — *"Ce trebuie să conțină o petiție conform OG 27/2002, termenul
  legal de 30 de zile, greșelile care duc la clasare și un model gata de completat."*

`seo.service.ts:27-29` appends `| Civiti` unconditionally (9 chars) — make it conditional, skipped
when `config.title.length > 45`. Do **not** truncate issue-page titles: the raw user string carries
the only unique long-tail terms on the site ("Blocul V6", "Calea 13 Septembrie"). Append a suffix
instead: `${issue.title} — sesizare în București`.

*(Diacritics: Google folds them for Romanian. "ilegala" vs "ilegală" is not a barrier.)*

### 1.2 Self-referencing canonical, derived from the router

`seo.service.ts:54` calls `updateCanonicalUrl(config.ogUrl)` and `:70-78` no-ops when undefined.
**No route passes `ogUrl`** — all six `data.seo` blocks carry only `title`/`description`, and
`/ghid/:slug` and `/issue/:id` have no `seo` key at all. Canonical exists on exactly one page of
seven, and it is the broken one.

```ts
private readonly router = inject(Router);

private selfUrl(): string {
  const path = this.router.url.split(/[?#]/)[0];          // strips ?page= &view=harta &utm_*
  return `${SITE_URL}${path === '/' ? '/' : path.replace(/\/+$/, '')}`;
}
```

Use as the fallback for both `og:url` and canonical, and in `resetToDefaults()` **instead of**
`removeCanonicalUrl()`. Add `this.meta.updateTag({ name: 'robots', content: 'index, follow' })` to
`resetToDefaults()` before you ever ship a `noindex` route — otherwise a per-route `noindex` leaks to
every page visited afterwards in the same SPA session.

Caveat: `app.ts:61` calls `updateRouteConfig()` from the constructor, before any `NavigationEnd` —
`selfUrl()` must tolerate that.

Fixes for free: `/bucuresti?page=2&view=harta&category=…` (six params written back via
`queryParamsHandling: 'merge'` at `issues-list.component.ts:303-307, :332-338, :476-486`) and every
UTM/fbclid variant. **The www/apex split is live in the index right now** (Google holds the `www`
host), which makes this worth more than the "stale artifact" framing one verifier gave it.

### 1.3 Real 404s, and stop serving the hub at issue URLs

| Path | Today | Severity |
|---|---|---|
| `/anything-unknown` | 302 → `/location` (`app.routes.ts:245-248`) | medium |
| `/ghid/<garbage>` | **200** with `/ghid` listing markup — `PrerenderFallback.Server` is the default and `guide-detail.component.ts:41-44` does a runtime `router.navigate`, which never changes the HTTP status | low — nothing generates these |
| `/issue/<archived-or-non-public-id>` | **200 with the entire `/bucuresti` hub in the body** — `issue-detail.component.ts:211-215` navigates to `/issues` → `/bucuresti`, and the in-process navigation completes inside the SSR render | **medium — these URLs are real and already submitted** |

The third manufactures duplicate copies of the hub at arbitrary URLs. `src/server.ts:75` filters the
sitemap to `status=Active,Resolved`, so an issue leaving those statuses vanishes from the sitemap
while its indexed URL keeps returning 200 with hub content.

- `{ path: '**' }` → a real `NotFoundComponent` with `data.seo.robots: 'noindex, follow'`, and
  `{ path: '**', renderMode: RenderMode.Server, status: 404 }` in `app.routes.server.ts:37`.
  *(`status` is **not** ignored on `RenderMode.Client` — `ssr.mjs:1899` builds `responseInit` before
  the branch. `Server` is still better: you get a rendered Romanian body.)*
- `ghid/:slug` → add `fallback: PrerenderFallback.None` so unknown slugs reach the wildcard.
- `/issue/:id` → `inject(RESPONSE_INIT, { optional: true })` (provided for `RenderMode.Server` at
  `ssr.mjs:1916`), set `status = 404` when the load fails or `isPubliclyViewableStatus()` is false,
  and render an `@else` not-found block instead of navigating away. Same change fixes the SSR-timeout
  case where a slow Railway backend renders an empty body at 200 (`issue.effects.ts:14, :31, :41`).

**Unverified — one curl settles it:** whether a *pending/rejected* issue's SEO subscription
(`issue-detail.component.ts:218-238`, which has no status condition) wins the race against the
redirect and leaks a withheld title into a 200.
`curl -sI https://civiti.ro/issue/<pending-id>` and grep the `<title>`.

### 1.4 Turn `/bucuresti` into an actual city page

`city-hub.component.html` is literally one line: `<app-issues-list />`. The only `<h1>` is
`issues-list.component.html:8`:

```html
<h1 class="sr-only">Probleme Active</h1>
```

Visually clipped by the inlined critical CSS. The `<h2>` is a live counter (`7 probleme documentate`).
Zero headings contain "București". Body occurrences of "primărie": **0**. "sesizare": **1**.

*(Correction: the page is not city-signal-free — `<title>` contains "București" and the string appears
9× in issue-card addresses. The gap is zero editorial copy.)*

Move the H1 into `city-hub.component.html` so it can be city-specific —
`<h1>Sesizări și probleme raportate în București</h1>` — demote the list heading to H2, and add
200–300 words above the list: who is responsible for what (PMB vs Primăriile Sectoarelor 1-6 vs ADP
vs Administrația Străzilor vs Poliția Locală vs ASPA), the common Romanian categories (gropi în
asfalt, trotuare blocate, gunoi necolectat, iluminat public defect, câini fără stăpân), and how the
email campaign works. Half of this text already exists in
`src/content/guides/cum-sa-raportezi-o-problema.md`. Give the component a `city` input so a second
city reuses it.

### 1.5 Structured data — three blocks worth having

Current state: **one** `application/ld+json` on the entire site, an `AboutPage` on `/despre`
(`despre.component.ts:29-53`). Zero elsewhere. *(That one block has never been run through Google's
Rich Results Test — validate the base before building on it.)*

**a) Organization + WebSite, statically in `src/index.html`.** Not in a component: `index.html` backs
all three render modes, costs zero runtime, and covers the currently-empty `/`.

```json
{"@context":"https://schema.org","@graph":[
 {"@type":"Organization","@id":"https://civiti.ro/#organization","name":"Civiti",
  "alternateName":"Civiti România",
  "url":"https://civiti.ro","logo":{"@type":"ImageObject","url":"https://civiti.ro/images/logo/civiti-og-image.png","width":1200,"height":630},
  "knowsLanguage":"ro","areaServed":{"@type":"City","name":"București"},
  "sameAs":["https://github.com/civiti","https://apps.apple.com/ro/app/civiti/id6760908767"]},
 {"@type":"WebSite","@id":"https://civiti.ro/#website","url":"https://civiti.ro",
  "name":"Civiti","inLanguage":"ro-RO","publisher":{"@id":"https://civiti.ro/#organization"}}]}
```

Type is `Organization`, **not `NGO`** — `despre.component.html:36` says *"proiect independent …
construit de o persoană"*; claiming NGO is a false entity assertion. `github.com/civiti` is verified
(`git remote -v`). **No `SearchAction`** — Google deprecated the sitelinks searchbox in Nov 2024 and
there is no `?q=` route anyway. `alternateName` matters — see the brand-collision section.

**b) `Article` on the four guides.** `guide-detail.component.ts:46-49` passes only title+description.
Every needed field already exists on `GuideArticle` (`slug`, `title`, `description`, `category`,
`publishedAt`, `readingTime`, `image`). Add `author`/`publisher` as `{"@id":"…#organization"}`,
`datePublished`, `inLanguage: "ro-RO"`, absolute `image`, `mainEntityOfPage`. In the same edit set
`ogType: 'article'` and `ogImage: SITE_URL + article.image` — all four PNGs exist in `public/guides/`
and are currently unused (guide detail renders **zero** `<img>`), so every guide shares one generic
social card.

**c) `BreadcrumbList` — only on the 5 pages with a visible trail.** `despre.component.html:3-6` and
`guide-detail.component.html:5-9`. `/issue/:id` and `/bucuresti` have no visible breadcrumb, so
schema there is invisible-only markup. Match the DOM: the guide trail is `Ghid Civic / <categorie>`,
not `Acasă / Ghid Civic / <title>`.

**Mechanism.** Centralise as `SeoService.setStructuredData(nodes)` writing a single tagged `<script>`,
called from `ngOnInit` — proven to reach the prerendered bytes (the `/despre` block sits at byte
~44,237 of the live HTML). **Never from `afterNextRender`/`ngAfterViewInit`/behind
`isPlatformBrowser`** — that produces markup that validates in devtools and is invisible to every
crawler. Clear-before-append so hydration leaves exactly one block.

**Escape before user data flows through it.** `despre.component.ts:52` is
`script.text = JSON.stringify(schema)`. Zero present-day exploitability (that object is 100%
hardcoded literals), but `<script>` is a raw-text element and `JSON.stringify` does not escape `<`.
Land `.replace(/</g,'\\u003c')` plus U+2028/U+2029 **before** wiring any schema carrying
`issue.title` or comment bodies.

> **STRUCK — do not implement.** One audit made *"`author` must become visible… add
> `<span>Raportat de {{ issue.user.name }}</span>`"* a hard prerequisite for issue-page schema,
> justified as "already public elsewhere in the product." **That justification is false** — grepping
> `user.name` / `issue.user` across `issues-list.component.html` and `issue-detail.component.html`
> returns nothing. Reporter names render nowhere. The only name on a live issue page belongs to a
> *comment author*, a different actor who opted into a public reply.
>
> The recommendation is therefore a **new disclosure of the legal identity of a private citizen who
> filed a complaint against a named local authority**, published as machine-readable structured data,
> on a platform whose stated purpose is pressuring those authorities — retroactively applied to all
> existing reporters who filed under a non-disclosing UI. That is a doxxing and retaliation vector
> and a GDPR change of processing purpose, proposed to obtain a rich result a 7-issue pilot probably
> would not receive anyway.
>
> Use `author: {"@id": "https://civiti.ro/#organization"}` with `Article`. If reporter attribution is
> ever wanted, it is a product/consent decision made in signup — never an SEO change.

### 1.6 Cache SSR HTML at the edge

`src/server.ts:175-182` pipes the Angular response through untouched. Measured: `/bucuresti` returns
`cache-control: public, max-age=0, must-revalidate`, `x-vercel-cache: MISS`, `age: 0` on 8
consecutive probes. TTFB `/bucuresti` 0.42–0.78 s, `/issue/:id` **1.03–1.69 s**, vs 0.13–0.19 s for
CDN-served prerendered pages. The file already demonstrates the right pattern at `:142-145` for
`/sitemap.xml` — which returns `x-vercel-cache: HIT`.

```ts
// before the catch-all app.use at :175
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  }
  next();
});
```

**Safe by construction — no auth guard needed.** `supabase-client.service.ts:40-47` sets
`persistSession: isBrowser`, `autoRefreshToken: isBrowser` and a `noopServerStorage` adapter; tokens
live in `localStorage`, never cookies. The server can never see a session — and the live
`/issue/...` HTML proves it, rendering a comment author's public avatar alongside *"Autentifică-te
pentru a adăuga un comentariu."*

Separately, consider `"regions": ["fra1"]` on the `functions` entry in `vercel.json` — the function
runs in `iad1` while all ingress is `fra1`. But **one audit called this a "3-5× TTFB penalty" and
that is wrong**: isolating pure function overhead with a route that hits no backend gives 0.24–0.31 s
vs 0.13–0.17 s CDN — the transatlantic detour costs ~100–150 ms. The rest is Angular SSR render plus
the Railway .NET fetch. **Determine the Railway region first** — if Railway is US-hosted, moving the
function to `fra1` could make it worse. The edge cache is the fix that actually removes the latency.

### 1.7 Cut 5 MB of JPEG off the money page

Seven Supabase thumbnails on `/bucuresti`, measured: **5,051,895 bytes total**, rendered into a
`.relative.h-48` grid — 192 px tall. Source origin 1440×1920. `issues-list.component.html:172-179`
sets no `loading`, `width` or `height`.

The transform recipe matters — two audits got it wrong:

| URL | Bytes |
|---|---|
| `?width=480&quality=70` | 192,942 (webp) |
| `?width=480&quality=70&format=origin` | 220,250 — **`format=origin` forces JPEG, counterproductive** |
| `?width=480&height=288&resize=cover&quality=60` | **24,022** |

Both dimensions plus an explicit resize mode are required. Apply in `getIssueImage()`
(`issues-list.component.ts:342-347`), add `loading="lazy"` + explicit `width`/`height` (keep the
first 2–3 eager). Supabase bills image transformations per origin image beyond plan quota — not free,
but 32× cheaper than what you serve now.

### 1.8 The free one-liners

| Fix | Where | Why |
|---|---|---|
| `<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">` | `src/index.html:9`, replacing the redundant `index, follow` (already the default) | **This — not Article schema — is the lever for large image previews and Discover eligibility.** Absent sitewide on a photo-first product |
| `GUIDE_ARTICLES.slice(0, 4)` | `footer.component.ts:15` | Two of four guides have 2 inbound internal links sitewide |
| Absolute `og:image` | `seo.service.ts:17`, `index.html:17, :24` | Spec requires it; unblocks `Organization.logo` / `Article.image` |
| `<a nz-button [routerLink]="['/bucuresti']">` | `location-selection.component.html:50-59` (currently a form submit) | The only crawlable path into the hub is one footer link |
| `"trailingSlash": false` | `vercel.json` | `/bucuresti/` returns a byte-identical 200 from a **second** US function invocation |
| `Cache-Control: max-age=31536000, immutable` for `/(.*)\.(js\|css\|woff2)` | `vercel.json` headers | Content-hashed assets currently return `max-age=0, must-revalidate` → ~110 conditional requests per repeat visit |
| Delete `src/index.html:41-48` + the `fonts.googleapis.com` preconnect at `:32` | Material Icons/Symbols are 100% dead (`grep -rn 'material' src/` → 2 hits, both in index.html) | 1,020 bytes of dead inlined CSS per document |
| `initGoogleAutocomplete()` → trigger on first `focus`/`input` | `issues-list.component.ts:190-193` (currently `ngOnInit`) | ~206 KB compressed of Maps Places JS on every `/bucuresti` load, bypassing the map's intent gate. *Not a billing issue* — constructing `AutocompleteService` is free, and the `@defer (when isMapView())` gate at `:260` is correctly respected |
| Drop `withPreloading(PreloadAllModules)` | `app.config.ts:46` | 26 lazy routes = **2,576,906 B raw / ~764 KB gzip** eagerly fetched after first paint, including the admin module. `angular.json:53-58`'s `type: initial` budget cannot see any of it |
| `/guides/*.png` → WebP at rendered size | 4 files, 1,021,885 B on `/ghid`; LCP candidate is a 249 KB PNG in a 240 px strip | |

**Flagged separately — `x-robots-tag: none` on every image.** Supabase Storage sets it
unconditionally on both `/object/public/` and `/render/image/public/` — verified live. That is
equivalent to `noindex, nofollow`. **Every photo on the site, and every `og:image` on `/issue/:id`,
is blocked from Google Images.** For a product built on citizens photographing potholes, that closes
a plausible discovery channel. Fix by proxying through your own origin: a `vercel.json` rewrite
`/img/:path*` → the Supabase render endpoint plus a `headers` entry setting `X-Robots-Tag: all`.
Do this **only together with 1.7's transform sizing**, or you proxy 5 MB per page through your domain.

---

## Gate 2 — the actual growth problem

Everything above buys a site that *can* rank. This is what makes it rank.

### Keyword clusters, triaged

**Winnable now** — weak incumbents, thin content, and you hold data they don't:

| Cluster | Incumbent weakness | Your edge |
|---|---|---|
| `groapa in asfalt cine repara / cui reclam` | bucuresti.help ~400 words, **zero contacts** | 37 verified authority records |
| `gunoi neridicat cui reclam Bucuresti` | news articles, not utility | Salubritate S1-S6 |
| `caini fara stapan cui reclam` | protectiaanimalelor.org, avocatoo.ro | ASPA București, Poliția Locală S1 Protecția Animalelor, S5, CJ Ilfov — already in the DB |
| `masina abandonata cui reclam` | thin | per-sector Poliția Locală |
| `ce faci daca primaria nu raspunde in 30 de zile` | legal-portal prose | practical escalation path + template |

**Winnable in 6–12 months** — incumbents are content farms with age and links, not quality:
`model sesizare primarie` (sefo.ro, modelacte.ro — but **vremschimbare.ro is already page 1 here**,
harder than it looks), `cum fac o sesizare la primarie`, `primaria sectorului N sesizari`.

**Do not chase:**
- `petitie online` — petitieonline.com, avaaz.org, campaniamea.declic.ro own it, and it is a
  *different product* (signature collection, not authority email).
- Raw law text (`OG 27/2002`, `Legea 544/2001` verbatim) — cdep.ro, legislatie.just.ro, lege5.ro are
  unbeatable. Target the practical derivative: *"cât durează răspunsul la o petiție"*.
- `reclamatie ANPC` — wrong vertical (consumer protection, not local authorities).

### Content that must exist

**1. Fix the four guides** (2,091 words total; the two petition guides cannibalise each other):

- Merge `petitii-si-sesizari-legale.md` into `cum-sa-scrii-o-petitie.md` → one 1,500+ word canonical
  piece. Both explain OG 27/2002, both cite art. 6 (anonymous → clasare) and art. 8 (30 days), both
  close on the Legea 554/2004 → Avocatul Poporului ladder. **Add a real 301 in `src/server.ts` before
  renaming** — `guide-detail.component.ts:41-44` does a client-side `router.navigate`, which is not a
  redirect.
- Extract the *"Alege autoritatea corectă"* section from `cum-sa-raportezi-o-problema.md` into its own
  guide: *"Cine răspunde de ce în București: primărie de sector vs PMB vs ADP vs Poliția Locală vs
  ASB"*. That is 120 words currently buried in a page titled after your product — and it is precisely
  the query bucuresti.help ranks on.
- Add `lastUpdated` to the frontmatter, `scripts/build-guides.js` and `GuideArticle`; render as
  "Actualizat: …". Wrap dates in `<time datetime>` — `guide-detail.component.html:16` currently prints
  the raw ISO string `2026-04-10` as user-facing text, as do `guide-list.component.html:32` and `:54`.
- The **15-day extension** to the 30-day deadline is missing from every guide. *(Flagged as an
  omission from the artifacts; verify against the statute before publishing.)*
- Add `## Întrebări frecvente` (3–5 Q&A) phrased exactly as people type: *"Cât timp are primăria să
  răspundă la o petiție?"*, *"Ce se întâmplă dacă nu răspunde în 30 de zile?"*, *"Poate fi respinsă o
  petiție anonimă?"*. Extend `build-guides.js` to parse it into `faq: {q,a}[]`.

**2. `/modele` — downloadable templates.** `find public src -iname '*.docx' -o -iname '*.pdf'` →
**nothing**. The SERP for `model sesizare descarca word` is held by template farms *and by bare
institutional files with no page around them* — `insse.ro/cms/files/despre/INS/Model_petitie.doc`,
`romaniacurata.ro/documente/Modelpetitie.doc`, `jandarmeriaalba.ro/Documente/redact_petitie.pdf`.
Unusually beatable for anyone who wraps a template in a real page.

Ship 5–6, each its own indexable page with the template inline as HTML *plus* .docx/.pdf in
`public/modele/`: sesizare către primăria de sector, petiție OG 27/2002, cerere de informații publice
544/2001, plângere prealabilă 554/2004, sesizare câini fără stăpân, sesizare groapă/pagubă auto.
**Gate nothing.** Soft post-download nudge: *"Vrei ca sesizarea ta să ajungă automat la toate
autoritățile responsabile și să fie vizibilă public?"*

This is also the best link bait — Romanian civic NGOs routinely link free document models.

**3. Cadence.** One guide every 10–14 days ≈ 9 URLs/quarter. Target **25–30 indexable editorial URLs
in 90 days.** Do not ship features until the content count is above 25.

### The authority data — publish the jurisdiction, not the inboxes

`list_authorities(city='București')` returns **37 records** (`name`, `email`, `city`; 32 with
`district`). Sector coverage is uneven: S3 = 8, S5 = 7, S2/S4/S6 = 3 each, plus 5 city-wide bodies.

A single page — *"Toate autoritățile din București: cine răspunde de ce (2026)"* — is a few hours of
work and the most citable thing this project can produce. bucuresti.help explains the ADP-vs-ASB
split in prose and publishes no contacts; vremschimbare.ro already publishes a per-sector contact
table, so you win on **completeness and verifiable maintenance** (37 bodies, dated, with live report
counts), not novelty.

> **STRUCK — do not publish the email addresses as plain HTML.** One audit made "listing all 37 with
> emails" the flagship linkable asset. Those inboxes (`office@aspmb.ro`, `sesizari@politialocala4.ro`,
> `relatiipublice@primarie3.ro`, …) are the delivery path **the entire product depends on**.
> Publishing them on a page engineered to attract crawlers is publishing a harvest list. If those
> registratura addresses start receiving scraped spam and tighten filtering — or if a primărie traces
> the harvesting to Civiti — the email campaigns silently stop landing. That is an existential
> failure mode caused by an SEO tactic.
>
> Publish **jurisdiction, scope, deadlines and procedure** — the part that actually earns links and
> the part competitors lack — and route the email through the product as a pre-filled CTA. If an
> address must appear, obfuscate it client-side.

### The pSEO play — sequenced, with guardrails

| Layer | Count | Prerequisite before publishing |
|---|---|---|
| `/bucuresti/sector-N` | 6 | 150–250 hand-written words naming that sector's authorities + its live issue feed |
| `/bucuresti/categorie/:slug` | 6 | same (6 categories from `get_categories`) |
| `/autoritati/:slug` | 37 | **120–200 hand-written words of jurisdiction prose per authority** — what it handles *and what it does not*, with the redirect target (ADP S6 = secondary streets; boulevards → ASB) |

**The API returns only `id`, `name`, `email`, `city`, `district`.** 100% of what makes each page
non-duplicative has to be written by hand. This is a writing project, not a data project. Publish in
waves of 6–8. **`noindex` any authority page with neither a written jurisdiction paragraph nor live
reports** — a page whose only unique content is a name is a doorway page and will be filtered.

**City expansion is lower priority than it looks.** `app.routes.ts:150-163` hardcodes
`path: 'bucuresti'`; `location-selection.component.ts:57-66` hardcodes one county and one city;
`CityHubComponent` takes no input — while `src/app/data/romanian-locations.ts` already holds every
județ and city, unused. Make the route `:citySlug` with a resolver validating against a
`SUPPORTED_CITIES` constant (place it last, before `**`, so it doesn't shadow `/ghid`, `/despre`,
`/issue`). But **civia.ro advertises all 42 counties**, so there is no uncontested beachhead, and a
city hub with zero reports is a thin page. Open a second city only with (a) a hand-written 300-word
"cine răspunde de ce în [oraș]" section and (b) that city's authorities seeded in the backend.

### Brand: "Civiti" is a contested, low-distinctiveness token

Page one for the bare query `civiti` contains none of the site: Wiktionary (Ido plural of *civito*),
Ancestry surname pages, people on LinkedIn/Facebook, an `@civiti` Instagram account **owned by
someone else**, Indonesian granite tiles on Shopee — plus near-miss absorption by **Citavi**
(reference software) and **Civitatis** (a very large travel brand). The site surfaces only for
`civiti.ro` or paired with Romanian civic terms. And `civia` / `civiti` will cross-suggest in
autocomplete, with the competitor holding the deeper footprint.

A brand this weak **cannot be defended by on-page tags**. Entity corroboration has to come from
off-site:

- Claim the exact-match social handles now, before more are taken.
- `alternateName: "Civiti România"` in the Organization node (already in 1.5a) so there is a
  disambiguated string to attach to.
- Do **not** invest in ranking for bare `civiti`. Target `civiti romania` / `civiti sesizari` and
  accept the brand is a modifier query.

### Zero off-site entity presence

`src/app/constants/urls.ts` is the complete external surface: App Store, `github.com/civiti`, a
Revolut donation link. Searching Facebook / Instagram / LinkedIn for Civiti returns only unrelated
Romanian civic orgs. **There is no Civiti Facebook page.**

For a Romanian neighbourhood-level civic product, Facebook groups are the distribution channel *and*
the corroboration signal. `sameAs` with two entries and no social profiles gives Google nothing to
resolve "Civiti" against — which is exactly why the brand collision above is unresolvable on-page.
**Create a Facebook page and one more profile, link them from the footer, add them to `sameAs`.**
That is a 30-minute task with more entity-resolution value than the entire
BreadcrumbList/ItemList/Article schema program.

### The iOS app is currently splitting discovery, not helping it

Nobody had examined it despite `apple-itunes-app` sitting at `src/index.html:27`.

**a) No universal links exist.** `find` for `apple-app-site-association` / `assetlinks.json` returns
nothing; grep for `applinks` across `src/`, `public/` and `vercel.json` returns nothing. civiti.ro and
the app are two unassociated entities — no web→app continuity, no app→web attribution, and none of the
app's usage signals corroborate the domain.

**b) The App Store listing is winning brand queries.** `apps.apple.com/ro/app/civiti/id6760908767`
ranked **above** civiti.ro for `"Civiti" aplicatie sesizari`. Apple's authority beats a one-year-old
.ro with no links, every time. Discovery is split, and the half that wins cannot rank for
`sesizare primarie`.

**c) The smart banner leaks the traffic you do get.** `<meta name="apple-itunes-app">` renders a
full-width App Store banner on iOS Safari — the majority of Romanian mobile organic arrivals. At a
moment when almost nobody arrives, diverting arrivals to a storefront suppresses the engagement the
domain needs.

Fix: (1) serve `/.well-known/apple-app-site-association` as `application/json` with no extension
(needs a `vercel.json` `headers` entry — Vercel will not set the content-type for an extensionless
file) plus the matching `associatedDomains` entitlement in the Expo config, making app and site one
entity so the listing's authority *corroborates* the domain instead of competing with it;
(2) consider removing the `apple-itunes-app` meta until organic traffic is non-trivial — revisit at
~1k/mo organic sessions; (3) App Store URL into `sameAs` (already in 1.5a).

### Zero-budget off-page

You have essentially no referring domains. *(Inferred: civiti.ro surfaced once across a dozen
Romanian-language searches, only for a near-branded query, and as the `www` host. This is an
inference from SERP absence, not a backlink-index measurement.)*

Links are the binding constraint after content volume, and here they are free.

- **Tier 1 — civic-tech / transparency NGOs.** Pitch the jurisdiction table and free .docx templates
  as *a resource they can link*, never as a product launch: Code for Romania / Civic Labs
  (code4.ro, civiclabs.ro — CivicTech911 explicitly assists civic initiatives), CeRe (cere.ong,
  already publishes petition how-tos), România Curată (already hosts a `Modelpetitie.doc` and a
  "Modurile de sesizare a autorităților publice" page), Funky Citizens, Centrul pentru Inovare
  Publică, APADOR-CH.
- **Tier 2 — issue-specific communities.** **Străzi pentru Oameni** (strazipentruoameni.net) already
  maintains a *"Sesizări și Contacte Utile"* page — the single most natural link on the Romanian web
  for Civiti. Plus protectiaanimalelor.org and Asociația IREC for the stray-dog cluster, Grow Up
  Romania (already publishes *"O sesizare se face mai ușor decât crezi"*).
- **Tier 3 — Bucharest local press.** Buletin de București, B365, Sectorul 4 News, breakfix.ro,
  bucuresti.ro. **Pitch a data story, not a launch:** *"am analizat X sesizări trimise către
  primăriile de sector — iată cât durează de fapt răspunsul"*. You will have that dataset; nobody else
  will.
- **Tier 4 — communities and dev surfaces.** r/Romania, r/bucuresti (post results and data, never a
  bare link). Facebook cartier / asociație-de-proprietari groups per sector. GitHub repo topics
  `civic-tech`/`romania`/`open-data` + civiti.ro in the description. StartupCafe / start-up.ro cover
  solo-founder civic projects.

**Do not** buy links, use PBNs, or mass-submit to directories.

**Wikidata: not yet.** One audit said "anyone can create an item." Notability requires serious,
publicly available references *about* the subject. A self-created item for a project with no
independent coverage is a realistic deletion candidate, and a deleted item is worse than none because
it burns the `sameAs` target. Get press coverage first.

**Author identity — your call, not a defect.** A named `Person` in the entity graph is a real E-E-A-T
lever for statutory advice, and *"construit de o persoană"* is a credibility gap. But for a solo
operator running a platform that pressures Romanian local authorities, publishing a real name is a
**personal-safety decision**. `author: {"@id": "…#organization"}` is a legitimate answer.

---

## What not to bother with

**Dead rich-result formats:**

- **FAQPage rich results** — restricted since Aug 2023 to well-known government and health sites.
  `despre.component.html:36` says *"proiect independent … fără apartenență politică"*. You will never
  qualify. Write the FAQ content anyway (People-Also-Ask and AI-answer extraction are real), but note
  in the commit that no rich result is expected so nobody re-litigates it.
- **HowTo markup** — rich results deprecated outright in 2023, every site, every device. Skip.
- **`SearchAction` / sitelinks searchbox** — deprecated Nov 2024, and there is no `?q=` route.

**Reported as broken, actually fine:**

- **Render-blocking Google Fonts.** Refuted. `angular.json` sets `optimization.fonts: true`; the three
  stylesheets are inlined at build time. Zero render-blocking third-party stylesheets in production.
- **Static assets going through the Vercel function.** Refuted. Single-segment `x-vercel-id` +
  `x-vercel-cache: HIT` on `/robots.txt`, `styles-*.css`, `main-*.js` and every prerendered page.
  Only `/bucuresti`, `/issue/*`, `/sitemap.xml` and misses reach the function.
- **`/ghid` has no intro paragraph.** Refuted — `guide-list.component.html:5` has one and it renders.
- **A sitewide logo link into `/`.** Refuted — that `href="/"` is `<base href="/">`.
- **641 KB of NG-ZORRO CSS.** Non-blocking (`media="print" onload`), 91 KB brotli. Tree-shaking is a
  medium refactor for zero ranking effect.
- **3.9 MB of NG-ZORRO icon SVGs in `dist/`.** Never requested — icons render as inline `<svg>` from
  `provideNzIcons`. Deploy bloat, harmless.
- **Self-hosting Fira Sans.** 5 weights, all genuinely used (800 at `styles.scss:117, :125, :364`),
  all `font-display: swap`, CSS inlined. Lowest priority.

**Real but should wait:**

- **UUID → slug URLs.** Weak ranking factor. A 301 layer would break the iOS app's and the MCP tools'
  UUID deep links and needs a per-request backend lookup inside the function. If ever done, keep
  `/issue/:id` resolving 200 alongside the new slug rather than redirecting. Sequence it last.
- **`llms.txt`.** No major AI system has publicly committed to fetching it. A flat 20-line file is a
  lottery ticket; **do not build an `llms-full.txt` generation pipeline.**
- **AI-crawler groups in robots.txt.** Nothing is blocked today (silence = allowed), so adding
  `Allow: /` groups changes crawler behaviour by exactly zero. Footgun: **a named user-agent group
  replaces the `*` group entirely**, so any group added must repeat all six `Disallow` lines or you
  silently open `/admin/`, `/dashboard`, `/my-issues` and `/edit-issue/`. Zero upside, real downside.
- **`<priority>` / `<changefreq>`.** Google ignores both. Delete when touching the sitemap; not worth
  its own commit.
- **Core Web Vitals as a ranking lever.** CWV is tie-breaker-grade. The perf items here earn their
  place as *delivery* fixes (crawl rate, 5 MB pages, real-user experience on the conversion path),
  not ranking levers. **Do not let performance work exceed ~20% of the plan.**
- **Heading-order fixes.** `H1 → H4 → H3` on `/issue/:id` is untidy; Google has repeatedly said
  heading order is not a ranking factor. The `<time>`/`<address>` markup is the part with value.

---

## Measurement

### What to watch, in order

| Signal | Where | What good looks like |
|---|---|---|
| **Page indexing verdict** on 4 sample URLs | GSC → URL Inspection | "Indexed". This is the Gate 0 exit criterion |
| **Sitemap Discovered / Indexed** | GSC → Sitemaps | 19 submitted → 19 indexed. Stuck at "Discovered – currently not indexed" means 0.4 (orphan links) didn't take |
| **"Duplicate, Google chose a different canonical"** on `/issue/*` | GSC → Pages | Zero within ~2–3 weeks of 0.2 |
| **"Soft 404" / "Page with redirect"** | GSC → Pages | Drops as 0.3 + 1.3 land |
| **Google-selected canonical for `/`** | URL Inspection | Becomes `https://civiti.ro/` — apex, not www, not `/location` — after 0.6 |
| **Impressions on non-branded queries** | GSC → Performance, filter out "civiti" | The only number that matters. Currently ~0 |
| **Queries containing `sesizare`, `primărie`, `cui reclam`** | GSC → Performance | First signal that 1.1 + content is working |
| **Referring domains** | GSC → Links | 5–15 by month 6 |
| **Crawl rate + avg response time** | GSC → Settings → Crawl stats | Response time drops sharply after 1.6 |

Ignore rank-tracking tools for the first 90 days. GSC Pages coverage is the diagnostic; positions are
noise.

### Realistic milestones

| Window | Should have happened | Should NOT expect |
|---|---|---|
| **Week 1** | GSC verified, indexing verdict known. Gate 0 shipped. `/` returns real content. Sitemap has 19 URLs. Issue pages have inbound anchors | Any traffic change — Google needs weeks to recrawl |
| **Weeks 2–6** | Sitemap fully indexed. Canonical errors gone. Soft-404s near zero. First non-branded impressions on very specific long-tail (street names, `cui reclam gunoiul sector 5`) | Rankings. Double-digit clicks |
| **Months 2–3** | 25–30 editorial URLs live. Templates published. Jurisdiction table published. 3–5 outreach conversations. First 2–5 referring domains | Page 1 for anything competitive |
| **Months 3–6** | Rankings on hyper-specific queries — `email sesizare primaria sector 3`, `cui reclam gunoiul neridicat sector 5`. Meaningful impression curve. 5–15 referring domains | `model sesizare primarie` |
| **Months 6–12** | Page-1 contention for mid-tail Bucharest terms | National head terms |
| **Months 12–24** | Realistic shot at `model sesizare primarie` — **only** with the templates and 30+ referring domains | — |

Anyone promising faster is wrong. A 14-URL domain with no referring domains, entering a market where
four competitors already have content, does not shortcut the first 90 days.

---

## Open questions — carry these forward

1. **Is anything indexed?** The exact-title test says no. GSC URL Inspection is definitive and gates
   the whole plan.
2. **Does the .NET backend also emit `/issues/<id>`?** `grep civiti.ro/issues` in civiti-server.
   Highest-value unrun check in the investigation.
3. **Does `/issue/<pending-or-rejected-id>` return 200 and leak a withheld title?** One curl.
4. **What region does Railway run in?** Determines whether `regions: ["fra1"]` helps or hurts.
5. **Domain age / prior ownership.** `whois civiti.ro` locally; if it predates 2025, check archive.org.
6. **Severity of the localhost canonical** — critical vs high. GSC's "Google-selected canonical"
   settles it in two weeks. Fix it either way.
7. **Backlink profile** — inferred from SERP absence, never measured with a backlink index.
8. **Is the existing `/despre` `AboutPage` JSON-LD valid?** Never run through the Rich Results Test.
9. **Text-extraction counts differ ~12–15% between agents** (naive regex strippers choke on the
   self-closing `<style/>` inside ant-design inline SVGs). Conclusions unaffected; parser-based
   numbers are the ones quoted here.
