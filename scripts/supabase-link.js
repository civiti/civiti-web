/**
 * Cross-platform script to link Supabase project.
 * Reads project ref from SUPABASE_PROJECT_REF environment variable.
 *
 * Usage:
 *   Set SUPABASE_PROJECT_REF in your environment or .env file, then:
 *   npm run supabase:link
 */
const { spawnSync } = require('child_process');

// Try to load from .env file if dotenv is available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not required, env var can be set directly
}

const projectRef = process.env.SUPABASE_PROJECT_REF;

if (!projectRef) {
  console.error('Error: SUPABASE_PROJECT_REF environment variable is not set.');
  console.error('');
  console.error('Set it in one of these ways:');
  console.error('  1. Add SUPABASE_PROJECT_REF=your-ref to .env file');
  console.error('  2. Run directly: npx supabase link --project-ref your-ref');
  console.error('');
  console.error('Your project ref can be found in Supabase Dashboard → Project Settings → General');
  process.exit(1);
}

// Validate project ref format (alphanumeric, 20 characters)
// Supabase project refs follow this pattern
const PROJECT_REF_PATTERN = /^[a-z]{20}$/;
if (!PROJECT_REF_PATTERN.test(projectRef)) {
  console.error('Error: Invalid SUPABASE_PROJECT_REF format.');
  console.error('Expected: 20 lowercase letters (e.g., "abcdefghijklmnopqrst")');
  console.error(`Received: "${projectRef}"`);
  process.exit(1);
}

console.log(`Linking to Supabase project: ${projectRef}`);

// Use spawnSync with argument array to prevent command injection
const result = spawnSync('npx', ['supabase', 'link', '--project-ref', projectRef], {
  stdio: 'inherit',
  shell: process.platform === 'win32'  // Only use shell on Windows for npx resolution
});

if (result.error) {
  console.error('Failed to execute command:', result.error.message);
  process.exit(1);
}

process.exit(result.status || 0);
