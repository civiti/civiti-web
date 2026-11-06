export type DiagramMode = 'account' | 'public' | 'send';
export type NodeId = 'client' | 'mcp' | 'auth' | 'data' | 'gmail' | 'authority';
export type EdgeId = 'client-mcp' | 'client-auth' | 'mcp-auth' | 'mcp-data' | 'client-gmail' | 'gmail-authority';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DiagramNode {
  id: NodeId;
  title: string;
  lines: readonly string[];
  wide: Box;
  tall: Box;
}

export interface DiagramEdge {
  id: EdgeId;
  wide: string;
  tall: string;
}

export interface DiagramView {
  id: DiagramMode;
  label: string;
  caption: string;
  nodes: readonly NodeId[];
  edges: readonly EdgeId[];
}

export const VIEWBOX = { wide: '0 0 1120 560', tall: '0 0 360 880' } as const;

export const NODES: readonly DiagramNode[] = [
  {
    id: 'client',
    title: 'Asistentul tău AI',
    lines: ['Claude, Cursor, ChatGPT'],
    wide: { x: 10, y: 150, w: 270, h: 110 },
    tall: { x: 60, y: 8, w: 290, h: 84 },
  },
  {
    id: 'mcp',
    title: 'Civiti MCP',
    lines: ['/mcp, cu contul tău', '/mcp/public, fără cont', '30 de cereri pe minut'],
    wide: { x: 425, y: 24, w: 270, h: 150 },
    tall: { x: 60, y: 148, w: 290, h: 132 },
  },
  {
    id: 'auth',
    title: 'Civiti.Auth',
    lines: ['OAuth 2.1 și consimțământ', 'Fără chei API (DCR)'],
    wide: { x: 425, y: 246, w: 270, h: 120 },
    tall: { x: 60, y: 332, w: 290, h: 104 },
  },
  {
    id: 'data',
    title: 'Date Civiti',
    lines: ['Probleme, autorități, conturi'],
    wide: { x: 840, y: 150, w: 270, h: 110 },
    tall: { x: 60, y: 488, w: 290, h: 84 },
  },
  {
    id: 'gmail',
    title: 'Gmailul tău',
    lines: ['Trimite doar cu aprobarea ta'],
    wide: { x: 10, y: 440, w: 270, h: 100 },
    tall: { x: 60, y: 636, w: 290, h: 84 },
  },
  {
    id: 'authority',
    title: 'Autoritatea',
    lines: ['Primește emailul de la tine'],
    wide: { x: 840, y: 440, w: 270, h: 100 },
    tall: { x: 60, y: 780, w: 290, h: 84 },
  },
];

export const EDGES: readonly DiagramEdge[] = [
  { id: 'client-mcp', wide: 'M280 190 C 350 190, 350 100, 425 100', tall: 'M205 92 V 148' },
  { id: 'client-auth', wide: 'M280 225 C 350 225, 350 306, 425 306', tall: 'M100 92 C 30 150, 30 320, 60 372' },
  { id: 'mcp-auth', wide: 'M560 174 V 246', tall: 'M205 280 V 332' },
  { id: 'mcp-data', wide: 'M695 100 C 770 100, 770 205, 840 205', tall: 'M320 280 C 356 340, 356 460, 320 488' },
  { id: 'client-gmail', wide: 'M145 260 V 440', tall: 'M84 92 C 6 240, 6 560, 60 672' },
  { id: 'gmail-authority', wide: 'M280 490 H 840', tall: 'M205 720 V 780' },
];

export const VIEWS: readonly DiagramView[] = [
  {
    id: 'account',
    label: 'Cu contul tău',
    caption:
      'Te autentifici pe pagina Civiti și aprobi accesul. Asistentul primește permisiunile civiti.read și civiti.write, doar pentru contul tău, și le poți retrage oricând.',
    nodes: ['client', 'mcp', 'auth', 'data'],
    edges: ['client-mcp', 'client-auth', 'mcp-auth', 'mcp-data'],
  },
  {
    id: 'public',
    label: 'Fără cont',
    caption:
      'Endpointul /mcp/public nu cere autentificare. Vede doar ce e public: probleme, autorități, categorii. Ajunge pentru petiții, dar nu vede problemele tale.',
    nodes: ['client', 'mcp', 'data'],
    edges: ['client-mcp', 'mcp-data'],
  },
  {
    id: 'send',
    label: 'La trimitere',
    caption:
      'Petiția nu trece prin Civiti. Pleacă din căsuța ta, prin Gmail conectat, după ce aprobi. Fără conector Gmail, copiezi textul și o trimiți tu.',
    nodes: ['client', 'gmail', 'authority'],
    edges: ['client-gmail', 'gmail-authority'],
  },
];
