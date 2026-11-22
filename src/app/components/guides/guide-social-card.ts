import { SITE_URL } from '../../constants/urls';
import { GuideArticle } from '../../generated/guide-data';
import { SocialImage } from '../../services/seo.service';

/**
 * Each guide ships its own illustration in `public/guides/`. The page shows it
 * as a decorative hero, but crawlers only unfurl what `og:image` declares, so
 * without this every guide would share the same generic Civiti card.
 * Dimensions come from the build-time measurement in `scripts/build-guides.js`,
 * never from a hardcoded guess.
 */
export function guideSocialCard(article: GuideArticle): SocialImage | undefined {
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
