import {
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
} from '@angular/core';

import { NzIconModule } from 'ng-zorro-antd/icon';

/** The two ways the issues page can render its data. */
export type ViewMode = 'lista' | 'harta';

/**
 * Two-option segmented control that switches the issues page between the card
 * list and the map.
 *
 * Hand-built rather than nz-segmented: nz-segmented's radios share no `name`,
 * so there is no browser radio group and no keyboard grouping, and it emits no
 * role/aria of its own.
 */
@Component({
  selector: 'app-view-switcher',
  standalone: true,
  imports: [NzIconModule],
  templateUrl: './view-switcher.component.html',
  styleUrl: './view-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewSwitcherComponent {
  /** Two-way bindable selection: `[(mode)]="viewMode"`. */
  mode = model<ViewMode>('lista');

  // Derived state, so the template binds signals instead of calling methods.
  isLista = computed(() => this.mode() === 'lista');
  isHarta = computed(() => this.mode() === 'harta');

  select(next: ViewMode): void {
    if (this.mode() !== next) {
      this.mode.set(next);
    }
  }
}
