import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  output,
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { IssueCategory, IssueItem } from '../../types/civica-api.types';
import { MapIssueFilters, MapIssuesService, PlottableIssue } from '../../services/map-issues.service';
import { googleMapsConfig } from '../../../environments/google-maps-config';
import { StatusTextPipe, StatusColorPipe } from '../../pipes/status.pipe';
import { IsUrgentPipe } from '../../pipes/urgency.pipe';
import { DaysSincePipe } from '../../pipes/date.pipe';

/** What the map surface itself is doing, independent of the issue data. */
export type MapState = 'idle' | 'loading' | 'ready' | 'unavailable' | 'no-map-id';

/**
 * BILLING INVARIANT — DO NOT "OPTIMISE" THIS AWAY.
 *
 * Every `new google.maps.Map()` is a billable Dynamic Maps load. Panning,
 * zooming, and adding/removing markers afterwards are free. The issues page
 * toggles between the list and the map, so if the map were rebuilt on each
 * toggle we would pay for a map load per click.
 *
 * The map and the div it paints into therefore live at module scope, are
 * created exactly once per browser session, and are re-adopted (moved back into
 * the live component's DOM) whenever the component is re-created. Never move
 * `new maps.Map(...)` into a per-component-instance code path, and never
 * destroy these on component teardown.
 */
let sharedCanvas: HTMLDivElement | null = null;
let sharedMap: google.maps.Map | null = null;

const BUCHAREST_CENTER: google.maps.LatLngLiteral = { lat: 44.4268, lng: 26.1025 };

/** Padding (px) kept between the outermost pins and the map edge on a fit. */
const FIT_PADDING_PX = 56;

/** Fit never zooms past this: a single pin (a zero-area bounds) would otherwise slam to max zoom. */
const MAX_FIT_ZOOM = 16;
const MIN_FIT_ZOOM = 3;

/** Zoom used when there is exactly one pin — a point bounds has no scale to fit. */
const SINGLE_MARKER_ZOOM = 16;

/** Google's Mercator tile size, needed to derive a zoom level from a bounds. */
const WORLD_PX = 256;

/** Mirrors the existing waitForGoogleMaps() pattern in issues-list / issue-detail. */
const MAPS_POLL_INTERVAL_MS = 500;
const MAPS_POLL_MAX_ATTEMPTS = 20;

/**
 * Category glyph shown inside the pin. The pin body is white with a
 * status-coloured ring, so the glyph carries category and the ring carries
 * status/urgency — both read at a glance without a legend.
 */
const CATEGORY_GLYPHS: Record<IssueCategory, string> = {
  Infrastructure: '🚧',
  Environment: '🌳',
  Transportation: '🚌',
  PublicServices: '🏛',
  Safety: '⚠',
  Other: '📍'
};

const MAP_OPTIONS: google.maps.MapOptions = {
  center: BUCHAREST_CENTER,
  zoom: 12,
  // POI pins would compete with ours for clicks and mean nothing here.
  clickableIcons: false,
  // Google's logo sits bottom-left and its attribution/ToS bottom-right. We keep
  // our own chrome off the whole bottom strip, and switch off the controls that
  // would land in the top corners so nothing of Google's is ever covered.
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  zoomControl: true,
  // 'greedy' would swallow one-finger page scrolls on a map embedded mid-page.
  gestureHandling: 'cooperative'
};

interface MarkerEntry {
  issue: PlottableIssue;
  marker: google.maps.marker.AdvancedMarkerElement;
  listener: google.maps.MapsEventListener;
}

/**
 * Map view of the issues page: one pin per publicly visible issue matching the
 * list's filters, with our own detail card on click.
 *
 * No clustering, deliberately. Public volume is single digits today and tens for
 * the foreseeable future; at that scale a cluster hides issues instead of
 * organising them. Do not add @googlemaps/markerclusterer.
 */
@Component({
  selector: 'app-issues-map',
  standalone: true,
  imports: [
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzSpinModule,
    StatusTextPipe,
    StatusColorPipe,
    IsUrgentPipe,
    DaysSincePipe
  ],
  templateUrl: './issues-map.component.html',
  styleUrl: './issues-map.component.scss',
  // The pins are real DOM we build imperatively and hand to Google, which
  // re-parents them into the map's own overlay panes. Emulated encapsulation
  // never stamps its _ngcontent attribute on nodes Angular did not create, so
  // the pins would render unstyled. The .scss scopes itself by convention
  // instead: every selector carries the unique `issues-map` BEM prefix.
  encapsulation: ViewEncapsulation.None,
  host: {
    'class': 'issues-map',
    '(keydown.escape)': 'closeCard()'
  }
})
export class IssuesMapComponent {
  // ---- Inputs: the issues-list filter state. ----
  // Intentionally no page / pageSize / sortBy: the map shows every match no
  // matter which page the list is on, and re-sorting must not refetch it.
  city = input<string | null>(null);
  district = input<string | null>(null);
  category = input<IssueCategory | null>(null);
  address = input<string | null>(null);
  /** Single status or comma-separated list, matching the list's status filter. */
  status = input<string | null>('Active');

