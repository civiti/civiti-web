import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CIVITI_MCP_PUBLIC_URL, CIVITI_MCP_URL } from '../../../constants/urls';
import { GUIDE_ARTICLES } from '../../../generated/guide-data';
import { SeoService } from '../../../services/seo.service';
import { guideSocialCard } from '../guide-social-card';
import {
  AGENT_PROMPTS,
  GUIDE_CLIENTS,
  GUIDE_SLUG,
  LEGAL_POINTS,
  PETITION_KINDS,
  SCREENSHOTS,
  SERVER_REFERENCE_ISSUE_URL,
  SERVER_REFERENCE_URL,
  SKILL_URL,
  TEST_ROWS,
  TROUBLESHOOTING,
} from './assistant-guide.data';
import { ClientSetupComponent } from './client-setup/client-setup.component';
import { ConnectionDiagramComponent } from './connection-diagram/connection-diagram.component';
import { CopyButtonComponent } from './copy-button/copy-button.component';
import { ExplainerPlayerComponent } from './explainer-player/explainer-player.component';
import { PetitionEmailComponent } from './petition-email/petition-email.component';
import { PetitionFlowComponent } from './petition-flow/petition-flow.component';
import { PromptCardComponent } from './prompt-card/prompt-card.component';

const SECTIONS = [
  { id: 'pe-scurt', label: 'Pe scurt' },
  { id: 'film', label: 'Film' },
  { id: 'prompturi', label: 'Prompturi' },
  { id: 'pas-cu-pas', label: 'Pas cu pas' },
  { id: 'cum-functioneaza', label: 'Cum funcționează' },
  { id: 'petitii', label: 'Petițiile' },
  { id: 'siguranta', label: 'Siguranță' },
  { id: 'probleme', label: 'Probleme frecvente' },
];

@Component({
  selector: 'app-assistant-guide',
  standalone: true,
  imports: [
    RouterLink,
    NzIconModule,
    ClientSetupComponent,
    ConnectionDiagramComponent,
    CopyButtonComponent,
    ExplainerPlayerComponent,
    PetitionEmailComponent,
    PetitionFlowComponent,
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

  readonly sections = SECTIONS;
  readonly prompts = AGENT_PROMPTS;
  readonly fullPrompt = AGENT_PROMPTS[0];
  readonly clients = GUIDE_CLIENTS;
  readonly kinds = PETITION_KINDS;
  readonly legal = LEGAL_POINTS;
  readonly tests = TEST_ROWS;
  readonly screens = SCREENSHOTS;
  readonly troubleshooting = TROUBLESHOOTING;

  readonly mcpUrl = CIVITI_MCP_URL;
  readonly mcpPublicUrl = CIVITI_MCP_PUBLIC_URL;
  readonly skillUrl = SKILL_URL;
  readonly referenceUrl = SERVER_REFERENCE_URL;
  readonly referenceIssueUrl = SERVER_REFERENCE_ISSUE_URL;

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
  jump(event: Event, id: string): void {
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
