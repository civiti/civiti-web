const fs = require('fs');
const path = require('path');

// Get the API key from environment
const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

if (!googleMapsApiKey) {
  console.error('ERROR: VITE_GOOGLE_MAPS_API_KEY is not set!');
  process.exit(1);
}

console.log('Pre-build API key injection...');

// Update the TypeScript config file BEFORE build
const configDir = path.join(__dirname, '../src/environments');
const configPath = path.join(configDir, 'google-maps-config.ts');

// Ensure directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log('Created environments directory');
}

console.log('Updating google-maps-config.ts...');
const configContent = `// This file is auto-generated during build
export const googleMapsConfig = {
  apiKey: ${JSON.stringify(googleMapsApiKey)}
};`;
fs.writeFileSync(configPath, configContent, 'utf8');
console.log('✓ Updated config file');

// We'll need a separate post-build script for HTML files
console.log('TypeScript config ready for build!');