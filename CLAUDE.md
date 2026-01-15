# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Civiti** is a civic engagement platform for Romanian citizens to collectively pressure local authorities through coordinated email campaigns. The frontend is an Angular 19 application with NgRx state management, connected to a .NET backend deployed on Railway.

**Backend API**: `https://civiti-server-production.up.railway.app`

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (injects env vars automatically)
npm run start:dev

# Start server (requires manual env setup)
npm start

# Build for production
npm run build

# Run tests
npm test

# Run single test file
ng test --include=**/path-to-spec.ts
```

## Architecture

### Tech Stack
- **Frontend**: Angular 19, NgRx (store/effects), NG-ZORRO, Tailwind CSS, SCSS
- **Authentication**: Supabase Auth (Google OAuth + email/password)
- **State Management**: NgRx with effects for async operations
- **Component Library**: NG-ZORRO Ant Design exclusively

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
- Use CSS custom properties for theming
- Target NG-ZORRO classes alongside custom classes (e.g., `button.auth-button.ant-btn`)

### Design System
```scss
// Mandatory colors
--oxford-blue: #14213D;  // Headers, navigation
--orange-web: #FCA311;   // CTAs, urgency
--platinum: #E5E5E5;     // Backgrounds
--white: #FFFFFF;        // Cards

// Typography
font-family: "Fira Sans", sans-serif;
// Weights: 400 (body), 500 (nav), 600 (headers), 700 (h1)
```

### Romanian Locale
The app uses Romanian locale (`ro`). Component text should be in Romanian.

## Documentation

Consult these docs for detailed specifications:
- `docs/project/Implementation.md` - Implementation standards and backend architecture
- `docs/design/ux.md` - User journey specifications
- `docs/design/Colour-Scheme.md` - Color palette
- `docs/design/Typography-Guide.md` - Typography standards

## Environment Variables

Environment files are auto-generated. Configure these in Vercel/Railway:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key
- `API_URL` - Backend API URL
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
