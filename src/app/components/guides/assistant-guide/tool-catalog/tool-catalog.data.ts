/**
 * The 21 tools of the Civiti MCP, in plain Romanian.
 *
 * Source: civiti-server Civiti.Mcp/docs/tool-inventory.md §1 and §2, which CI keeps in
 * step with Civiti.Mcp/Tools/. Update this list when that table changes.
 */

export type ToolGroupId = 'public' | 'read' | 'write';

export interface CivitiTool {
  name: string;
  label: string;
  text: string;
  /** Changes something on Civiti. */
  writes: boolean;
  /** Called by the civiti-petitions skill. */
  skill: boolean;
}

export interface ToolGroup {
  id: ToolGroupId;
  title: string;
  /** Where it works and which permission it needs. */
  access: string;
  tools: readonly CivitiTool[];
}

export const TOOL_GROUPS: readonly ToolGroup[] = [
  {
    id: 'public',
    title: 'Fără cont',
    access: 'Merg și pe adresa publică, fără autentificare.',
    tools: [
      { name: 'search_issues', label: 'Caută probleme', text: 'Doar problemele publice, active sau rezolvate, cu filtre după categorie, sector sau adresă.', writes: false, skill: false },
      { name: 'get_issue', label: 'Deschide o problemă', text: 'Toate detaliile unei probleme: descriere, fotografii, autoritățile legate de ea.', writes: false, skill: true },
      { name: 'list_authorities', label: 'Autoritățile', text: 'Autoritățile locale active dintr-un oraș sau sector, cu emailurile lor.', writes: false, skill: true },
      { name: 'get_categories', label: 'Categoriile', text: 'Categoriile de probleme, cu numele lor în română.', writes: false, skill: false },
      { name: 'get_leaderboard', label: 'Clasamentul', text: 'Cei mai activi oameni, după puncte, probleme, rezolvări sau voturi.', writes: false, skill: false },
      { name: 'mark_email_sent', label: 'Numără un email trimis', text: 'După ce ai trimis petiția, crește cu unu contorul public de emailuri al problemei. Nu trimite nimic și merge cel mult o dată pe oră.', writes: true, skill: true },
      { name: 'whoami', label: 'Verifică conexiunea', text: 'Spune dacă asistentul e conectat cu contul tău sau doar public.', writes: false, skill: false },
    ],
  },
  {
    id: 'read',
    title: 'Cu contul tău, citire',
    access: 'Cer autentificare și permisiunea Read your civic data.',
    tools: [
      { name: 'list_my_issues', label: 'Problemele tale', text: 'Problemele create de tine, inclusiv cele care încă așteaptă aprobarea.', writes: false, skill: false },
      { name: 'get_my_profile', label: 'Profilul tău', text: 'Numele afișat, localitatea și datele contului tău Civiti.', writes: false, skill: false },
      { name: 'get_my_gamification', label: 'Punctele tale', text: 'Punctele, nivelul, insignele și seria de zile active.', writes: false, skill: false },
      { name: 'list_my_activity', label: 'Activitatea', text: 'Ce s-a întâmplat la problemele pe care le urmărești.', writes: false, skill: false },
      { name: 'list_my_blocked_users', label: 'Utilizatori blocați', text: 'Lista oamenilor pe care i-ai blocat.', writes: false, skill: false },
      { name: 'generate_petition_body', label: 'Emailul de pe pagina problemei', text: 'Textul de pornire din fereastra de email a unei probleme, pe civiti.ro. Nu scrie petiții: pe acelea le scrie abilitatea.', writes: false, skill: false },
    ],
  },
  {
    id: 'write',
    title: 'Cu contul tău, acțiuni',
    access: 'Cer autentificare și permisiunea Take actions on your behalf.',
    tools: [
      { name: 'create_issue', label: 'Creează o problemă', text: 'Apare public abia după ce o aprobă un moderator.', writes: true, skill: false },
      { name: 'vote_on_issue', label: 'Votează o problemă', text: 'Adaugă sau retrage votul tău.', writes: true, skill: false },
      { name: 'add_comment', label: 'Comentează', text: 'Un comentariu sau un răspuns, cel mult unul la 10 secunde pe aceeași problemă.', writes: true, skill: false },
      { name: 'vote_on_comment', label: 'Comentariu util', text: 'Marchează un comentariu ca util sau retrage marcajul.', writes: true, skill: false },
      { name: 'report_content', label: 'Raportează', text: 'Trimite moderatorilor o problemă sau un comentariu, cel mult 5 pe oră.', writes: true, skill: false },
      { name: 'update_my_profile', label: 'Actualizează profilul', text: 'Numele afișat, fotografia, județul, orașul sau sectorul.', writes: true, skill: false },
      { name: 'block_user', label: 'Blochează', text: 'Ascunde conținutul unui om, doar pentru tine.', writes: true, skill: false },
      { name: 'unblock_user', label: 'Deblochează', text: 'Scoate pe cineva din lista de blocați.', writes: true, skill: false },
    ],
  },
];
