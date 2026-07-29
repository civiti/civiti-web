import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GUIDE_ARTICLES, GuideArticle } from '../../../generated/guide-data';
import { TrustedHtmlPipe } from '../../../pipes/trusted-html.pipe';
import { SeoService, SocialImage } from '../../../services/seo.service';
import { SITE_URL } from '../../../constants/urls';

/**
 * Each guide ships its own illustration in `public/guides/`. The page itself
 * renders no `<img>`, so without this every guide unfurls behind the same
 * generic Civiti card. Dimensions come from the build-time measurement in
 * `scripts/build-guides.js`, never from a hardcoded guess.
 */
function socialCard(article: GuideArticle): SocialImage | undefined {
  if (!article.image) {
    return undefined;
  }
  return {
    url: `${SITE_URL}${article.image}`,
    width: article.imageWidth,
    height: article.imageHeight,
    type: article.imageType,
    alt: article.title,
  };
}

@Component({
  selector: 'app-guide-detail',
  standalone: true,
  imports: [RouterLink, TrustedHtmlPipe],
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
      ogImage: socialCard(this.article),
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
