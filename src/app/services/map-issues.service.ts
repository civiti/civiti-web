import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { IssueCategory, IssueItem } from '../types/civica-api.types';

/**
 * The subset of the issues-list filter state the map cares about.
 *
 * `page`, `pageSize` and `sortBy` are deliberately absent: the map plots every
 * issue that matches the filters regardless of which page the list is showing,
 * and re-sorting the list must never trigger a refetch here.
 */
export interface MapIssueFilters {
  city?: string | null;
  district?: string | null;
  category?: IssueCategory | null;
  address?: string | null;
  /** Single status or comma-separated list, e.g. 'Active,Resolved'. */
  status?: string | null;
}

/** An issue we know we can actually put a pin on. */
export type PlottableIssue = IssueItem & { latitude: number; longitude: number };

/**
 * The backend clamps pageSize to [1, 100]. There is no dedicated map endpoint
 * and none is planned — the map is fed from the same GET /api/issues the list
 * uses. Current public volume is single digits and the realistic near-term
 * ceiling is tens, so one page of 100 covers every issue we can render.
 */
const MAP_PAGE_SIZE = 100;

/** How long a fetched filter set stays fresh before we hit the API again. */
const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  items: PlottableIssue[];
  fetchedAt: number;
}

/**
 * Loads the full, page-independent set of issues the map plots.
 *
 * Signal-based on purpose: this data is not the paginated `issues` NgRx slice.
 * It answers a different question ("everything matching the filters") and
 * putting it in the store would mean either a second slice that shadows the
 * first or a paginated slice that lies about its contents.
 */
@Injectable({
  providedIn: 'root'
})
export class MapIssuesService {
  private readonly apiService = inject(ApiService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _issues = signal<PlottableIssue[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  /** Issues with plottable coordinates for the currently loaded filter set. */
  readonly issues = this._issues.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly requests$ = new Subject<MapIssueFilters>();
  private readonly cache = new Map<string, CacheEntry>();

  /** Key of the filter set the public signals currently describe. */
  private activeKey: string | null = null;

  constructor() {
    // switchMap so that flipping filters quickly cancels the in-flight request
    // instead of racing it — the last filter set always wins.
    //
    // This pipeline is never fed on the server (`load()` bails out before
    // `requests$.next()`), so it needs no isPlatformServer/timeout guard: no
    // observable here can be pending while SSR waits for stability.
    this.requests$
      .pipe(
        switchMap(filters => this.fetch(filters)),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  /**
   * Load the issues matching `filters`. Safe to call on every filter change:
   * identical filter sets are served from cache and concurrent duplicates are
   * dropped. No-op during SSR.
   */
  load(filters: MapIssueFilters): void {
    // The map is browser-only (/bucuresti is RenderMode.Server) — never spend a
    // request, or block prerender stability, on the server.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const key = MapIssuesService.cacheKey(filters);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      this.activeKey = key;
      this._issues.set(cached.items);
      this._error.set(null);
      this._isLoading.set(false);
      return;
    }

    // Same filter set already in flight — let it land rather than restarting it.
    if (key === this.activeKey && this._isLoading()) {
      return;
    }

    this.activeKey = key;
    this.requests$.next(filters);
  }

  /** Drop the cached result for `filters` and fetch it again (retry button). */
  refresh(filters: MapIssueFilters): void {
    this.cache.delete(MapIssuesService.cacheKey(filters));
    this.activeKey = null;
    this.load(filters);
  }

  private fetch(filters: MapIssueFilters): Observable<unknown> {
    const key = MapIssuesService.cacheKey(filters);

    this._isLoading.set(true);
    this._error.set(null);

    return this.apiService
      .getIssues({
        page: 1,
        pageSize: MAP_PAGE_SIZE,
        city: filters.city ?? undefined,
        district: filters.district ?? undefined,
        category: filters.category ?? undefined,
        address: filters.address ?? undefined,
        status: filters.status ?? undefined
      })
      .pipe(
        map(result => (result?.items ?? []).filter(MapIssuesService.isPlottable)),
        tap(items => {
          this.cache.set(key, { items, fetchedAt: Date.now() });

          // A newer filter set may have taken over while this was in flight.
          if (key === this.activeKey) {
            this._issues.set(items);
            this._isLoading.set(false);
          }
        }),
        catchError(error => {
          console.error('[MapIssuesService] Failed to load issues for the map:', error);

          if (key === this.activeKey) {
            this._issues.set([]);
            this._error.set('Nu am putut încărca problemele pe hartă.');
            this._isLoading.set(false);
          }

          return of(null);
        })
      );
  }

  /**
   * Keep only issues we can honestly put on a map.
   *
   * `Issue.Latitude`/`Issue.Longitude` are non-nullable doubles server-side, so
   * an issue whose coordinates were never set arrives as exactly 0/0. That is a
   * sentinel, not data: (0, 0) is Null Island in the Gulf of Guinea, and one
   * such pin would both lie to the user and drag fitBounds out into the
   * Atlantic, zooming every real Bucharest pin off screen. The `IssueItem` type
   * also marks the fields optional, so null/undefined mean "absent" too.
   */
  private static isPlottable(issue: IssueItem): issue is PlottableIssue {
    const lat = issue.latitude;
    const lng = issue.longitude;

    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return false;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return false;
    }
    if (lat === 0 && lng === 0) {
      return false;
    }

    return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  }

  /** Stable identity for a filter set, used for caching and de-duplication. */
  private static cacheKey(filters: MapIssueFilters): string {
    return [
      filters.city ?? '',
      filters.district ?? '',
      filters.category ?? '',
      filters.address ?? '',
      filters.status ?? ''
    ].join('|');
  }
}
