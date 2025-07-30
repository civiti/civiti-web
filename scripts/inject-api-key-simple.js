const fs = require('fs');
const path = require('path');

// Get the API key from environment
const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

console.log('Pre-build API key injection...');
console.log('Is Vercel environment:', process.env.VERCEL ? 'YES' : 'NO');

if (!googleMapsApiKey) {
  console.error('ERROR: VITE_GOOGLE_MAPS_API_KEY is not set!');
  console.error('Environment variables available:', Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('VITE')));
  console.error('All env vars starting with V:', Object.keys(process.env).filter(k => k.startsWith('V')).sort());
  process.exit(1);
}

console.log('API key found (length):', googleMapsApiKey.length);

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

// ALSO update the source index.html BEFORE build
// NOTE: This will be restored by the postbuild script to prevent accidental commits
const srcIndexPath = path.join(__dirname, '../src/index.html');
if (fs.existsSync(srcIndexPath)) {
  console.log('Updating src/index.html (will be restored after build)...');
  let htmlContent = fs.readFileSync(srcIndexPath, 'utf8');
  let modified = false;
  
  // Replace all occurrences of the placeholder
  if (htmlContent.includes('YOUR_DEVELOPMENT_API_KEY')) {
    htmlContent = htmlContent.replace(/YOUR_DEVELOPMENT_API_KEY/g, googleMapsApiKey);
    modified = true;
    console.log('✓ Replaced API key placeholder(s) in index.html');
  }
  
  // Also check and replace in the inline loader format
  if (htmlContent.includes('key: "') && htmlContent.includes('v: "weekly"')) {
    const keyMatch = htmlContent.match(/key: "([^"]*)"/);
    if (keyMatch && keyMatch[1] !== googleMapsApiKey) {
      htmlContent = htmlContent.replace(
        /key: "[^"]*"/,
        `key: "${googleMapsApiKey}"`
      );
      modified = true;
      console.log('✓ Replaced API key in inline loader');
    }
  }
  
  if (modified) {
    fs.writeFileSync(srcIndexPath, htmlContent, 'utf8');
  }
} else {
  console.warn('Warning: src/index.html not found');
}

console.log('Pre-build injection complete!');