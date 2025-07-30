# Google Maps API Key Security Best Practices

## Current Implementation
Your API key is injected into the HTML at build time from Vercel environment variables. While this key is visible in the browser, this is the standard approach for Google Maps JavaScript API.

## Required Security Measures

### 1. Restrict Your API Key in Google Cloud Console

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and:

#### Application Restrictions
- Select "HTTP referrers (websites)"
- Add your allowed domains:
  ```
  https://civica-puce.vercel.app/*
  https://your-custom-domain.com/*
  http://localhost:4200/*  (for local development)
  ```

#### API Restrictions
- Select "Restrict key"
- Choose only these APIs:
  - Maps JavaScript API
  - Geocoding API (if using address lookup)
  - Places API (if using places)

### 2. Set Usage Quotas
- Set daily request quotas to prevent abuse
- Set up billing alerts

### 3. Monitor Usage
- Regularly check your API usage in Google Cloud Console
- Set up alerts for unusual activity

## Alternative Approach (More Secure but Complex)

If you need higher security, you can:

1. Create a backend endpoint that proxies Google Maps requests
2. Keep the API key only on your server
3. Use Google Maps with a session-based token system

However, this adds significant complexity and may impact performance.

## Why Client-Side Keys Are Acceptable for Maps

1. **Google's Design** - Maps JavaScript API is designed for client-side use
2. **Domain Restrictions** - Properly configured keys only work from your domains
3. **Limited Scope** - Restricted keys can only access map-related APIs
4. **Industry Standard** - This is how most production applications handle Maps

## Checklist for Production

- [ ] API key is restricted by HTTP referrer in Google Cloud Console
- [ ] API key is restricted to only necessary APIs
- [ ] Usage quotas are configured
- [ ] Billing alerts are set up
- [ ] You're monitoring API usage regularly
- [ ] You have a separate API key for development (optional but recommended)