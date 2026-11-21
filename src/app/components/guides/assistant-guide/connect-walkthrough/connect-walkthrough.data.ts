/**
 * What a person sees while connecting an app to their Civiti account, step by step.
 *
 * The screens are recreated from civiti-server's Civiti.Auth/Pages/Login.cshtml and
 * Consent.cshtml, whose text is English. Notes are numbered to match the pins on each
 * screen. Keep both in step with those pages and with Civiti.Mcp/README.md.
 */

/** Host of Civiti.Auth, from the MCP server's /.well-known/oauth-protected-resource. */
export const CIVITI_AUTH_HOST = 'civiti-auth-production.up.railway.app';

export type WalkStepId = 'cont' | 'login' | 'acord' | 'gata';

export interface WalkNote {
  title: string;
  text: string;
}

export interface WalkStep {
  id: WalkStepId;
  /** Short tab label. */
  label: string;
  title: string;
  /** Path on the auth host shown in the address bar, when the step is a Civiti page. */
  path?: string;
  notes: readonly WalkNote[];
}

/** Scope rows as Consent.cshtml.cs ScopeDescriptor renders them, with a Romanian gloss. */
export const CONSENT_SCOPES = [
  {
    name: 'Read your civic data',
    desc: 'List issues, view authorities, see your profile and gamification.',
  },
  {
    name: 'Take actions on your behalf',
    desc: 'Submit issues, vote, comment, mark petition emails as sent.',
  },
  {
    name: 'Stay signed in',
    desc: 'Refresh the connection without re-authenticating every 15 minutes.',
  },
] as const;

export const WALK_STEPS: readonly WalkStep[] = [
  {
    id: 'cont',
    label: 'Contul',
    title: 'Mai întâi, un cont pe civiti.ro',
    notes: [
      {
        title: 'Contul vine înainte',
        text: 'Conectorul folosește contul tău Civiti, nu creează unul. Dacă nu ai cont, fă-ți unul pe civiti.ro înainte să conectezi aplicația.',
      },
      {
        title: 'Fără cont, conectarea se oprește',
        text: 'După autentificare vezi doar un text tehnic, în engleză: `no_civiti_account` sau `No Civiti account`. Mesajul pomenește „Civica”, vechiul nume. Nu e o defecțiune: lipsește profilul Civiti. Închide fila, fă-ți contul și apasă din nou Connect în aplicație.',
      },
      {
        title: 'Același email, aceeași metodă',
        text: 'La conectare intri exact cum intri pe civiti.ro: cu emailul și parola sau cu contul Google. Dacă ai conectat ceva în ultima jumătate de oră, din același browser, s-ar putea să sari peste pasul ăsta.',
      },
    ],
  },
  {
    id: 'login',
    label: 'Autentificarea',
    title: 'Pagina de autentificare Civiti',
    path: '/Login',
    notes: [
      {
        title: 'Verifică adresa',
        text: `Pagina se deschide pe ${CIVITI_AUTH_HOST}, serverul de autentificare Civiti. Parola o scrii doar aici, niciodată în conversația cu asistentul.`,
      },
      {
        title: 'Numele aplicației lipsește aici',
        text: 'Pagina scrie „the requesting application” în loc de numele aplicației. Numele apare abia pe pagina următoare.',
      },
      {
        title: 'Email și parolă',
        text: 'Aceleași date ca pe civiti.ro. Asistentul nu le vede: primește doar un acces temporar, după ce aprobi.',
      },
      {
        title: 'Sau cu Google',
        text: 'Alege varianta asta dacă pe civiti.ro intri cu Google. Urmează ecranele Google de alegere a contului, apoi pagina de acord.',
      },
    ],
  },
  {
    id: 'acord',
    label: 'Acordul',
    title: 'Pagina de acord',
    path: '/Consent',
    notes: [
      {
        title: 'Unverified e normal',
        text: 'Claude și Claude Desktop se înregistrează singure la Civiti, iar aplicațiile înregistrate așa apar mereu cu Unverified. Verifică doar că numele e al aplicației pe care o conectezi.',
      },
      {
        title: 'Ce poate face aplicația',
        text: 'Read your civic data: îți vede problemele, profilul și punctele. Take actions on your behalf: poate adăuga probleme noi, vota, comenta și marca un email ca trimis. Stay signed in: rămâne conectată fără să te autentifici iar la fiecare 15 minute. Lista vine de la aplicație, așa că poate diferi puțin.',
      },
      {
        title: 'Nota de confidențialitate',
        text: 'Ce primește asistentul ajunge la furnizorul lui de AI, după regulile acestuia. Nota e provizorie, iar pagina de setări pe care o pomenește nu există încă: deocamdată nu poți vedea sau retrage conexiunile din contul Civiti.',
      },
      {
        title: 'Approve sau Deny',
        text: 'Aprobi tot sau nimic. Approve te duce direct înapoi în aplicație. Deny refuză și te scoate din contul Civiti din browser. Ai 10 minute, într-o singură filă: altfel primești `Consent context missing or expired` sau `This consent form is stale` și o iei de la capăt.',
      },
    ],
  },
  {
    id: 'gata',
    label: 'Gata',
    title: 'Înapoi în aplicație, conectat',
    notes: [
      {
        title: 'Cât ține conexiunea',
        text: 'Accesul se reînnoiește singur, în fundal, cât timp folosești conectorul. După 30 de zile fără folosire, te autentifici din nou. Dacă adaugi conectorul din nou, îți cere și acordul din nou.',
      },
      {
        title: 'Cum oprești accesul',
        text: 'Scoate conectorul din aplicație. Pe civiti.ro nu există încă o pagină cu aplicațiile conectate.',
      },
      {
        title: 'Actualizările nu te deconectează',
        text: 'Când Civiti își actualizează serverul, rămâi conectat. Nu trebuie să adaugi conectorul din nou.',
      },
    ],
  },
];
