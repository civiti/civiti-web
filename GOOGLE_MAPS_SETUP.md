# Google Maps Setup Guide

## Overview
This project uses Google Maps to display issue locations. The implementation follows security best practices by storing API keys in environment configuration files that are not committed to version control.

## Vercel Deployment
When deploying to Vercel, the Google Maps API key is managed through Vercel's environment variables system.

## Setup Instructions

### 1. Get a Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **API Key**
6. Copy your new API key

### 2. For Local Development
Simply edit `src/environments/environment.ts` and add your API key:
```typescript
export const environment = {
  production: false,
  googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE'  // <-- Replace with your key
};
```

This file is already gitignored, so it's safe to add your key here.

### 3. For Vercel Deployment
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new environment variable:
   - **Name**: `VITE_GOOGLE_MAPS_API_KEY`
   - **Value**: Your Google Maps API key
   - **Environment**: Select Production (and Preview/Development if needed)
5. Click **Save**
6. Redeploy your project for the changes to take effect

When Vercel builds your project, it will automatically:
- Make the environment variable available as `process.env.VITE_GOOGLE_MAPS_API_KEY`
- Run our `set-env.js` script which replaces the placeholder in `environment.prod.ts`
- Build your app with the real API key

### 4. For Local Production Builds
1. Copy the example environment files:
   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
   ```

2. Edit `src/environments/environment.ts` and replace `YOUR_DEVELOPMENT_API_KEY` with your actual API key:
   ```typescript
   export const environment = {
     production: false,
     googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE'
   };
   ```

3. Do the same for `src/environments/environment.prod.ts` with your production API key

### 3. Secure Your API Key (Important!)
In the Google Cloud Console:

1. Go to **APIs & Services** → **Credentials**
2. Click on your API key to edit it
3. Under **Application restrictions**, select **HTTP referrers (web sites)**
4. Add your allowed referrers:
   - For development: `http://localhost:4200/*`
   - For production: `https://yourdomain.com/*`
5. Under **API restrictions**, select **Restrict key**
6. Select only **Maps JavaScript API**
7. Click **Save**

## Security Best Practices
- ✅ API keys are stored in environment files
- ✅ Environment files are gitignored
- ✅ API is loaded dynamically via service
- ✅ Loading state is handled gracefully
- ✅ API key restrictions should be configured in Google Cloud Console

## Troubleshooting
- If the map shows "For development purposes only", your API key may not be configured correctly
- Check the browser console for any Google Maps API errors
- Ensure your domain is whitelisted in the API key restrictions
- Verify that the Maps JavaScript API is enabled in your Google Cloud project

## Additional Resources
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)