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
  // For development, update both HTML and TypeScript config
  console.log('Development mode detected');
  
  // Update TypeScript config file
  const configDir = path.join(__dirname, '../src/environments');
  const configPath = path.join(configDir, 'google-maps-config.ts');
  
  // Ensure directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log('Created environments directory');
  }
  
  const configContent = `// This file is auto-generated - DO NOT COMMIT
export const googleMapsConfig = {
  apiKey: ${JSON.stringify(googleMapsApiKey)}
};`;
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✓ Updated google-maps-config.ts for development');
  
  // Also update HTML as before
  let srcContent = fs.readFileSync(srcIndexPath, 'utf8');
  let modified = false;
  
  // Replace all occurrences of the placeholder
  if (srcContent.includes('YOUR_DEVELOPMENT_API_KEY')) {
    srcContent = srcContent.replace(
      /YOUR_DEVELOPMENT_API_KEY/g,
      googleMapsApiKey
    );
    modified = true;
    console.log('✓ Replaced API key placeholder(s) in src/index.html');
  }
  
  // Also check and replace in the inline loader format
  if (srcContent.includes('key: "') && srcContent.includes('v: "weekly"')) {
    // Only replace if it still has placeholder or needs updating
    const keyMatch = srcContent.match(/key: "([^"]*)"/);
    if (keyMatch && keyMatch[1] !== googleMapsApiKey) {
      srcContent = srcContent.replace(
        /key: "[^"]*"/,
        `key: "${googleMapsApiKey}"`
      );
      modified = true;
      console.log('✓ Replaced API key in inline loader');
    }
  }
  
  if (modified) {
    fs.writeFileSync(srcIndexPath, srcContent, 'utf8');
    console.log('IMPORTANT: Remember to run "npm run restore-placeholder" before committing!');
  }
} else if (process.argv.includes('--restore')) {
  // Special mode to restore the placeholders
  console.log('Restoring placeholders...');
  
  // Restore HTML
  let srcContent = fs.readFileSync(srcIndexPath, 'utf8');
  
  // Replace in inline loader
  let restoredContent = srcContent.replace(
    /key: "[^"]*"/,
    'key: "YOUR_DEVELOPMENT_API_KEY"'
  );
  
  // Also restore in meta tag
  restoredContent = restoredContent.replace(
    /(<meta name="google-maps-api-key" content=")([^"]+)(")/,
    '$1YOUR_DEVELOPMENT_API_KEY$3'
  );
  
  fs.writeFileSync(srcIndexPath, restoredContent, 'utf8');
  console.log('✓ Placeholder restored in src/index.html');
  
  // Restore TypeScript config
  const configDir = path.join(__dirname, '../src/environments');
  const configPath = path.join(configDir, 'google-maps-config.ts');
  
  // Ensure directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log('Created environments directory');
  }
  
  const configContent = `// This file will be replaced during build
export const googleMapsConfig = {
  apiKey: ${JSON.stringify('YOUR_DEVELOPMENT_API_KEY')}
};`;
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✓ Placeholder restored in google-maps-config.ts');
} else {
  // For production builds, find and replace in all index.html files
  console.log('Production build mode - searching for index.html files...');
  
  // Recursive function to find all index.html files
  function findIndexFiles(dir) {
    let results = [];
    
    if (!fs.existsSync(dir)) {
      return results;
    }
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively search subdirectories
        results = results.concat(findIndexFiles(filePath));
      } else if (file === 'index.html') {
        // Only match files named exactly 'index.html'
        results.push(filePath);
      }
    }
    
    return results;
  }
  
  // Try multiple possible dist locations
  const possibleDistDirs = [
    path.join(__dirname, '../dist'),
    path.join(process.cwd(), 'dist'),
    '/vercel/path0/dist',
    '/vercel/path0/dist/Civica',
    '/vercel/path0/dist/Civica/browser'
  ];
  
  let indexFiles = [];
  
  for (const distDir of possibleDistDirs) {
    if (fs.existsSync(distDir)) {
      console.log(`Checking directory: ${distDir}`);
      
      // Debug: Show what's in the directory
      try {
        const items = fs.readdirSync(distDir);
        console.log(`  Contents: ${items.join(', ')}`);
      } catch (e) {
        console.log(`  Could not read directory: ${e.message}`);
      }
      
      const found = findIndexFiles(distDir);
      if (found.length > 0) {
        console.log(`  Found ${found.length} index.html file(s)`);
      }
      indexFiles = indexFiles.concat(found);
    }
  }
  
  // Remove duplicates
  indexFiles = [...new Set(indexFiles)];
  
  if (indexFiles.length === 0) {
    console.warn('No index.html files found in any dist directory');
    console.warn('Searched in:', possibleDistDirs);
    return;
  }
  
  console.log(`Found ${indexFiles.length} index.html file(s)`);
  
  indexFiles.forEach(filePath => {
    console.log(`Processing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace all occurrences of the placeholder
    if (content.includes('YOUR_DEVELOPMENT_API_KEY')) {
      content = content.replace(/YOUR_DEVELOPMENT_API_KEY/g, googleMapsApiKey);
      modified = true;
      console.log(`  ✓ Replaced API key placeholder(s)`);
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
        console.log(`  ✓ Replaced API key in inline loader`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    } else {
      console.log(`  - Skipped (no changes needed)`);
    }
  });
}