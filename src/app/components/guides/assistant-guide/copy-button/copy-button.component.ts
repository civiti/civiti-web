import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';

const COPIED_MS = 2200;

/**
 * Copies a fixed text and says so, visually and to screen readers. The clipboard
 * is only touched from the click handler, so the component is safe to prerender.
 */
@Component({
  selector: 'app-copy-button',
  standalone: true,
  imports: [NzIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="c-btn" [class]="tone()" (click)="copy()">
      <span nz-icon [nzType]="copied() ? 'check' : 'copy'" nzTheme="outline" aria-hidden="true"></span>
      <span>{{ copied() ? 'Copiat' : label() }}</span>
    </button>
    <span class="c-sr-only" aria-live="polite">{{ copied() ? 'Text copiat în clipboard' : '' }}</span>
  `,
  styles: `
    :host { display: inline-flex; }
    button { white-space: nowrap; }
  `,
})
export class CopyButtonComponent {
  private readonly document = inject(DOCUMENT);

  readonly text = input.required<string>();
  readonly label = input('Copiază');
  /** Extra `c-btn` modifiers, e.g. `c-btn--signal c-btn--lg`. */
  readonly tone = input('');

  readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  async copy(): Promise<void> {
    const ok = await this.write(this.text());
    if (!ok) {
      return;
    }
    this.copied.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.copied.set(false), COPIED_MS);
  }

  private async write(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return this.writeWithSelection(text);
    }
  }

  /** The async API is missing on plain http and refused in some in-app browsers. */
  private writeWithSelection(text: string): boolean {
    const area = this.document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.className = 'c-sr-only';
    this.document.body.appendChild(area);
    area.select();
    const ok = this.document.execCommand('copy');
    area.remove();
    return ok;
  }
}
