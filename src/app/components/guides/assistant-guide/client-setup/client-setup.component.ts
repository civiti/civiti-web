import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { GuideClient } from '../assistant-guide.data';
import { CopyButtonComponent } from '../copy-button/copy-button.component';

/**
 * Per-client setup as WAI-ARIA tabs. Every panel is prerendered and only hidden,
 * so an agent reading the page sees the steps for all clients, whichever is open.
 */
@Component({
  selector: 'app-client-setup',
  standalone: true,
  imports: [NzIconModule, CopyButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './client-setup.component.html',
  styleUrl: './client-setup.component.scss',
})
export class ClientSetupComponent {
  private readonly document = inject(DOCUMENT);

  readonly clients = input.required<readonly GuideClient[]>();
  readonly active = signal(0);

  select(index: number): void {
    this.active.set(index);
  }

  onKeydown(event: KeyboardEvent): void {
    const last = this.clients().length - 1;
    const moves: Record<string, number> = {
      ArrowRight: this.active() === last ? 0 : this.active() + 1,
      ArrowLeft: this.active() === 0 ? last : this.active() - 1,
      Home: 0,
      End: last,
    };
    const next = moves[event.key];
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    this.active.set(next);
    this.document.getElementById(`client-tab-${this.clients()[next].id}`)?.focus();
  }
}
