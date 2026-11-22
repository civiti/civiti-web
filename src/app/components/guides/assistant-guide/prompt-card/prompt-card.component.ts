import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AgentPrompt } from '../assistant-guide.data';
import { CopyButtonComponent } from '../copy-button/copy-button.component';

@Component({
  selector: 'app-prompt-card',
  standalone: true,
  imports: [NzIconModule, CopyButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './prompt-card.component.html',
  styleUrl: './prompt-card.component.scss',
})
export class PromptCardComponent {
  readonly prompt = input.required<AgentPrompt>();
  /** The recommended prompt: gets the page's one orange action. */
  readonly primary = input(false);

  readonly expanded = signal(false);
  readonly copyTone = computed(() => (this.primary() ? 'c-btn--signal' : 'c-btn--ink'));
  /** Romanian puts "de" between a number and its noun from 20 up: 9 rânduri, 27 de rânduri. */
  readonly lineLabel = computed(() => {
    const n = this.prompt().text.split('\n').length;
    const rest = n % 100;
    return `${n} ${rest === 0 || rest >= 20 ? 'de ' : ''}rânduri, în engleză`;
  });
  readonly panelId = computed(() => `prompt-${this.prompt().id}`);

  toggle(): void {
    this.expanded.update((open) => !open);
  }
}
