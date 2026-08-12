import { Pipe, PipeTransform } from '@angular/core';

/**
 * The shape these pipes need from a photo, satisfied structurally by both
 * `IssuePhotoResponse` and `IssueResolutionPhotoResponse`.
 *
 * A plain interface rather than a generic parameter: Angular's template type checker resolves a
 * generic `transform` to its constraint instead of inferring the argument, so a generic pipe
 * hands the template back the bare constraint and `photo.url` stops compiling. `isPrimary` is
 * optional because a resolution set has no primary — those photos fall through to display order.
 */
export interface DisplayablePhoto {
  id: string;
  url: string;
  description?: string;
  isPrimary?: boolean;
}

/**
 * The photo that best represents a set: the one flagged primary, else the first in display
 * order. Mirrors the pick already used for the OG social card in issue-detail.component.ts.
 */
@Pipe({ name: 'mainPhoto', standalone: true, pure: true })
export class MainPhotoPipe implements PipeTransform {
  transform(photos: readonly DisplayablePhoto[] | null | undefined): DisplayablePhoto | null {
    if (!photos || photos.length === 0) {
      return null;
    }
    return photos.find(p => p.isPrimary) ?? photos[0];
  }
}

/**
 * Everything in the set except the one already shown as the hero.
 *
 * Returns null rather than [] when nothing is left, so a caller can gate on a single
 * `@if (… ; as …)` and never emit an empty wrapper into a `> * + *` spacing rhythm. Filters by
 * id rather than slicing, so it stays correct whichever photo `mainPhoto` picked.
 */
@Pipe({ name: 'photosExcept', standalone: true, pure: true })
export class PhotosExceptPipe implements PipeTransform {
  transform(
    photos: readonly DisplayablePhoto[] | null | undefined,
    except: DisplayablePhoto | null,
  ): DisplayablePhoto[] | null {
    if (!photos) {
      return null;
    }
    const rest = photos.filter(p => p.id !== except?.id);
    return rest.length > 0 ? rest : null;
  }
}
