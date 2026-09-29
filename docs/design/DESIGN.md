# Civiti design system

The reference for how Civiti looks and behaves. Code lives in `src/styles.scss` (tokens,
primitives, NG-ZORRO re-skin) and `src/theme.less` (NG-ZORRO compile-time variables). This
document explains the intent; the SCSS is the source of truth for values.

## The idea: a public case file

Civiti turns a private complaint into a public, collective case with a legal clock on it. The
interface should feel like a trustworthy civic instrument — calm paper surfaces, confident ink,
and one signal colour reserved for the action that creates pressure (sending the email,
reporting a problem). Numbers are the story: emails sent, votes, days open, 30 days to answer.

Principles:

1. **Utility first.** Every screen answers "what is this, what state is it in, what can I do".
   The primary action is always visible and always the orange one.
2. **One signal.** Orange (`--signal-500`) marks the single most important action per view. If
   two things are orange, one of them is wrong.
3. **Hairlines over shadows.** Structure comes from 1px `--line` borders on `--surface` cards over
   `--paper`. Shadows are for things that float: menus, modals, toasts, the hero shot.
4. **Calm motion.** 120–180 ms colour/border/shadow transitions. No bounces, no entrance
   animations on content, no `translateY` hover lifts on dense lists. Respect reduced motion
   (handled globally).
5. **Readable Romanian.** Sentence case everywhere (no ALL-CAPS buttons or labels except the
   tiny `.c-eyebrow`). Diacritics are ș ț with comma below — the fonts support them.

## Colour

| Token | Use |
|---|---|
| `--paper` `#F6F4EF` | App background (warm off-white) |
| `--paper-2`, `--paper-3` | Sunken areas, hover fills, meter tracks |
| `--surface` `#FFF` | Cards, inputs, panels |
| `--line`, `--line-strong` | Hairline borders; input borders |
| `--ink-900` `#14213D` | Brand navy. Headings, body text, dark bands, ink buttons |
| `--ink-600` / `--ink-500` | Secondary / tertiary text (AA on white and paper) |
| `--ink-400` | Placeholders, disabled text, large type only (3:1) |
| `--signal-500` `#FCA311` | Brand orange. **Fill only** — CTA buttons, highlights, dots, meters |
| `--signal-600/700` | Hover/active of the orange fill |
| `--signal-text` `#9E6200` | Orange-ish **text** on light surfaces (AA) |
| `--signal-50/100/200` | Washes and borders for "active" states |
| `--ok-*` | Resolved / success (`-text`, `-fill`, `-wash`, `-line`) |
| `--bad-*` | Rejected / destructive / urgent |
| `--info-*` | Pending review / informational |

Rules: text on `--signal-500` is always ink (`--ink-950`/`--ink-900`, 7.9:1). Never orange text on
white. Status is never conveyed by colour alone — pills always carry a label.

Legacy names (`--oxford-blue`, `--orange-web`, `--platinum`, `--color-*`, `--oxford-blue-80`…)
still resolve (they alias the new tokens) so un-migrated code keeps working. **New code uses the
new names.** When you touch a component, migrate it.

## Type

- **Display** — `--font-display`: *Bricolage Grotesque*. Page titles, section titles, big numbers.
  Via `.c-display` (hero), `.c-h1` (page title), `.c-h2` (section), `.c-num` (numerals).
- **UI / body** — `--font-sans`: *Public Sans*. Everything else. Body 16px/1.55. Controls 15px.
- Weights: 400 body, 500–600 UI, 650 labels/buttons, 700 headings.
- Card titles and in-card headings use `--font-sans` 650–700 (`.c-h3`), not the display face.
- Both fonts are self-hosted in `public/fonts` (declared in `styles.scss`); do not add Google
  Fonts links.

## Space, shape, elevation

- 4px grid: `--space-1` (4px) … `--space-24` (96px). Card padding is `--space-5`/`--space-6`.
- Radii: `--radius-sm` 8 (small controls), `--radius-md` 10 (buttons, inputs), `--radius-lg` 14
  (cards), `--radius-xl` 20 (modals, hero media), `--radius-pill`.
- Shadows: `--shadow-sm` (subtle), `--shadow-md` (hover on interactive cards, sticky bars),
  `--shadow-lg` (menus, modals, floating media). Focus ring: `--ring` or the global
  `:focus-visible` outline.
- Layout: `.c-container` (1200px + fluid gutter), `.c-container--narrow` (760px). Header height
  `--header-h` (64px) — use it for sticky offsets: `top: calc(var(--header-h) + var(--space-6))`.

## Primitives (global, prefix `c-`)

