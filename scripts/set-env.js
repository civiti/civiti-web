const fs = require('fs');
const path = require('path');

// Get the environment variable (Vercel provides this automatically)
const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

if (!googleMapsApiKey) {
  console.warn('Warning: VITE_GOOGLE_MAPS_API_KEY environment variable is not set');
  console.warn('Please set it in Vercel Dashboard for production deployment');
}

// Path to the environment file
const envPath = path.join(__dirname, '../src/environments/environment.prod.ts');

// Read the file
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace the placeholder with the actual API key
envContent = envContent.replace(
  'VITE_GOOGLE_MAPS_API_KEY_PLACEHOLDER',
  googleMapsApiKey
);

// Write the file back
fs.writeFileSync(envPath, envContent, 'utf8');

// Also update index.html for production builds
const indexPath = path.join(__dirname, '../src/index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');
indexContent = indexContent.replace(
  'YOUR_DEVELOPMENT_API_KEY',
  googleMapsApiKey
);
fs.writeFileSync(indexPath, indexContent, 'utf8');

console.log('Environment variables and index.html updated successfully');