# Google Maps Integration

This project uses Google Maps to display issue locations on a map.

## Local Development Setup

1. Create a `.env` file in the project root:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

2. Run the development server:
   ```bash
   npm run start:dev
   ```

   This will automatically inject your API key from the `.env` file.

3. **Important**: Before committing, restore the placeholder:
   ```bash
   npm run restore-placeholder
   ```

## Production Setup (Vercel)

1. In your Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `VITE_GOOGLE_MAPS_API_KEY` with your production API key

2. Deploy normally - the build script will automatically inject the API key during the build process.

## How It Works

- The `src/index.html` file contains a placeholder: `YOUR_DEVELOPMENT_API_KEY`
- The `scripts/set-env.js` script replaces this placeholder with the actual API key
- A pre-commit hook prevents accidentally committing API keys
- The `.env` file is gitignored to keep your API key secure

## Security

- Never commit your actual API key to the repository
- The pre-commit hook will block commits if an API key is detected
- Always use the placeholder in committed files