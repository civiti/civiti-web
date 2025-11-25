const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
  console.log('Note: .env file not found or could not be read');
} else {
  console.log('.env file loaded successfully');
}

// Environment variables to inject
const envVars = {
  // API URLs - Default to local backend service
  apiUrl: process.env.API_URL || 'http://localhost:8080/api',

  // Supabase configuration
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  
  // Google Maps (consider renaming VITE_GOOGLE_MAPS_API_KEY to GOOGLE_MAPS_API_KEY)
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '',
  
  // Environment
  production: process.env.NODE_ENV === 'production'
};

console.log('Environment variables injection...');
console.log('Is Vercel environment:', process.env.VERCEL ? 'YES' : 'NO');
console.log('Environment:', process.env.NODE_ENV || 'development');

// Validate required variables
const requiredVars = ['supabaseUrl', 'supabasePublishableKey'];
const missingVars = requiredVars.filter(key => !envVars[key]);

if (missingVars.length > 0) {
  console.error('ERROR: Missing required environment variables:', missingVars);
  console.error('Available env vars:', Object.keys(process.env).filter(k => 
    k.includes('SUPABASE') || k.includes('VITE') || k.includes('API')
  ));
  // Exit with error if required vars are missing
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Create environment config directory
const configDir = path.join(__dirname, '../src/environments');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log('Created environments directory');
}

// Generate environment.ts
const envPath = path.join(configDir, 'environment.ts');
const envContent = `// This file is auto-generated during build - DO NOT EDIT
// Add environment variables to Vercel/Railway instead

export const environment = {
  production: false,
  apiUrl: '${envVars.apiUrl}',
  supabase: {
    url: '${envVars.supabaseUrl}',
    publishableKey: '${envVars.supabasePublishableKey}'
  }
};
`;

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('✓ Generated environment.ts');

// Generate environment.prod.ts
const envProdPath = path.join(configDir, 'environment.prod.ts');
const envProdContent = `// This file is auto-generated during build - DO NOT EDIT
// Add environment variables to Vercel/Railway instead

export const environment = {
  production: true,
  apiUrl: '${envVars.apiUrl}',
  supabase: {
    url: '${envVars.supabaseUrl}',
    publishableKey: '${envVars.supabasePublishableKey}'
  }
};
`;

fs.writeFileSync(envProdPath, envProdContent, 'utf8');
console.log('✓ Generated environment.prod.ts');

// Add .gitignore entry if not present
const gitignorePath = path.join(__dirname, '../.gitignore');
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
const environmentFiles = [
  'src/environments/environment.ts',
  'src/environments/environment.prod.ts',
  'src/environments/google-maps-config.ts'
];

let gitignoreUpdated = false;
const linesToAdd = [];

environmentFiles.forEach(file => {
  if (!gitignoreContent.includes(file)) {
    linesToAdd.push(file);
    gitignoreUpdated = true;
  }
});

if (gitignoreUpdated) {
  fs.appendFileSync(gitignorePath, '\n# Auto-generated environment files\n' + linesToAdd.join('\n') + '\n');
  console.log('✓ Updated .gitignore with environment files');
}

console.log('Environment variable injection complete!');