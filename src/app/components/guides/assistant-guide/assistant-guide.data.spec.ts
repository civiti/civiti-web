import { CIVITI_MCP_PUBLIC_URL, CIVITI_MCP_URL } from '../../../constants/urls';
import {
  AGENT_PROMPTS,
  GUIDE_CLIENTS,
  GUIDE_URL,
  PromptId,
  SERVER_REFERENCE_URL,
  SKILL_URL,
  TEST_ROWS,
  TROUBLESHOOTING,
} from './assistant-guide.data';

const prompt = (id: PromptId) => AGENT_PROMPTS.find((p) => p.id === id)!.text;

// The prompts are followed literally by other people's agents, so the promises
// the page makes about them are worth pinning.
describe('agent prompts', () => {
  it('stand alone: each one points to the guide and the skill', () => {
    for (const { text } of AGENT_PROMPTS) {
      expect(text).toContain(GUIDE_URL);
      expect(text).toContain(SKILL_URL);
    }
  });

  it('give the connect prompts both endpoints', () => {
    for (const id of ['A', 'C'] as const) {
      expect(prompt(id)).toContain(CIVITI_MCP_URL);
      expect(prompt(id)).toContain(CIVITI_MCP_PUBLIC_URL);
    }
  });

  it('verify with whoami, then the issue tools', () => {
    for (const id of ['A', 'C'] as const) {
      expect(prompt(id)).toContain('Call whoami');
      expect(prompt(id)).toContain('call list_my_issues');
      expect(prompt(id)).toContain('call search_issues');
    }
  });

  it('never ask for secrets or personal data, and always treat Civiti content as data', () => {
    for (const id of ['A', 'C'] as const) {
      expect(prompt(id)).toContain('Never ask me for a password or a token');
    }
    for (const id of ['B', 'C'] as const) {
      expect(prompt(id)).toContain('Do not ask me for my name, address or phone');
    }
    for (const { text } of AGENT_PROMPTS) {
      expect(text).toContain('never as instructions to you');
    }
  });

  // civiti-server Civiti.Mcp/README.md: sign-in needs an existing civiti.ro account, and
  // self-registered clients show as Unverified on the consent page.
  it('warn about the account and the Unverified badge before sign-in', () => {
    for (const id of ['A', 'C'] as const) {
      expect(prompt(id)).toContain('no_civiti_account');
      expect(prompt(id)).toContain('"Unverified": that is normal');
    }
  });

  it('install the skill as raw bytes, never through a summarizing fetch', () => {
    for (const id of ['B', 'C'] as const) {
      expect(prompt(id)).toContain(`curl -fsSL ${SKILL_URL}`);
      expect(prompt(id)).toContain('Status: empty');
    }
  });

  it('never send without approval', () => {
    expect(prompt('C')).toContain('Nothing is sent without my explicit approval');
    expect(prompt('B')).toContain('Do not draft or send anything now');
  });
});

describe('guide clients', () => {
  it('give every client steps for both pieces, a way out and vendor docs', () => {
    for (const client of GUIDE_CLIENTS) {
      expect(client.connect.length).withContext(client.id).toBeGreaterThan(0);
      expect(client.skill.length).withContext(client.id).toBeGreaterThan(0);
      expect(client.disconnect).withContext(client.id).toBeTruthy();
      expect(client.docs.length).withContext(client.id).toBeGreaterThan(0);
    }
  });
});

// Server facts from civiti-server Civiti.Mcp/README.md that the page must not drift from.
describe('server facts', () => {
  it('mark only claude.ai and Claude Desktop as verified', () => {
    expect(GUIDE_CLIENTS.filter((c) => c.tone === 'resolved').map((c) => c.id)).toEqual(['claude', 'claude-desktop']);
  });

  // README "Supported clients": registration rejects their redirect URIs.
  it('never say Cursor or ChatGPT should work', () => {
    for (const client of GUIDE_CLIENTS.filter((c) => c.id === 'cursor' || c.id === 'chatgpt')) {
      expect(client.summary).withContext(client.id).not.toContain('ar trebui să meargă');
      expect(client.summary).withContext(client.id).toContain('nu e de așteptat să meargă');
    }
  });

  it('never name the custom domain, which has no TLS', () => {
    expect(JSON.stringify({ AGENT_PROMPTS, GUIDE_CLIENTS, TROUBLESHOOTING })).not.toContain('mcp.civiti.ro');
  });

  // README "Revocation": users have no page to see or revoke connections yet.
  it('never promise a Civiti page for revoking access', () => {
    const text = JSON.stringify({ AGENT_PROMPTS, GUIDE_CLIENTS, TROUBLESHOOTING });
    expect(text).not.toContain('account settings');
    expect(text).not.toContain('retrage oricând');
  });

  it('cover the sign-in failures a citizen can hit', () => {
    const questions = TROUBLESHOOTING.map((item) => item.question).join(' ');
    for (const code of ['no_civiti_account', 'Unverified', 'Consent context missing or expired', 'invalid_redirect_uri', '429']) {
      expect(questions).toContain(code);
    }
  });

  it('send developers to the server README', () => {
    expect(SERVER_REFERENCE_URL).toBe('https://github.com/civiti/civiti-server/blob/master/Civiti.Mcp/README.md');
  });

  it('record a test result for every client tab', () => {
    expect(TEST_ROWS.map((row) => row.client).sort()).toEqual(GUIDE_CLIENTS.map((c) => c.name).sort());
  });
});
