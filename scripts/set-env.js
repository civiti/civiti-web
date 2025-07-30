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
  
  const distDir = path.join(__dirname, '../dist');
  const indexFiles = findIndexFiles(distDir);
  
  if (indexFiles.length === 0) {
    console.warn('No index.html files found in dist directory');
    console.warn('This might be normal if running before the build completes');
    return;
  }
  
  console.log(`Found ${indexFiles.length} index.html file(s)`);
  
  indexFiles.forEach(filePath => {
    console.log(`Processing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('YOUR_DEVELOPMENT_API_KEY')) {
      content = content.replace(/YOUR_DEVELOPMENT_API_KEY/g, googleMapsApiKey);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ API key injected`);
    } else {
      console.log(`  - Skipped (no placeholder found)`);
    }
  });
}