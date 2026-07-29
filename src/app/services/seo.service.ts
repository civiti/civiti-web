import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { SITE_URL } from '../constants/urls';

/**
 * The card size every mainstream unfurler renders at (1.91:1). Facebook,
 * LinkedIn, WhatsApp and X all crop to it; anything taller loses its subject to
 * a centre crop, and anything heavier risks being skipped — WhatsApp in
 * particular gives up on large images and falls back to a bare text link.
 */
export const SOCIAL_CARD_WIDTH = 1200;
export const SOCIAL_CARD_HEIGHT = 630;

/**
 * An image handed to a link unfurler. `width`/`height`/`type` are optional
 * because they are only ever declared for images whose dimensions we actually
 * know — a wrong hint renders worse than a missing one.
 */
export interface SocialImage {
  url: string;
  width?: number;
  height?: number;
  type?: string;
  alt?: string;
}

export interface SeoConfig {
  title?: string;
  description?: string;
  ogImage?: SocialImage;
  ogUrl?: string;
  ogType?: string;
  robots?: string;
  /** ISO 8601. Only emitted when `ogType` is `article`. */
  publishedTime?: string;
}

const DEFAULTS = {
  title: 'Civiti — Participare Civică',
  description: 'Civiti — Platformă de participare civică din România. Raportează probleme locale și presează autoritățile prin campanii coordonate email.',
  ogType: 'website',
} as const;

/**
 * Absolute by construction. The Open Graph spec requires an absolute URL and,
 * while Facebook resolves a relative one against the page, WhatsApp, LinkedIn
 * and Slack drop the card entirely — which is what a shared link looks like
 * when it renders as plain text.
 *
 * Keep in sync with the same tags in `src/index.html`, which cannot import
 * this constant.
 */
const DEFAULT_OG_IMAGE: SocialImage = {
  url: `${SITE_URL}/images/logo/civiti-og-image.png`,
  width: SOCIAL_CARD_WIDTH,
  height: SOCIAL_CARD_HEIGHT,
  type: 'image/png',
  alt: 'Civiti — platformă de participare civică din România',
};

const SUPABASE_PUBLIC_OBJECT_PATH = '/storage/v1/object/public/';
const SUPABASE_RENDER_IMAGE_PATH = '/storage/v1/render/image/public/';

/**
 * Turns an issue photo into a share card.
 *
 * Issue photos are phone originals — portrait, multi-megapixel, and served with
 * `cache-control: no-cache`. Pointing `og:image` at one gives every unfurler a
 * horizontal slice of the middle of the frame, which for a pothole report is
 * usually asphalt. Supabase Storage's transformation endpoint returns the same
 * object cropped to the card at a fraction of the weight, cached for an hour.
 *
 * Returns `undefined` when there is no photo, so the caller falls back to the
 * branded default card. A photo hosted somewhere we cannot resize is passed
 * through untouched rather than dropped — worse framing beats no picture.
 */
export function socialCardFromPhoto(photoUrl: string | undefined, alt: string): SocialImage | undefined {
  if (!photoUrl) {
    return undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(photoUrl);
  } catch {
    return undefined;
  }

  if (!parsed.pathname.includes(SUPABASE_PUBLIC_OBJECT_PATH)) {
    return { url: photoUrl, alt };
  }

  parsed.pathname = parsed.pathname.replace(SUPABASE_PUBLIC_OBJECT_PATH, SUPABASE_RENDER_IMAGE_PATH);
  parsed.searchParams.set('width', String(SOCIAL_CARD_WIDTH));
  parsed.searchParams.set('height', String(SOCIAL_CARD_HEIGHT));
  parsed.searchParams.set('resize', 'cover');

  return {
    url: parsed.toString(),
    width: SOCIAL_CARD_WIDTH,
    height: SOCIAL_CARD_HEIGHT,
    alt,
    // No `type`: the endpoint content-negotiates WebP, so the source extension
    // is not a reliable claim about the bytes a given client receives.
  };
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  /**
   * Set by `updateMetaTags`, cleared on every `NavigationStart`.
   *
   * `App` applies the route's static `data.seo` on `NavigationEnd` — i.e.
   * *after* the routed component's `ngOnInit`. Without this flag, `/ghid/:slug`
   * and `/issue/:id`, which build their tags from data the router cannot know,
   * would have them overwritten with the site defaults on every in-app
   * navigation.
   */
  private claimedByComponent = false;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.claimedByComponent = false;
      });
  }

  /** Publishes tags a component derived from its own data. Always wins. */
  updateMetaTags(config: SeoConfig): void {
    this.claimedByComponent = true;
    this.apply(config);
  }

  /**
   * Publishes a route's static `data.seo`, or the site defaults when it has
   * none — unless the routed component already published something richer.
   */
  applyRouteData(config: SeoConfig | undefined): void {
    if (this.claimedByComponent) {
      return;
    }
    this.apply(config ?? {});
  }

  private apply(config: SeoConfig): void {
    const pageTitle = config.title ? `${config.title} | Civiti` : DEFAULTS.title;
    // `og:site_name` already carries the brand. Repeating it here spends the
    // ~2 lines WhatsApp and Messenger give a headline on a word the reader can
    // already see, which on a long issue title is the whole visible headline.
    const socialTitle = config.title || DEFAULTS.title;
    const description = config.description || DEFAULTS.description;
    const ogType = config.ogType || DEFAULTS.ogType;
    const url = config.ogUrl || this.selfUrl();

    this.titleService.setTitle(pageTitle);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: socialTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: socialTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    this.applyImage(config.ogImage ?? DEFAULT_OG_IMAGE);
    this.setProperty('article:published_time', ogType === 'article' ? config.publishedTime : undefined);

    if (config.robots) {
      this.meta.updateTag({ name: 'robots', content: config.robots });
    }

    this.updateCanonicalUrl(url);
  }

  private applyImage(image: SocialImage): void {
    this.setProperty('og:image', image.url);
    // Declaring the dimensions up front is what makes the *first* share of a
    // URL render with a picture: without them Facebook and LinkedIn queue an
    // asynchronous fetch to measure the file and serve a text-only card until
    // it lands — which is usually after the reader has scrolled past.
    this.setProperty('og:image:width', image.width?.toString());
    this.setProperty('og:image:height', image.height?.toString());
    this.setProperty('og:image:type', image.type);
    this.setProperty('og:image:alt', image.alt);
    this.setName('twitter:image', image.url);
    this.setName('twitter:image:alt', image.alt);
  }

  private setProperty(property: string, content: string | undefined): void {
    if (content) {
      this.meta.updateTag({ property, content });
    } else {
      this.meta.removeTag(`property="${property}"`);
    }
  }

  private setName(name: string, content: string | undefined): void {
    if (content) {
      this.meta.updateTag({ name, content });
    } else {
      this.meta.removeTag(`name="${name}"`);
    }
  }

  /**
   * Absolute, query-free URL for the current route. The query string is
   * stripped so `/bucuresti?page=2&view=harta` and every `?utm_*` variant
   * unfurl as — and are indexed as — the same page instead of splitting the
   * engagement counts a share accumulates.
   *
   * Tolerates being called before the first navigation, when `Router.url` is
   * still `'/'`: `App` reads route data from its constructor.
   */
  private selfUrl(): string {
    const path = this.router.url.split(/[?#]/)[0];
    return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path.replace(/\/+$/, '')}`;
  }

  /** Reuses the existing link so the document always has exactly one. */
  private updateCanonicalUrl(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
