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
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findAndReplace(fullPath);
    } else if (item === 'index.html') {
      console.log(`Found: ${fullPath}`);
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
  '/vercel/path0/dist',
  '/vercel/path0/dist/Civica',
  '/vercel/path0/dist/Civica/browser',
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

console.log('HTML injection complete!');