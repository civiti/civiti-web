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

// The skill saves the petitioner's name, address and phone into this block on first
// use, so a copy brought back from someone's Claude app carries them. The published
// file must always ship it empty.
const EMPTY_PROFILE = [
  'Status: empty',
  'Name (as written in petitions):',
  'Form: Subsemnatul / domiciliat | Subsemnata / domiciliată',
  'Full address:',
  'Phone (optional):',
].join('\n');

function assertEmptyProfile(skill) {
  if (!skill.replace(/\r\n/g, '\n').includes('```\n' + EMPTY_PROFILE + '\n```')) {
    throw new Error(
      `${SOURCE} has a filled or changed Petitioner profile. Reset the block to:\n${EMPTY_PROFILE}`,
    );
  }
}

async function buildSkillZip() {
  const skill = fs.readFileSync(SOURCE);
  assertEmptyProfile(skill.toString('utf8'));
  const zip = new JSZip();
  zip.file('civiti-petitions/SKILL.md', skill, { date: STAMP });
  const bytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(OUTPUT, bytes);
  console.log(`[build-skill-zip] ${bytes.length} bytes → ${OUTPUT}`);
}

buildSkillZip().catch((error) => {
  console.error('[build-skill-zip] Failed:', error);
  process.exit(1);
});
