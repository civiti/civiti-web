import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CodeSpansPipe } from '../code-spans.pipe';
import { CIVITI_AUTH_HOST, CONSENT_SCOPES, WALK_STEPS } from './connect-walkthrough.data';

/**
 * The four moments of connecting an app to a Civiti account, as WAI-ARIA tabs. The
 * sign-in and consent screens are inert recreations, not forms: nothing on civiti.ro
 * should look like a place to type a password. Every panel is prerendered and only
 * hidden, so an agent reading the page sees all four.
 */
@Component({
  selector: 'app-connect-walkthrough',
  standalone: true,
  imports: [RouterLink, NzIconModule, CodeSpansPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './connect-walkthrough.component.html',
  styleUrl: './connect-walkthrough.component.scss',
})
export class ConnectWalkthroughComponent {
  private readonly document = inject(DOCUMENT);

  readonly authHost = CIVITI_AUTH_HOST;
  readonly scopes = CONSENT_SCOPES;
  readonly active = signal(0);
  /** Highlighted note within the open step; 1-based to match the pins. */
  readonly note = signal(1);

  readonly steps = computed(() =>
    WALK_STEPS.map((step, i) => ({
      ...step,
      number: i + 1,
      notes: step.notes.map((note, n) => ({ ...note, number: n + 1 })),
    })),
  );

  select(index: number): void {
    this.active.set(index);
    this.note.set(1);
  }

  pick(number: number): void {
    this.note.set(number);
  }

  onKeydown(event: KeyboardEvent): void {
    const last = WALK_STEPS.length - 1;
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
    this.select(next);
    this.document.getElementById(`walk-tab-${WALK_STEPS[next].id}`)?.focus();
  }
}
