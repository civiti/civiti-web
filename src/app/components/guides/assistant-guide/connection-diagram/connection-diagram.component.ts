import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DiagramMode, EDGES, NODES, VIEWBOX, VIEWS } from './connection-diagram.data';

type Layout = 'wide' | 'tall';

/**
 * Who talks to whom. Drawn as inline SVG so the labels use the page's fonts and
 * stay selectable, and laid out twice: wide for desktop, tall for phones, where
 * a scaled-down wide diagram would be unreadable.
 */
@Component({
  selector: 'app-connection-diagram',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './connection-diagram.component.html',
  styleUrl: './connection-diagram.component.scss',
})
export class ConnectionDiagramComponent {
  readonly views = VIEWS;
  readonly mode = signal<DiagramMode>('account');
  readonly view = computed(() => VIEWS.find((v) => v.id === this.mode()) ?? VIEWS[0]);

  readonly layouts = computed(() => {
    const view = this.view();
    return (['wide', 'tall'] as const).map((layout: Layout) => ({
      layout,
      viewBox: VIEWBOX[layout],
      edges: EDGES.map((edge) => ({ id: edge.id, d: edge[layout], on: view.edges.includes(edge.id) })),
      nodes: NODES.map((node) => {
        const box = node[layout];
        return {
          id: node.id,
          title: node.title,
          box,
          on: view.nodes.includes(node.id),
          textX: box.x + 20,
          titleY: box.y + 36,
          lines: node.lines.map((text, i) => ({ text, y: box.y + 64 + i * 25 })),
        };
      }),
    }));
  });

  readonly description =
    'Asistentul tău AI vorbește cu serverul Civiti MCP, care are două intrări: /mcp cu autentificare și /mcp/public fără. ' +
    'Autentificarea trece prin Civiti.Auth, cu OAuth 2.1 și consimțământ, iar datele vin din baza Civiti. ' +
    'Separat, asistentul trimite petițiile prin Gmailul tău către autoritate, fără să treacă prin Civiti.';

  setMode(mode: DiagramMode): void {
    this.mode.set(mode);
  }
}
