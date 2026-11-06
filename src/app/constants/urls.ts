/**
 * Canonical production origin. Single source of truth for every absolute URL we
 * emit — canonical tags, og:url, the sitemap, and links embedded in outgoing
 * petition emails.
 *
 * Deliberately NOT derived from `environment.production`: that flag is written
 * as a hardcoded `false` by scripts/inject-env-vars.js and angular.json has no
 * `fileReplacements`, so it is false in every build including production. It
 * silently shipped `http://localhost:4200` canonicals on every issue page.
 */
export const SITE_URL = 'https://civiti.ro';

/**
 * Civiti MCP server. The OAuth `resource` it advertises must equal the URL a
 * client is given, so moving to a custom domain also needs the server's public
 * origin changed. Everything on /ghid/asistent-ai is built from this constant.
 */
export const CIVITI_MCP_ORIGIN = 'https://civiti-mcp-production.up.railway.app';
export const CIVITI_MCP_URL = `${CIVITI_MCP_ORIGIN}/mcp`;
export const CIVITI_MCP_PUBLIC_URL = `${CIVITI_MCP_ORIGIN}/mcp/public`;

/** Shared external URLs — keep in sync with marketing surfaces */
export const APP_STORE_URL = 'https://apps.apple.com/ro/app/civiti/id6760908767';
export const GITHUB_URL = 'https://github.com/civiti';
export const REVOLUT_URL = 'https://revolut.me/sorvas';

/**
 * Author credit. The `www` host is deliberate: the apex 308s to it, so linking
 * the apex would put a redirect hop in front of every click.
 */
export const AUTHOR_NAME = 'Sorin Vasiliu';
export const AUTHOR_URL = 'https://www.sorinvasiliu.ro';
