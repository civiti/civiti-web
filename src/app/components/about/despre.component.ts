import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { APP_STORE_URL, GITHUB_URL, REVOLUT_URL } from '../../constants/urls';

@Component({
  selector: 'app-despre',
  standalone: true,
  imports: [RouterLink, NzIconModule],
  templateUrl: './despre.component.html',
  styleUrl: './despre.component.scss',
})
export class DespreComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly appStoreUrl = APP_STORE_URL;
  readonly githubUrl = GITHUB_URL;
  readonly revolutUrl = REVOLUT_URL;

  private readonly jsonLdId = 'despre-page-jsonld';

  ngOnInit(): void {
    this.injectStructuredData();
    this.destroyRef.onDestroy(() => this.removeStructuredData());
  }

  private injectStructuredData(): void {
    this.removeStructuredData();

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'Despre Civiti',
      description:
        'Povestea din spatele platformei Civiti — cine o construiește, de ce și cum funcționează.',
      url: 'https://civiti.ro/despre',
      mainEntity: {
        '@type': 'Organization',
        name: 'Civiti',
        url: 'https://civiti.ro',
        description:
          'Platformă de participare civică din România care ajută cetățenii să raporteze probleme locale și să presează autoritățile prin campanii coordonate.',
        sameAs: [this.githubUrl, this.appStoreUrl],
      },
    };

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = this.jsonLdId;
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  private removeStructuredData(): void {
    const existing = this.document.getElementById(this.jsonLdId);
    if (existing) {
      existing.remove();
    }
  }
}
