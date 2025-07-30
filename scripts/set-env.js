const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
  console.log('Note: .env file not found or could not be read');
} else {
  console.log('.env file loaded successfully');
  // Debug: show what was loaded (without showing the actual key)
  const keys = Object.keys(result.parsed || {});
  console.log('Environment variables found:', keys);
}

// Get the Google Maps API key from environment variable
let googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Remove quotes if they exist (in case someone wrapped the key in quotes)
if (googleMapsApiKey.startsWith('"') && googleMapsApiKey.endsWith('"')) {
  googleMapsApiKey = googleMapsApiKey.slice(1, -1);
}
if (googleMapsApiKey.startsWith("'") && googleMapsApiKey.endsWith("'")) {
  googleMapsApiKey = googleMapsApiKey.slice(1, -1);
}

// Path to the source index.html
const srcIndexPath = path.join(__dirname, '../src/index.html');

// First, ensure the source file has the placeholder (not a key)
const srcContent = fs.readFileSync(srcIndexPath, 'utf8');
if (!srcContent.includes('YOUR_DEVELOPMENT_API_KEY')) {
  // Restore the placeholder if it's missing
  const restoredContent = srcContent.replace(
    /key=([^&"]+)/,
    'key=YOUR_DEVELOPMENT_API_KEY'
  );
  fs.writeFileSync(srcIndexPath, restoredContent, 'utf8');
  console.log('Restored placeholder in src/index.html');
}

if (!googleMapsApiKey) {
  console.warn('Warning: VITE_GOOGLE_MAPS_API_KEY environment variable is not set');
  console.warn('Google Maps will not work without a valid API key');
  // Exit successfully - the build should continue with the placeholder
  process.exit(0);
}

// Check if we're in development mode (ng serve)
const isDevelopment = process.argv.includes('--dev');

if (isDevelopment) {
  // For development, modify the file and keep it modified
  console.log('Development mode detected - updating src/index.html');
  
  // Read the current content
  let srcContent = fs.readFileSync(srcIndexPath, 'utf8');
  
  // Only replace if placeholder exists
  if (srcContent.includes('YOUR_DEVELOPMENT_API_KEY')) {
    // Replace the placeholder with the actual API key
    const updatedContent = srcContent.replace(
      'YOUR_DEVELOPMENT_API_KEY',
      googleMapsApiKey
    );
    
    // Write it back
    fs.writeFileSync(srcIndexPath, updatedContent, 'utf8');
    console.log('API key injected into src/index.html for development');
    console.log('IMPORTANT: Remember to run "npm run restore-placeholder" before committing!');
  } else {
    console.log('API key already present in src/index.html');
  }
} else if (process.argv.includes('--restore')) {
  // Special mode to restore the placeholder
  console.log('Restoring placeholder in src/index.html...');
  let srcContent = fs.readFileSync(srcIndexPath, 'utf8');
  
  // Simple replacement - find any key= value and replace with placeholder
  const restoredContent = srcContent.replace(
    /key=([^&"]+)/,
    'key=YOUR_DEVELOPMENT_API_KEY'
  );
  
  fs.writeFileSync(srcIndexPath, restoredContent, 'utf8');
  console.log('Placeholder restored in src/index.html');
} else {
  // For production builds, we need to modify the file after Angular copies it
  const distPaths = [
    path.join(__dirname, '../dist/Civica/browser/index.html'),
    path.join(__dirname, '../dist/Civica/index.html'),
    path.join(__dirname, '../dist/index.html')
  ];

  // Try to find and update the dist index.html
  let found = false;
  for (const distPath of distPaths) {
    if (fs.existsSync(distPath)) {
      let distContent = fs.readFileSync(distPath, 'utf8');
      distContent = distContent.replace(
        'YOUR_DEVELOPMENT_API_KEY',
        googleMapsApiKey
      );
      fs.writeFileSync(distPath, distContent, 'utf8');
      console.log(`Google Maps API key injected into ${distPath}`);
      found = true;
    }
  }

  if (!found) {
    console.log('Note: API key will be injected after the build completes');
  }
}