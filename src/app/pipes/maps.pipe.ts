import { Pipe, PipeTransform } from '@angular/core';

/**
 * Google Maps search URL for an issue's location, for the "open in Google Maps"
 * link beside the embedded map.
 *
 * Coordinates win when they are usable; otherwise it searches the address, so an
 * issue stored without coordinates (0,0 — the same case IssueDetailComponent
 * geocodes around) still points at the right street instead of the Gulf of Guinea.
 * Returns null when there is nothing to point at, so the caller can drop the link.
 */
@Pipe({
  name: 'mapsSearchUrl',
  standalone: true,
  pure: true
})
export class MapsSearchUrlPipe implements PipeTransform {
  private static readonly BASE = 'https://www.google.com/maps/search/?api=1&query=';

  transform(
    latitude: number | null | undefined,
    longitude: number | null | undefined,
    address?: string | null
  ): string | null {
    if (MapsSearchUrlPipe.isUsable(latitude) && MapsSearchUrlPipe.isUsable(longitude)) {
      return `${MapsSearchUrlPipe.BASE}${latitude},${longitude}`;
    }
    const query = address?.trim();
    return query ? MapsSearchUrlPipe.BASE + encodeURIComponent(query) : null;
  }

  /** Mirrors IssueDetailComponent.isValidCoordinate: finite and not the 0 placeholder. */
  private static isUsable(value: number | null | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value !== 0;
  }
}
