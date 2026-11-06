import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { GUIDE_ARTICLES, GuideArticle } from '../../../generated/guide-data';
import { TrustedHtmlPipe } from '../../../pipes/trusted-html.pipe';
import { SeoService } from '../../../services/seo.service';
import { guideSocialCard } from '../guide-social-card';

@Component({
  selector: 'app-guide-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, NzIconModule, TrustedHtmlPipe],
  templateUrl: './guide-detail.component.html',
  styleUrls: ['../_guide-content.scss', './guide-detail.component.scss'],
})
export class GuideDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seo = inject(SeoService);
  private destroyRef = inject(DestroyRef);

  article: GuideArticle | undefined;
  relatedArticles: GuideArticle[] = [];

  readonly categoryLabels: Readonly<Partial<Record<string, string>>> = {
    'ghid-practic': 'Ghid practic',
    'drepturi': 'Drepturi',
  };

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const slug = params.get('slug');
        this.loadArticle(slug);
      });
  }

  private loadArticle(slug: string | null): void {
    this.article = GUIDE_ARTICLES.find(a => a.slug === slug);

    if (!this.article) {
      this.router.navigate(['/ghid']);
      return;
    }

    this.seo.updateMetaTags({
      title: this.article.title,
      description: this.article.description,
      ogType: 'article',
      publishedTime: this.article.publishedAt,
      ogImage: guideSocialCard(this.article),
    });

    this.relatedArticles = GUIDE_ARTICLES
      .filter(a => a.slug !== slug && a.category === this.article!.category)
      .slice(0, 2);

    if (this.relatedArticles.length < 2) {
      const more = GUIDE_ARTICLES
        .filter(a => a.slug !== slug && !this.relatedArticles.includes(a))
        .slice(0, 2 - this.relatedArticles.length);
      this.relatedArticles.push(...more);
    }
  }
}
