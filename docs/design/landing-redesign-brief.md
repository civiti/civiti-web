# Brief: redesign the Civiti landing page

## What we want

Redesign `/` — the page every backlink, brand search and shared link lands on. It works, but it
is bland: six stacked blocks of centred text in a single 760px column, no imagery, no rhythm, and
a logo that sits awkwardly in its own box. We want it to feel like a product someone built on
purpose.

**You have real creative freedom on layout, hierarchy, rhythm, density, motion and composition.**
What you may not change is the copy, the destinations, and the brand. Everything below that line
is yours.

## Scope

| | |
|---|---|
| **Own it** | `src/app/components/home/home.component.html` · `.scss` · `.ts` |
| **Extend if needed** | `src/styles.scss` — add new `:root` tokens (see Brand) |
| **May restyle** | `src/app/components/shared/auth-buttons/` — the only chrome above the fold |
| **Read, don't change** | `src/app/app.routes.ts` (route config, SEO metadata), `src/app/components/shared/footer/` |
| **New assets** | Put them in `public/` and reference by absolute path, e.g. `/images/…` |

The route is `''` in `src/app/app.routes.ts:9-22`, with `hideHeader: true` and `showFooter: true`.
There is deliberately **no application header** on this page — the corner auth control and the
footer are the only chrome. If your design wants a header, build it inside `HomeComponent`; do not
flip `hideHeader`, because the global header is styled for the app shell, not for a landing page.

## Hard rules — content

**Every Romanian sentence currently in `home.component.html` must survive verbatim.** The copy is
load-bearing for search: this page ranks on it. You may reorder sections, regroup them, split a
paragraph across a layout, or change which element wraps a sentence. You may not reword, shorten,
translate or replace anything. Adding *new* short microcopy (an eyebrow label, a stat caption, a
button hint) is fine as long as it is Romanian and does not displace existing text.

**The `<h1>` must stay the single H1 on the page with its exact text:**
`Sesizări către primărie, online și gratuit`

**Every destination must still be reachable from the page:**

| Element | Destination |
|---|---|
| Primary CTA (`Vezi problemele din București`) | `enterCity()` → `/bucuresti` |
| Secondary link (`De ce există Civiti →`) | `/despre` |
| Guide links (one per guide, all of them) | `/ghid/:slug` |
| Closing CTA (`Deschide harta sesizărilor…`) | `enterCity()` → `/bucuresti` |
| Corner auth, signed out | `/auth/login`, `/auth/register` |

**Both city CTAs must keep calling `enterCity()`.** It dispatches the NgRx `setLocation` action
before navigating; a bare `routerLink="/bucuresti"` looks identical and silently skips that, which
leaves the city hub without its location state.

**Keep the dynamic bindings.** `{{ defaultCity }}` appears in four places and resolves to
`București` from `DEFAULT_CITY` — do not hardcode the city name. The guide list is
`@for (guide of guides; track guide.slug)` over `GUIDE_ARTICLES`; it must stay a loop, because
guides are generated from markdown at build time and the count will change.

You do not need to touch `<title>` or the meta description — those come from route data and are
already handled.

## Brand

Four colours are fixed. They are the identity and they are documented in
`docs/design/Colour-Scheme.md`:

```
--oxford-blue: #14213D    --orange-web: #FCA311    --platinum: #E5E5E5    --white: #FFFFFF
```

**Use the CSS custom properties, never raw hex in component styles.** `src/styles.scss` already
defines opacity variants (`--oxford-blue-90/80`, `--orange-web-90/20`) and `--gradient-cta`.

**You are encouraged to define new tokens** — tints, shades, surface colours, elevation, spacing,
radii — as long as they derive from the four above and live in the `:root` block of
`src/styles.scss` alongside the existing ones. Name them in the established style
(`--oxford-blue-40`, `--surface-raised`, …).

One token we would genuinely like: **an orange dark enough for text on a light background.**
`--orange-web` on white is roughly 2:1 contrast, which fails WCAG AA for body text, and the page
uses it for a link today. A darker companion for text — with `--orange-web` kept for fills, borders
and large display type — would fix a real problem across the product.

Typography is **Fira Sans**, weights 400 / 500 / 600 / 700, per
`docs/design/Typography-Guide.md`. The scale is tokenised (`--text-xs` … `--text-5xl`).

**The logo needs work and you may redraw it.** `public/images/logo/civiti-logo.svg` is an
auto-traced raster: 19 paths and 17 fills, thirteen of them near-identical navies, with a portrait
`viewBox="320 280 400 450"` that has a non-zero origin. It is currently forced into a 72×72 square
so it never fills its box. Keep the mark recognisable — the megaphone silhouette and the two brand
colours — but a clean redraw is welcome, and we specifically need **a light/reversed variant** so
the logo can sit on a dark surface. Note that this same file is the favicon
(`src/index.html`), so keep a square-safe crop.

## Technical constraints

These are project rules from `CLAUDE.md` and they are enforced in review:

- **Never `!important`.** Use higher specificity.
- **Never inline styles in templates.** Everything goes in the component SCSS.
- **NG-ZORRO (Ant Design) is the component library.** Buttons, avatars, icons, dropdowns come from
  it. Tailwind and SCSS are available for layout.
- **The route is prerendered** (`RenderMode.Prerender`). Everything must render server-side —
  no `window`, `document` or `localStorage` during render. Client-only enhancement is fine behind
  `isPlatformBrowser` or `@defer`, but the content itself must be in the HTML.
- **`nz-button` with an icon must wrap its text in an explicit `<span>`.** Without it NG-ZORRO's
  `ContentObserver` rewrites the DOM after hydration and triggers an `NG0500` error loop:
  ```html
  <button nz-button><span nz-icon nzType="mail"></span><span>Trimite</span></button>
  ```
- **Angular 19 idioms:** standalone components, `@if` / `@for` / `@defer`, `inject()`, signals,
  `input()` / `output()`. Avoid method calls in templates — they re-run on every change detection
  pass; use pipes or computed signals.
- **Romanian locale** throughout.
- One breakpoint exists today at 640px. Add more if the design needs them.

## What is wrong today

Concrete problems worth solving, beyond general polish:

1. **No visual separation between sections.** `.section` uses `border-top: 1px solid var(--platinum)`
   while `body` is also `--platinum`, so the dividers are literally invisible and the six blocks
   read as one undifferentiated run of text.
2. **No imagery at all,** on a product whose entire premise is citizens photographing problems in
   their neighbourhood. If your design calls for photography, say what assets you need rather than
   hotlinking user-uploaded issue photos — using real reports on the landing page is a product
   decision we have not made yet.
3. **Nothing is full-bleed.** Everything is trapped in one 760px column on a flat background, which
   is what makes the page feel unfinished on a wide monitor.
4. **The corner auth control is the entire top of the page** and reads as an afterthought.
5. **No proof.** The platform has real reports, real vote counts and real authorities. The landing
   page shows none of it.

## Done when

- `npx ng build --configuration=production` is green.
- The prerendered `dist/Civica/browser/index.html` still contains the exact H1 text, every
  paragraph of existing copy, and every destination in the table above.
- Any new token pair you introduce for text meets WCAG AA (4.5:1 body, 3:1 large text).
- The page holds up from 360px to 2560px wide.
- No `!important`, no inline styles, no raw hex in component SCSS.