```html
<!-- Page heading -->
<div class="c-page-head">
  <div class="c-page-head__text">
    <p class="c-eyebrow">București</p>
    <h1 class="c-h1">Probleme active</h1>
    <p class="c-lead">One or two sentences of context.</p>
  </div>
  <div class="c-page-head__actions"><!-- buttons --></div>
</div>

<!-- Buttons: tone + size modifiers. nz-button renders identically (see below). -->
<button class="c-btn c-btn--signal">Trimite email</button>   <!-- THE action -->
<button class="c-btn c-btn--ink">Secondary strong</button>
<button class="c-btn">Outline (default)</button>
<button class="c-btn c-btn--ghost">Quiet</button>
<!-- --sm (34px) / default (42px) / --lg (52px), --block, --icon, --on-dark -->

<span class="c-status" [attr.data-tone]="issue.status | statusTone">{{ issue.status | statusText }}</span>
<span class="c-tag">Sector 2</span> <span class="c-tag c-tag--urgent">Urgent</span>
<button class="c-chip" [attr.aria-pressed]="isOn">Filtru</button>

<div class="c-card c-card--pad">…</div>          <!-- also --interactive, --sunken, --dark -->
<div class="c-section-head"><h2 class="c-h3">Title</h2><a class="c-link">Vezi toate</a></div>
<div class="c-stat"><span class="c-stat__value">142</span><span class="c-stat__label">emailuri</span></div>
<div class="c-meter"><div class="c-meter__fill" [style.width.%]="pct"></div></div>
<div class="c-callout c-callout--signal"><span nz-icon nzType="info-circle"></span><p>…</p></div>
<div class="c-empty"><span class="c-empty__icon"><span nz-icon nzType="inbox"></span></span>
  <p class="c-empty__title">Nimic aici</p><p>Explanation.</p></div>
<div class="c-skeleton" style="height:16px"></div>  <!-- loading placeholders -->
```

(`[style.width.%]` is a binding, not an inline style attribute — allowed. Literal `style=""`
attributes in templates are not.)

Also: `.c-prose` (long-form article text), `.c-link`, `.c-muted`, `.c-small`, `.c-lead`,
`.c-divider`, `.c-stack` (vertical rhythm), `.c-sr-only`.

Pipes for status/category presentation: `statusText` (sentence case label), `statusTone`
(`active|resolved|pending|rejected|neutral` for `.c-status`), `categoryLabel`, `categoryIcon`.

## NG-ZORRO

NG-ZORRO stays for behaviour: modals, messages, selects, dropdowns, upload, pagination, forms,
tooltips. It is re-skinned globally, so:

- `nz-button nzType="primary"` = orange signal button with ink text. Default = outline. `nzType="text"`
  = ghost. `nzDanger` = red. Sizes map to 34/42/52px. No uppercase.
- Inputs/selects are 42px, 10px radius, ink focus ring. Dropdown panels are 14px radius with a
  large soft shadow. Modals are 20px radius with a display-font title and a paper footer.
- Prefer our own markup over presentational NZ components: use `.c-card` instead of `nz-card`,
  `.c-status`/`.c-tag` instead of `nz-tag`, `.c-empty` instead of `nz-empty`, CSS grid instead
  of `nz-row`/`nz-col`, `.c-page-head` instead of `nz-page-header`.
- **Hydration rule:** an `nz-button` with an icon must wrap its text in `<span>`.

## Patterns

- **Page:** `<div class="c-container c-page">` → `.c-page-head` → content. Pages with a back row
  (route `showBackButton`) still render their own `h1`.
- **Two-column detail:** main column + a 340–380px sidebar that is `position: sticky` on desktop
  and flows below (or becomes a bottom action bar) on mobile.
- **Forms:** one column, max ~640px, label above field, helper text in `--ink-500` 14px, errors in
  `--bad-text`. Group related fields in a `.c-card c-card--pad` with a `.c-h3` title.
- **Wizards:** a compact progress header (step n of N + labels), one card of content, and a
  sticky footer bar with Back (outline) and Continue (signal).
- **Lists of records:** rows in a single `.c-card` separated by `--line` borders beat a grid of
  heavy cards for scanning. Grids of cards are for visual content (issues with photos, guides).
- **Stats:** `.c-stat` tiles in a responsive grid; big display numerals, small muted label.
- **Empty/loading/error:** always designed. Skeletons for lists, `.c-empty` for zero results,
  `.c-callout--bad` for errors with a retry button.

## Breakpoints

Mobile first. Common breakpoints: 420px (small phones), 640px, 760px, 960px (header folds), 1120px.
Verify at 360px and 1440px minimum. No horizontal scroll at 360px.

## Project rules (from CLAUDE.md, enforced)

- Never `!important`. Use specificity (`body .ant-…`, `button.foo.ant-btn`).
- No literal inline `style=""` in templates. Styles go in the component SCSS.
- Component SCSS budget: warning at 6 kB, error at 10 kB — lean on the global primitives.
- No raw hex in component SCSS — use tokens.
- SSR: public routes are server-rendered/prerendered; no browser APIs during render.
- Angular 19 idioms: standalone, `@if/@for`, `inject()`, signals, pure pipes over template
  method calls in new code.
- Romanian copy, sentence case.
