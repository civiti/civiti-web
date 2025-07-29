# Environment Configuration

This directory contains environment configuration files for the Civica application.

## Setup Instructions

### Local Development

1. Copy `environment.ts.example` to `environment.ts`:
   ```bash
   cp environment.ts.example environment.ts
   ```

2. Replace `YOUR_DEVELOPMENT_API_KEY` with your actual Google Maps API key in `environment.ts`

3. Also update the API key in `src/index.html` by replacing `YOUR_DEVELOPMENT_API_KEY` with your actual key

### Production Deployment (Vercel)

1. The `environment.prod.ts` file is automatically created from `environment.prod.ts.example` during the build process

2. Set the `VITE_GOOGLE_MAPS_API_KEY` environment variable in your Vercel dashboard

3. The build script (`scripts/set-env.js`) will automatically replace the placeholder with your API key

## Important Notes

- Never commit actual API keys to the repository
- The actual environment files (`environment.ts` and `environment.prod.ts`) are git-ignored
- Always use the `.example` files as templates