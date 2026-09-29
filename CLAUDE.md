# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Civiti** is a civic engagement platform for Romanian citizens to collectively pressure local authorities through coordinated email campaigns. The frontend is an Angular 19 application with NgRx state management, connected to a .NET backend deployed on Railway.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Build (development)
npx ng build --configuration=development

# Start development server (injects env vars automatically)
npm run start:dev
```

## Architecture

### Tech Stack
- **Frontend**: Angular 19, NgRx (store/effects), NG-ZORRO, Tailwind CSS, SCSS
- **Authentication**: Supabase Auth (Google OAuth + email/password)
- **State Management**: NgRx with effects for async operations
- **Component Library**: NG-ZORRO Ant Design for behaviour (modals, forms, selects, uploads, overlays), re-skinned globally; presentational pieces use the Civiti `c-` primitives

### Key Directories
- `src/app/components/` - Feature components (auth/, user/, issue-creation/, admin/)
- `src/app/services/` - API and authentication services
- `src/app/store/` - NgRx state (auth/, user/, issues/, location/, ui/)
- `src/app/types/civica-api.types.ts` - All API type definitions
- `src/environments/` - Environment configs (auto-generated, don't edit directly)

### State Management Pattern
The app uses NgRx with this structure per feature:
- `*.actions.ts` - Action creators
- `*.effects.ts` - Side effects (API calls)
- `*.reducer.ts` - State reducers
- `*.selectors.ts` - State selectors
- `*.state.ts` - State interface

### Authentication Flow
- `SupabaseAuthService` handles auth with Supabase
- `AuthInterceptor` attaches JWT tokens to API requests
- Progressive auth model: anonymous access for browsing, auth required for creating issues

### API Service
All backend calls go through `ApiService` (`src/app/services/api.service.ts`). Types are defined in `civica-api.types.ts`.

## Critical Rules

### CSS/Styling
- **NEVER use `!important`** - Use higher specificity instead
- **NEVER use inline styles in templates** - All styling must go in the component's SCSS file
- Use CSS custom properties for theming
- Target NG-ZORRO classes alongside custom classes (e.g., `button.auth-button.ant-btn`)

### Design System
The full reference is `docs/design/DESIGN.md`; tokens and the global `c-` primitives live in
`src/styles.scss`, NG-ZORRO compile-time variables in `src/theme.less`.
```scss
// Core colours
--ink-900: #14213D;      // Brand navy: text, headings, dark bands, ink buttons
--signal-500: #FCA311;   // Brand orange: FILL only (CTA buttons, highlights); ink text on it
--signal-text: #9E6200;  // Orange-ish TEXT on light surfaces (AA)
--paper: #F6F4EF;        // App background
--surface: #FFFFFF;      // Cards, inputs
--line: #E6E1D7;         // Hairline borders

// Typography (self-hosted in public/fonts — do not add Google Fonts links)
--font-display: 'Bricolage Grotesque';  // Page/section titles, big numerals
--font-sans: 'Public Sans';             // UI and body
```
- Prefer the global primitives (`c-container`, `c-page-head`, `c-btn`, `c-status`, `c-tag`,
  `c-chip`, `c-card`, `c-stat`, `c-empty`, …) over one-off component styles.
- `nz-button nzType="primary"` renders as the orange signal button; default is outline.
- Status pills: `<span class="c-status" [attr.data-tone]="status | statusTone">`.
- Legacy token names (`--oxford-blue`, `--orange-web`, `--platinum`, …) still resolve as
  aliases; new code uses the new names.

### Romanian Locale
The app uses Romanian locale (`ro`). Component text should be in Romanian.

### Templates
- **Avoid method calls in templates** - They run on every change detection cycle
- Prefer pure pipes for transformations (memoized, only recalculate when inputs change)
- For computed values, use signals or move logic to pipes

### SSR / Hydration
- Routes rendered on the server (`RenderMode.Server`) must not call browser-only APIs — see `app.routes.server.ts` for the render-mode map
- NgRx effects that fire during SSR must include a `timeout()` (5 s) guarded by `isPlatformServer()` so a slow backend doesn't hang the Vercel function
- **nz-button + icon hydration rule**: when an `nz-button` contains both an icon (`<span nz-icon>`) and text, **always wrap the text in an explicit `<span>`**. Without it, NG-ZORRO's `ContentObserver` wraps the text node at runtime, creating a DOM mismatch that triggers an `NG0500` hydration error loop:
  ```html
  <!-- WRONG — causes NG0500 on SSR-hydrated routes -->
  <button nz-button><span nz-icon nzType="mail"></span>Trimite</button>

  <!-- CORRECT -->
  <button nz-button><span nz-icon nzType="mail"></span><span>Trimite</span></button>
  ```

### Angular 19+ Patterns
- **Use `inject()` over constructor injection** - Cleaner, works in functions
- Use standalone components (no NgModules)
- Prefer new control flow: `@if`, `@for`, `@switch`, `@defer` over structural directives
- Use signal-based APIs:
  - `input()` / `input.required()` over `@Input()`
  - `output()` over `@Output()`
  - `viewChild()` / `contentChild()` over `@ViewChild()` / `@ContentChild()`
  - `model()` for two-way binding
- Use `computed()` for derived state instead of getters
- Use `takeUntilDestroyed()` for subscription cleanup
- Use functional guards, resolvers, and interceptors
- Use `provideRouter()` / `provideHttpClient()` over module imports

## Documentation

Consult these docs for detailed specifications:
- `docs/design/ux.md` - User journey specifications
- `docs/design/DESIGN.md` - Design system: tokens, type, primitives, patterns (current)
- `docs/design/Colour-Scheme.md`, `docs/design/Typography-Guide.md` - Superseded by DESIGN.md

## Environment Variables

Environment files are auto-generated. Configure these in Vercel/Railway:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key
- `API_URL` - Backend API URL
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
