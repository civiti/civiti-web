const fs = require('fs');
const path = require('path');

// Get the Google Maps API key from environment variable
const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Path to the source index.html
const srcIndexPath = path.join(__dirname, '../src/index.html');

// First, ensure the source file has the placeholder (not a key)
const srcContent = fs.readFileSync(srcIndexPath, 'utf8');
if (!srcContent.includes('YOUR_DEVELOPMENT_API_KEY')) {
  // Restore the placeholder if it's missing
  const restoredContent = srcContent.replace(
    /key:\s*"[^"]*"/,
    'key: "YOUR_DEVELOPMENT_API_KEY"'
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

// For production builds, we need to modify the file after Angular copies it
// This is a post-build script that should run after ng build
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
  // If dist doesn't exist yet, this is a pre-build script
  // Just log a message - the actual injection will happen in a post-build step
  console.log('Note: API key will be injected after the build completes');
}