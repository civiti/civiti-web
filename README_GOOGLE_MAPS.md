# Google Maps Setup

## Local Development

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. In `src/index.html`, replace `YOUR_DEVELOPMENT_API_KEY` with your actual API key:
   ```javascript
   key: "YOUR_ACTUAL_API_KEY_HERE",
   ```
3. Start the development server: `npm start`

**Important**: Don't commit your API key! The placeholder should remain in the committed file.

## Production (Vercel)

1. In your Vercel dashboard, add an environment variable:
   - Name: `VITE_GOOGLE_MAPS_API_KEY`
   - Value: Your Google Maps API key

2. The build script will automatically inject the API key during deployment

## How It Works

- **Local**: You manually set the API key in index.html (not committed)
- **Production**: The build script replaces the placeholder with the environment variable
- **No complex configuration files needed!**

This approach:
- ✅ Keeps API keys out of the repository
- ✅ Works with Angular Google Maps v19
- ✅ Simple to understand and maintain
- ✅ No need to update scripts for new environment variables