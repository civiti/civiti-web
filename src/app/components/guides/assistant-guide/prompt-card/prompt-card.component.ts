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
  readonly lineCount = computed(() => this.prompt().text.split('\n').length);
  readonly panelId = computed(() => `prompt-${this.prompt().id}`);

  toggle(): void {
    this.expanded.update((open) => !open);
  }
}
