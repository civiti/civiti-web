import { ChangeDetectionStrategy, Component, afterNextRender, signal } from '@angular/core';
import { EXPLAINER_TRANSCRIPT } from '../explainer-transcript.generated';

/**
 * Nothing moves until the reader presses play: no autoplay, and `preload="none"`
 * so the page never pays for the video on load. Readers who ask for reduced
 * motion get the transcript open, as the alternative to watching.
 */
@Component({
  selector: 'app-explainer-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="player">
      <div class="player__frame">
        <video
          controls
          playsinline
          preload="none"
          width="1920"
          height="1080"
          poster="/media/asistent-ai/explainer-poster.jpg"
          aria-label="Film explicativ de 76 de secunde, fără sunet, cu subtitrări în română: de la un trotuar blocat la o petiție înregistrată și o revenire după cinci săptămâni.">
          <source src="/media/asistent-ai/explainer.mp4" type="video/mp4" />
          <track kind="captions" src="/media/asistent-ai/explainer.ro.vtt" srclang="ro" label="Română" default />
          <a href="/media/asistent-ai/explainer.mp4">Descarcă filmul</a>
        </video>
      </div>
      <figcaption class="c-small c-muted">Film fără sunet, 76 de secunde, cu subtitrări în română. Persoanele, adresele și numerele din film sunt inventate.</figcaption>
    </figure>

    <details class="transcript" [open]="reducedMotion()">
      <summary>Citește transcrierea</summary>
      <ol class="transcript__list">
        @for (line of transcript; track line) {
          <li>{{ line }}</li>
        }
      </ol>
    </details>
  `,
  styleUrl: './explainer-player.component.scss',
})
export class ExplainerPlayerComponent {
  readonly transcript = EXPLAINER_TRANSCRIPT;
  readonly reducedMotion = signal(false);

  constructor() {
    afterNextRender(() => {
      this.reducedMotion.set(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    });
  }
}
