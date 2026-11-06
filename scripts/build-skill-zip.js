const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// claude.ai and Claude Desktop install skills by upload, and require the skill
// folder as the top level of the archive. Generated at build time so the ZIP can
// never drift from SKILL.md, the one file people review.

const SKILL_DIR = path.join(__dirname, '..', 'public', 'skills', 'civiti-petitions');
const SOURCE = path.join(SKILL_DIR, 'SKILL.md');
const OUTPUT = path.join(SKILL_DIR, 'civiti-petitions.zip');

// A fixed timestamp keeps the archive byte-identical between builds.
const STAMP = new Date('2026-01-01T00:00:00Z');

async function buildSkillZip() {
  const zip = new JSZip();
  zip.file('civiti-petitions/SKILL.md', fs.readFileSync(SOURCE), { date: STAMP });
  const bytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(OUTPUT, bytes);
  console.log(`[build-skill-zip] ${bytes.length} bytes → ${OUTPUT}`);
}

buildSkillZip().catch((error) => {
  console.error('[build-skill-zip] Failed:', error);
  process.exit(1);
});
