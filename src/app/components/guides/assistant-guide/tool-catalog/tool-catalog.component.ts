import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TOOL_GROUPS } from './tool-catalog.data';

type ToolFilter = 'all' | 'skill' | 'writes';

const FILTERS: readonly { id: ToolFilter; label: string }[] = [
  { id: 'all', label: 'Toate' },
  { id: 'skill', label: 'Folosite de abilitate' },
  { id: 'writes', label: 'Schimbă ceva pe Civiti' },
];

/**
 * Every Civiti MCP tool, grouped by what it needs. The filter hides the others only
 * in the browser: the prerendered page always has all of them, for agents and search.
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

  /** Announced to screen readers when the filter changes. */
  readonly status = computed(() =>
    this.filter() === 'all'
      ? ''
      : `${this.groups().reduce((sum, group) => sum + group.matches, 0)} din ${this.total} unelte se potrivesc filtrului.`,
  );

  setFilter(id: ToolFilter): void {
    this.filter.set(id);
  }
}
