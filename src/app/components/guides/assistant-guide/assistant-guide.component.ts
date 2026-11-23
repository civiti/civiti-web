import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { GUIDE_ARTICLES } from '../../../generated/guide-data';
import { SeoService } from '../../../services/seo.service';
import { guideSocialCard } from '../guide-social-card';
import {
  AGENT_PROMPT,
  GUIDE_CLIENTS,
  GUIDE_SLUG,
  HOW_IT_WORKS,
  SAFETY_POINTS,
  SERVER_REFERENCE_URL,
  TROUBLESHOOTING,
} from './assistant-guide.data';
import { CodeSpansPipe } from './code-spans.pipe';
import { ClientSetupComponent } from './client-setup/client-setup.component';
import { CopyButtonComponent } from './copy-button/copy-button.component';
import { ExplainerPlayerComponent } from './explainer-player/explainer-player.component';
import { PromptCardComponent } from './prompt-card/prompt-card.component';

@Component({
  selector: 'app-assistant-guide',
  standalone: true,
  imports: [
    RouterLink,
    NzIconModule,
    ClientSetupComponent,
    CodeSpansPipe,
    CopyButtonComponent,
    ExplainerPlayerComponent,
    PromptCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './assistant-guide.component.html',
  styleUrl: './assistant-guide.component.scss',
})
export class AssistantGuideComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly document = inject(DOCUMENT);

  // The stub in src/content/guides is the single source for title, description
  // and cover, so the /ghid card and this page cannot disagree.
  readonly article = GUIDE_ARTICLES.find((a) => a.slug === GUIDE_SLUG)!;

  readonly prompt = AGENT_PROMPT;
  readonly clients = GUIDE_CLIENTS;
  readonly steps = HOW_IT_WORKS;
  readonly safety = SAFETY_POINTS;
  readonly troubleshooting = TROUBLESHOOTING;
  readonly referenceUrl = SERVER_REFERENCE_URL;

  ngOnInit(): void {
    this.seo.updateMetaTags({
      title: this.article.title,
      description: this.article.description,
      ogType: 'article',
      publishedTime: this.article.publishedAt,
      ogImage: guideSocialCard(this.article),
    });
  }

  /**
   * Scrolls itself instead of leaving the fragment to the router, which is set up
   * to return to the top of the page and ignores `scroll-margin-top`.
   */
  jump(event: MouseEvent, id: string): void {
    // Leave modified clicks to the browser, so a section can still open in a new tab.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const target = this.document.getElementById(id);
    if (!target) {
      return;
    }
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(history.state, '', `#${id}`);
  }
}
