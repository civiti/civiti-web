const fs = require('fs');
const path = require('path');

// Get the API key from environment
const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

if (!googleMapsApiKey) {
  console.error('ERROR: VITE_GOOGLE_MAPS_API_KEY is not set!');
  process.exit(1);
}

console.log('Post-build HTML API key injection...');

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
findAndReplace('dist');
console.log('HTML injection complete!');