import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
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
  readonly text = input.required<string>();

  readonly expanded = signal(false);
  /** Romanian puts "de" between a number and its noun from 20 up: 9 rânduri, 27 de rânduri. */
  readonly lineLabel = computed(() => {
    const n = this.text().split('\n').length;
    const rest = n % 100;
    return `${n} ${rest === 0 || rest >= 20 ? 'de ' : ''}rânduri, în engleză`;
  });

  toggle(): void {
    this.expanded.update((open) => !open);
  }
}