  // ---- Outputs ----
  /** Primary card action. The email campaign lives on the issue detail page. */
  sendEmail = output<IssueItem>();
  /** Secondary card action. */
  viewIssue = output<IssueItem>();
  /** User asked to narrow the page to a sector, e.g. 'Sector 3'. */
  filterByDistrict = output<string>();

  private readonly platformId = inject(PLATFORM_ID);
  private readonly mapIssues = inject(MapIssuesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  private readonly canvasHost = viewChild.required<ElementRef<HTMLDivElement>>('canvasHost');

  // Data state, straight off the signal-based service.
  readonly issues = this.mapIssues.issues;
  readonly isLoadingIssues = this.mapIssues.isLoading;
  readonly issuesError = this.mapIssues.error;

  private readonly _mapState = signal<MapState>('idle');
  readonly mapState = this._mapState.asReadonly();

  /** The issue whose detail card is open, if any. */
  readonly selectedIssue = signal<PlottableIssue | null>(null);

  readonly isBusy = computed(() => this.isLoadingIssues() || this._mapState() === 'loading');
  readonly isEmpty = computed(
    () => !this.isBusy() && !this.issuesError() && this.issues().length === 0
  );

  private readonly filters = computed<MapIssueFilters>(() => ({
    city: this.city(),
    district: this.district(),
    category: this.category(),
    address: this.address(),
    status: this.status()
  }));

  private map: google.maps.Map | null = null;
  private advancedMarker: typeof google.maps.marker.AdvancedMarkerElement | null = null;
  private markers: MarkerEntry[] = [];
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private fitListener: google.maps.MapsEventListener | null = null;

  constructor() {
    // The Maps JS API, `document` and the canvas element are all browser-only,
    // and /bucuresti is RenderMode.Server. afterNextRender never runs on the
    // server and only runs once the view (including #canvasHost) exists.
    afterNextRender(() => {
      void this.bootstrap();
    });

    // Refetch when a filter actually changes. Signal inputs compare by identity,
    // and these are all primitives, so binding them from the list's plain fields
    // cannot churn; the service de-duplicates anything that slips through.
    effect(() => {
      this.mapIssues.load(this.filters());
    });

    // Re-pin whenever the issue set changes, and once the map becomes ready.
    // Guarded by mapState, which only ever leaves 'idle' in the browser.
    //
    // renderMarkers() reads selectedIssue and writes it via closeCard(). Angular
    // tracks dependencies through nested calls, so without untracked() a marker
    // click would re-enter this effect and rebuild every pin — destroying the
    // highlight, replaying the entrance animation and re-fitting the camera on
    // top of the fly-to. Depend on issues() and _mapState() only.
    effect(() => {
      const issues = this.issues();

      if (this._mapState() !== 'ready') {
        return;
      }

      untracked(() => this.renderMarkers(issues));
    });

    this.destroyRef.onDestroy(() => {
      if (this.pollTimer !== null) {
        clearTimeout(this.pollTimer);
      }

      this.fitListener?.remove();
      this.clearMarkers();

      // Detach — never destroy. The map instance stays alive at module scope so
      // the next mount re-adopts it instead of buying a new Dynamic Maps load.
      // Removing the canvas lets the dying host element be collected.
      sharedCanvas?.remove();
    });
  }

  // ============================================
  // Template actions
  // ============================================

  closeCard(): void {
    this.selectedIssue.set(null);
    this.highlight(null);
  }

  requestEmail(issue: PlottableIssue): void {
    this.sendEmail.emit(issue);
  }

  requestView(issue: PlottableIssue): void {
    this.viewIssue.emit(issue);
  }

  requestDistrictFilter(district: string): void {
    this.filterByDistrict.emit(district);
    this.closeCard();
  }

  retry(): void {
    this.mapIssues.refresh(this.filters());

    if (this._mapState() === 'unavailable') {
      this._mapState.set('idle');
      void this.bootstrap();
    }
  }

  // ============================================
  // Map bootstrap
  // ============================================

  private async bootstrap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // AdvancedMarkerElement requires a cloud-configured Map ID. Without one the
    // pins silently never render, so we say so instead of showing a blank map —
    // and we do not quietly fall back to the deprecated google.maps.Marker.
    const mapId = googleMapsConfig.mapId?.trim() ?? '';
    if (!mapId) {
      this._mapState.set('no-map-id');
      return;
    }

    this._mapState.set('loading');

    try {
      await this.waitForGoogleMaps();

      const { Map: MapCtor } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = (await google.maps.importLibrary(
        'marker'
      )) as google.maps.MarkerLibrary;

      this.advancedMarker = AdvancedMarkerElement;
      this.adoptCanvas(MapCtor, mapId);
      this._mapState.set('ready');
    } catch (error) {
      console.error('[IssuesMapComponent] Google Maps could not be initialised:', error);
      this._mapState.set('unavailable');
    }
  }

