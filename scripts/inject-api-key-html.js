const fs = require('fs');
const path = require('path');

// Get the API key from environment
const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

console.log('Post-build HTML API key injection...');
console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);
console.log('Is Vercel environment:', process.env.VERCEL ? 'YES' : 'NO');
console.log('Vercel URL:', process.env.VERCEL_URL || 'not set');

if (!googleMapsApiKey) {
  console.error('ERROR: VITE_GOOGLE_MAPS_API_KEY is not set!');
  console.error('Environment variables available:', Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('VITE')));
  console.error('All env vars starting with V:', Object.keys(process.env).filter(k => k.startsWith('V')).sort());
  process.exit(1);
}

console.log('API key found (length):', googleMapsApiKey.length);
console.log('First 10 chars:', googleMapsApiKey.substring(0, 10) + '...');

// Simple recursive search for HTML files
function findAndReplace(dir) {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  
  // Log directory contents for debugging
  if (dir.includes('dist') && !dir.includes('node_modules')) {
    const htmlFiles = items.filter(item => item.endsWith('.html'));
    console.log(`\nChecking ${dir}:`);
    if (htmlFiles.length > 0) {
      console.log(`  Found HTML files:`, htmlFiles);
    } else {
      console.log(`  No HTML files found`);
      if (items.length <= 20) {
        console.log(`  All files:`, items);
      }
    }
  }
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findAndReplace(fullPath);
    } else if (item === 'index.html' || item.endsWith('.html')) {
      console.log(`Found HTML file: ${fullPath}`);
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;
      
      // Replace all occurrences of the placeholder
      if (content.includes('YOUR_DEVELOPMENT_API_KEY')) {
        content = content.replace(/YOUR_DEVELOPMENT_API_KEY/g, googleMapsApiKey);
        modified = true;
        console.log('✓ Replaced API key placeholder(s)');
      }
      
      // Also check and replace in the inline loader format
      if (content.includes('key: "') && content.includes('v: "weekly"')) {
        // Only replace if it still has placeholder or needs updating
        const keyMatch = content.match(/key: "([^"]*)"/);
        if (keyMatch && keyMatch[1] !== googleMapsApiKey) {
          content = content.replace(
            /key: "[^"]*"/,
            `key: "${googleMapsApiKey}"`
          );
          modified = true;
          console.log('✓ Replaced API key in inline loader');
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  });
}

// Start from dist directory
const possibleDistDirs = [
  'dist',
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), 'dist/Civica'),
  path.join(process.cwd(), 'dist/Civica/browser'),
  path.join(process.cwd(), 'dist/Civica/server'),
  '/vercel/path0/dist',
  '/vercel/path0/dist/Civica',
  '/vercel/path0/dist/Civica/browser',
  '/vercel/path0/dist/Civica/server',
  '/vercel/output',
  '/vercel/output/static',
  path.join(process.cwd(), '.vercel/output/static'),
  path.join(process.cwd(), '.vercel/output')
];

console.log('Searching for dist directories...');
let foundAny = false;

for (const distDir of possibleDistDirs) {
  if (fs.existsSync(distDir)) {
    console.log(`Found directory: ${distDir}`);
    
    // List contents for debugging
    try {
      const items = fs.readdirSync(distDir);
      console.log(`  Contents: ${items.slice(0, 10).join(', ')}${items.length > 10 ? '...' : ''}`);
    } catch (e) {
      console.log(`  Could not read directory: ${e.message}`);
    }
    
    findAndReplace(distDir);
    foundAny = true;
  }
}

if (!foundAny) {
  console.error('WARNING: No dist directories found!');
  console.error('Searched in:', possibleDistDirs);
}

// ALWAYS restore the placeholder in src/index.html to avoid committing the API key
const srcIndexPath = path.join(__dirname, '../src/index.html');
if (fs.existsSync(srcIndexPath)) {
  console.log('\nRestoring placeholder in src/index.html...');
  let srcContent = fs.readFileSync(srcIndexPath, 'utf8');
  let restored = false;
  
  // Replace the API key back with placeholder
  if (googleMapsApiKey && srcContent.includes(googleMapsApiKey)) {
    srcContent = srcContent.replace(new RegExp(googleMapsApiKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'YOUR_DEVELOPMENT_API_KEY');
    restored = true;
  }
  
  // Also ensure the inline loader format is restored
  if (srcContent.includes('key: "') && srcContent.includes('v: "weekly"')) {
    const keyMatch = srcContent.match(/key: "([^"]*)"/);
    if (keyMatch && keyMatch[1] !== 'YOUR_DEVELOPMENT_API_KEY') {
      srcContent = srcContent.replace(
        /key: "[^"]*"/,
        'key: "YOUR_DEVELOPMENT_API_KEY"'
      );
      restored = true;
    }
  }
  
  if (restored) {
    fs.writeFileSync(srcIndexPath, srcContent, 'utf8');
    console.log('✓ Placeholder restored in src/index.html');
  }
}

// Also restore the TypeScript config to placeholder
const configPath = path.join(__dirname, '../src/environments/google-maps-config.ts');
if (fs.existsSync(configPath)) {
  const placeholderConfig = `// This file will be replaced during build
export const googleMapsConfig = {
  apiKey: "YOUR_DEVELOPMENT_API_KEY"
};`;
  fs.writeFileSync(configPath, placeholderConfig, 'utf8');
  console.log('✓ Placeholder restored in google-maps-config.ts');
}

console.log('\nHTML injection complete!');