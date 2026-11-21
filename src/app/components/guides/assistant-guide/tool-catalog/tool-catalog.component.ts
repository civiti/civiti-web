import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TOOL_GROUPS } from './tool-catalog.data';

type ToolFilter = 'all' | 'skill' | 'writes';

const FILTERS: readonly { id: ToolFilter; label: string }[] = [
  { id: 'all', label: 'Toate' },
  { id: 'skill', label: 'Folosite de abilitate' },
  { id: 'writes', label: 'Schimbă ceva pe Civiti' },
];

/**
 * Every Civiti MCP tool, grouped by what it needs. The filter only dims the others,
 * so the full list stays in the prerendered page for agents and search engines.
 */
@Component({
  selector: 'app-tool-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tool-catalog.component.html',
  styleUrl: './tool-catalog.component.scss',
})
export class ToolCatalogComponent {
  readonly filters = FILTERS;
  readonly filter = signal<ToolFilter>('all');

  readonly groups = computed(() => {
    const filter = this.filter();
    return TOOL_GROUPS.map((group) => {
      const tools = group.tools.map((tool) => ({
        ...tool,
        match: filter === 'all' || (filter === 'skill' ? tool.skill : tool.writes),
      }));
      return { ...group, tools, matches: tools.filter((tool) => tool.match).length };
    });
  });

  readonly total = TOOL_GROUPS.reduce((sum, group) => sum + group.tools.length, 0);

  setFilter(id: ToolFilter): void {
    this.filter.set(id);
  }
}