  /**
   * index.html attaches the Maps bootstrap loader on window `load`, so
   * `google.maps.importLibrary` may not exist yet when we mount. Same polling
   * shape as issues-list / issue-detail.
   */
  private waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const check = () => {
        if (typeof google !== 'undefined' && typeof google.maps?.importLibrary === 'function') {
          resolve();
          return;
        }

        if (attempts >= MAPS_POLL_MAX_ATTEMPTS) {
          reject(new Error('Google Maps API failed to load'));
          return;
        }

        attempts++;
        this.pollTimer = setTimeout(check, MAPS_POLL_INTERVAL_MS);
      };

      check();
    });
  }

  /** See the BILLING INVARIANT note above: create once, re-adopt forever after. */
  private adoptCanvas(mapCtor: typeof google.maps.Map, mapId: string): void {
    const host = this.canvasHost().nativeElement;

    if (!sharedCanvas || !sharedMap) {
      sharedCanvas = document.createElement('div');
      sharedCanvas.className = 'issues-map__canvas';
      host.appendChild(sharedCanvas);
      sharedMap = new mapCtor(sharedCanvas, { ...MAP_OPTIONS, mapId });
    } else if (sharedCanvas.parentElement !== host) {
      // Moving the existing canvas is free. Rebuilding the map is not.
      host.appendChild(sharedCanvas);
    }

    this.map = sharedMap;
  }

  // ============================================
  // Markers
  // ============================================

  private renderMarkers(issues: readonly PlottableIssue[]): void {
    const map = this.map;
    const markerCtor = this.advancedMarker;

    if (!map || !markerCtor) {
      return;
    }

    this.clearMarkers();

    const bounds = new google.maps.LatLngBounds();

    for (const issue of issues) {
      const position: google.maps.LatLngLiteral = { lat: issue.latitude, lng: issue.longitude };
      const marker = new markerCtor({
        map,
        position,
        // Google turns `title` into the marker's accessible name and makes the
        // marker keyboard-focusable once it has a click listener.
        title: `${issue.title} — ${issue.district || issue.city}`,
        content: this.buildPin(issue),
        zIndex: issue.urgency === 'urgent' ? 2 : 1
      });

      const listener = marker.addListener('click', () => this.onMarkerClick(issue, marker));

      this.markers.push({ issue, marker, listener });
      bounds.extend(position);
    }

    // The new filter set may have dropped whatever the open card was showing.
    const selected = this.selectedIssue();
    if (selected && !issues.some(issue => issue.id === selected.id)) {
      this.closeCard();
    }

    // Never fit an empty bounds — it has no centre and misbehaves.
    if (this.markers.length === 0) {
      return;
    }

    this.fitToMarkers(bounds);
  }

  private clearMarkers(): void {
    for (const entry of this.markers) {
      entry.listener.remove();
      entry.marker.map = null;
    }

    this.markers = [];
  }

  /** Builds the pin DOM. Classes only — all of the styling lives in the .scss. */
  private buildPin(issue: PlottableIssue): HTMLElement {
    const pin = document.createElement('div');
    pin.className = 'issues-map__pin';

    if (issue.urgency === 'urgent') {
      pin.classList.add('issues-map__pin--urgent');
    }
    if ((issue.status || '').toLowerCase() === 'resolved') {
      pin.classList.add('issues-map__pin--resolved');
    }

    const halo = document.createElement('span');
    halo.className = 'issues-map__pin-halo';
    halo.setAttribute('aria-hidden', 'true');

    const body = document.createElement('span');
    body.className = 'issues-map__pin-body';

    const glyph = document.createElement('span');
    glyph.className = 'issues-map__pin-glyph';
    glyph.setAttribute('aria-hidden', 'true');
    glyph.textContent = CATEGORY_GLYPHS[issue.category] ?? CATEGORY_GLYPHS.Other;

    const tip = document.createElement('span');
    tip.className = 'issues-map__pin-tip';
    tip.setAttribute('aria-hidden', 'true');

    body.appendChild(glyph);
    pin.append(halo, body, tip);

    return pin;
  }

  private onMarkerClick(
    issue: PlottableIssue,
    marker: google.maps.marker.AdvancedMarkerElement
  ): void {
    // Maps events can land outside Angular's zone; run() keeps the card update
    // from waiting on an unrelated tick.
    this.zone.run(() => {
      this.selectedIssue.set(issue);
    });

    this.highlight(marker);

    const map = this.map;
    if (!map) {
      return;
    }

    const position: google.maps.LatLngLiteral = { lat: issue.latitude, lng: issue.longitude };

    if (this.prefersReducedMotion()) {
      map.setCenter(position);
    } else {
      map.panTo(position);
    }
  }

  private highlight(active: google.maps.marker.AdvancedMarkerElement | null): void {
    for (const entry of this.markers) {
      const element = entry.marker.content as HTMLElement | null;
      element?.classList.toggle('issues-map__pin--selected', entry.marker === active);
    }
  }

  // ============================================
  // Camera
  // ============================================

  private fitToMarkers(bounds: google.maps.LatLngBounds): void {
    const map = this.map;
    if (!map) {
      return;
    }

    // One pin means a zero-area bounds: fitBounds would slam to maximum zoom.
    // moveCamera is documented as immediate (no animation), so this path is also
    // safe under reduced motion.
    if (this.markers.length === 1) {
      const only = this.markers[0].issue;
      map.moveCamera({
        center: { lat: only.latitude, lng: only.longitude },
        zoom: SINGLE_MARKER_ZOOM
      });
      return;
    }

    if (this.prefersReducedMotion()) {
      // fitBounds' full documented signature is fitBounds(bounds, padding) —
      // there is no {animate: false} (verified against @types/google.maps 3.58),
      // and the docs state it "may cause a smooth animation as the map pans and
      // zooms ... depends on an internal heuristic". So under reduced motion we
      // derive the camera ourselves and jump straight to it.
      const camera = this.cameraForBounds(bounds);

      if (camera) {
        map.moveCamera(camera);
        return;
      }
      // Fall through: the canvas had no measurable size, so a fit is the best
      // we can do and the map is not visible enough to animate anyway.
    }

    map.fitBounds(bounds, FIT_PADDING_PX);

    // Pins clustered on one street produce a near-zero bounds, which fits to
    // street-level absurdity. Clamp once the viewport has settled.
    this.fitListener?.remove();
    this.fitListener = google.maps.event.addListenerOnce(map, 'idle', () => {
      this.fitListener = null;
      const zoom = map.getZoom();

      if (zoom !== undefined && zoom > MAX_FIT_ZOOM) {
        map.setZoom(MAX_FIT_ZOOM);
      }
    });
  }

  /**
   * Derives the centre/zoom fitBounds would land on, using the standard Mercator
   * projection maths, so we can jump there with moveCamera instead of animating.
   * Returns null when the canvas has no layout (hidden or not measured yet).
   */
  private cameraForBounds(bounds: google.maps.LatLngBounds): google.maps.CameraOptions | null {
    const canvas = sharedCanvas;
    if (!canvas) {
      return null;
    }

    const width = canvas.clientWidth - FIT_PADDING_PX * 2;
    const height = canvas.clientHeight - FIT_PADDING_PX * 2;

    if (width <= 0 || height <= 0) {
      return null;
    }

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const latFraction = (mercatorLatRad(ne.lat()) - mercatorLatRad(sw.lat())) / Math.PI;

    let lngDiff = ne.lng() - sw.lng();
    if (lngDiff < 0) {
      lngDiff += 360;
    }
    const lngFraction = lngDiff / 360;

    const zoom = Math.min(
      zoomForFraction(height, latFraction),
      zoomForFraction(width, lngFraction),
      MAX_FIT_ZOOM
    );

    return {
      center: bounds.getCenter().toJSON(),
      zoom: Math.max(zoom, MIN_FIT_ZOOM)
    };
  }

  /** Every caller runs after afterNextRender, so `window` is always present. */
  private prefersReducedMotion(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }
}

function mercatorLatRad(lat: number): number {
  const sin = Math.sin((lat * Math.PI) / 180);
  const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;

  return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
}

function zoomForFraction(availablePx: number, fraction: number): number {
  if (fraction <= 0) {
    return MAX_FIT_ZOOM;
  }

  return Math.floor(Math.log(availablePx / WORLD_PX / fraction) / Math.LN2);
}
