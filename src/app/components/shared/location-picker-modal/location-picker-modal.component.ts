import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import {
  LocationData,
  LocationPickerConfig,
  BUCHAREST_CENTER,
  BUCHAREST_LOCATION_BIAS
} from '../../../types/location.types';
import { DEFAULT_CITY } from '../../../data/romanian-locations';

export interface LocationPickerModalData {
  config?: LocationPickerConfig;
}

interface PlacePrediction {
  description: string;
  place_id: string;
}

@Component({
  selector: 'app-location-picker-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzAlertModule,
    NzSpinModule,
    NzCardModule,
    NzTagModule,
    GoogleMap,
    MapMarker
  ],
  templateUrl: './location-picker-modal.component.html',
  styleUrls: ['./location-picker-modal.component.scss']
})
export class LocationPickerModalComponent implements OnInit, AfterViewInit, OnDestroy {
  private _platformId = inject(PLATFORM_ID);
  private _modalRef = inject(NzModalRef);
  private _cdr = inject(ChangeDetectorRef);
  private _destroy$ = new Subject<void>();
  private _isDestroyed = false;

  // Form control for address input
  addressControl = new FormControl('');

  // Google Maps state
  isMapLoaded = false;
  mapLoadError = false;
  mapCenter = BUCHAREST_CENTER;
  mapZoom = 15;
  markerPosition: google.maps.LatLngLiteral | null = null;

  mapOptions: google.maps.MapOptions = {
    zoom: 15,
    mapTypeId: 'roadmap',
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeControl: false,
    clickableIcons: false
  };

  markerOptions: google.maps.MarkerOptions = {
    draggable: true
  };

  // Autocomplete state
  suggestions: PlacePrediction[] = [];
  showSuggestions = false;
  isSearching = false;

  // Selected location
  selectedLocation: LocationData | null = null;

  // Track if initial location needs reverse geocoding after Maps loads
  private _pendingReverseGeocode: google.maps.LatLngLiteral | null = null;

  // Google services
  private _autocompleteService: google.maps.places.AutocompleteService | null = null;
  private _placesService: google.maps.places.PlacesService | null = null;
  private _geocoder: google.maps.Geocoder | null = null;

  constructor(@Inject(NZ_MODAL_DATA) public data: LocationPickerModalData) {}

  ngOnInit(): void {
    // Setup debounced address input
    this.addressControl.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this._destroy$)
      )
      .subscribe(value => {
        if (value && value.length >= 3) {
          this.searchAddress(value);
        } else {
          this.suggestions = [];
          this.showSuggestions = false;
        }
      });

    // Initialize Google Maps
    if (isPlatformBrowser(this._platformId)) {
      this.initializeGoogleMaps();
    }
  }

  ngAfterViewInit(): void {
    // Set initial location if provided
    if (this.data?.config?.initialLocation) {
      const { lat, lng } = this.data.config.initialLocation;
      this.mapCenter = { lat, lng };
      this.markerPosition = { lat, lng };

      // If we have an initial address, populate selectedLocation immediately
      // so the confirm button is enabled
      if (this.data.config.initialAddress) {
        this.addressControl.setValue(this.data.config.initialAddress);
        // Normalize district to ensure consistent format (e.g., "Sectorul 5" → "Sector 5")
        const normalizedDistrict = this.data.config.initialDistrict
          ? this.normalizeDistrict(this.data.config.initialDistrict)
          : null;
        this.selectedLocation = {
          address: this.data.config.initialAddress,
          latitude: lat,
          longitude: lng,
          city: this.data.config.initialCity || DEFAULT_CITY,
          district: normalizedDistrict
        };
      } else {
        // No address provided - mark for reverse geocoding after Maps loads
        this._pendingReverseGeocode = { lat, lng };
      }
    } else if (this.data?.config?.initialAddress) {
      this.addressControl.setValue(this.data.config.initialAddress);
    }
  }

  ngOnDestroy(): void {
    this._isDestroyed = true;
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Safely trigger change detection only if component is still alive.
   * Prevents "ViewDestroyedError" in async callbacks.
   */
  private safeDetectChanges(): void {
    if (!this._isDestroyed) {
      this._cdr.detectChanges();
    }
  }

  /**
   * Initialize Google Maps and related services
   */
  private async initializeGoogleMaps(): Promise<void> {
    try {
      await this.waitForGoogleMaps();
      this.initializeServices();
      this.isMapLoaded = true;

      // Process any pending reverse geocode from initial location
      if (this._pendingReverseGeocode) {
        const { lat, lng } = this._pendingReverseGeocode;
        this._pendingReverseGeocode = null;
        this.reverseGeocode(lat, lng);
      }

      this.safeDetectChanges();
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      this.mapLoadError = true;
      this.safeDetectChanges();
    }
  }

  /**
   * Wait for Google Maps API to be available
   */
  private waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;

      const check = async () => {
        // Stop polling if component is destroyed
        if (this._isDestroyed) {
          reject(new Error('Component destroyed'));
          return;
        }

        if (typeof google !== 'undefined' && google.maps && google.maps.importLibrary) {
          try {
            await Promise.all([
              google.maps.importLibrary('maps'),
              google.maps.importLibrary('places'),
              google.maps.importLibrary('geocoding')
            ]);
            resolve();
          } catch (error) {
            reject(new Error('Failed to load Google Maps libraries'));
          }
        } else if (attempts >= maxAttempts) {
          reject(new Error('Google Maps API failed to load'));
        } else {
          attempts++;
          setTimeout(check, 500);
        }
      };

      check();
    });
  }

  /**
   * Initialize Google services after maps loaded
   */
  private initializeServices(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this._autocompleteService = new google.maps.places.AutocompleteService();
      this._geocoder = new google.maps.Geocoder();

      // Create a dummy div for PlacesService (required by API)
      const dummyDiv = document.createElement('div');
      this._placesService = new google.maps.places.PlacesService(dummyDiv);

      // Update marker options with animation now that google is loaded
      this.markerOptions = {
        draggable: true,
        animation: google.maps.Animation.DROP
      };
    }
  }

  /**
   * Search for address using Google Places Autocomplete
   */
  private searchAddress(query: string): void {
    if (!this._autocompleteService) {
      console.warn('Autocomplete service not initialized');
      return;
    }

    this.isSearching = true;

    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      componentRestrictions: { country: 'ro' },
      locationBias: {
        center: BUCHAREST_LOCATION_BIAS.center,
        radius: BUCHAREST_LOCATION_BIAS.radius
      } as google.maps.CircleLiteral,
      types: ['address']
    };

    this._autocompleteService.getPlacePredictions(
      request,
      (predictions, status) => {
        this.isSearching = false;

        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          this.suggestions = predictions.map(p => ({
            description: p.description,
            place_id: p.place_id
          }));
          this.showSuggestions = true;
        } else {
          this.suggestions = [];
          this.showSuggestions = false;
        }

        this.safeDetectChanges();
      }
    );
  }

  /**
   * Handle suggestion selection
   */
  onSuggestionSelected(suggestion: PlacePrediction): void {
    this.showSuggestions = false;
    this.addressControl.setValue(suggestion.description, { emitEvent: false });

    if (!this._placesService) return;

    // Get place details to get coordinates
    this._placesService.getDetails(
      { placeId: suggestion.place_id, fields: ['geometry', 'address_components', 'formatted_address'] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          this.mapCenter = { lat, lng };
          this.markerPosition = { lat, lng };

          // Extract city and district from address components
          const city = this.extractCity(place.address_components);
          const district = this.extractDistrict(place.address_components);

          this.selectedLocation = {
            address: place.formatted_address || suggestion.description,
            latitude: lat,
            longitude: lng,
            city,
            district
          };

          console.log('[LOCATION PICKER] Selected location:', this.selectedLocation);
          this.safeDetectChanges();
        }
      }
    );
  }

  /**
   * Handle map click to place marker
   */
  onMapClick(event: google.maps.MapMouseEvent): void {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    this.markerPosition = { lat, lng };
    this.reverseGeocode(lat, lng);
  }

  /**
   * Handle marker drag end
   */
  onMarkerDragEnd(event: google.maps.MapMouseEvent): void {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    this.markerPosition = { lat, lng };
    this.reverseGeocode(lat, lng);
  }

  /**
   * Reverse geocode coordinates to get address
   */
  private reverseGeocode(lat: number, lng: number): void {
    if (!this._geocoder) return;

    this._geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const result = results[0];
          const city = this.extractCity(result.address_components);
          const district = this.extractDistrict(result.address_components);

          this.addressControl.setValue(result.formatted_address, { emitEvent: false });

          this.selectedLocation = {
            address: result.formatted_address,
            latitude: lat,
            longitude: lng,
            city,
            district
          };

          console.log('[LOCATION PICKER] Reverse geocoded location:', this.selectedLocation);
          this.safeDetectChanges();
        }
      }
    );
  }

  /**
   * Extract city from address components
   */
  private extractCity(components?: google.maps.GeocoderAddressComponent[]): string {
    if (!components) return DEFAULT_CITY;

    // Look for locality (city)
    const locality = components.find(c => c.types.includes('locality'));
    if (locality) {
      return locality.long_name;
    }

    // Fallback: check administrative_area_level_1 for București
    const adminArea = components.find(c => c.types.includes('administrative_area_level_1'));
    if (adminArea && adminArea.long_name.toLowerCase().includes('bucure')) {
      return DEFAULT_CITY;
    }

    return DEFAULT_CITY; // Default for MVP
  }

  /**
   * Extract district/sector from address components and normalize format
   */
  private extractDistrict(components?: google.maps.GeocoderAddressComponent[]): string | null {
    if (!components) return null;

    // Look for sector in various component types
    for (const component of components) {
      const name = component.long_name.toLowerCase();
      if (name.includes('sector')) {
        // Normalize: "Sectorul 5" → "Sector 5"
        return this.normalizeDistrict(component.long_name);
      }
    }

    // Check sublocality
    const sublocality = components.find(c =>
      c.types.includes('sublocality') || c.types.includes('sublocality_level_1')
    );
    if (sublocality && sublocality.long_name.toLowerCase().includes('sector')) {
      return this.normalizeDistrict(sublocality.long_name);
    }

    return null;
  }

  /**
   * Normalize district format to match backend expectations
   * e.g., "Sectorul 5" → "Sector 5", "SECTOR 5" → "Sector 5"
   */
  private normalizeDistrict(district: string): string {
    // Extract sector number (supports multi-digit for future expansion)
    const match = district.match(/sector\w*\s*(\d+)/i);
    if (match) {
      return `Sector ${match[1]}`;
    }
    return district;
  }

  /**
   * Hide suggestions when clicking outside.
   * Note: Suggestions use (mousedown) which fires before blur,
   * so selection is processed before this hides the dropdown.
   */
  onAddressInputBlur(): void {
    this.showSuggestions = false;
  }

  /**
   * Check if location is valid (has been selected AND is in Sector 5 for MVP)
   */
  isLocationValid(): boolean {
    return this.selectedLocation !== null &&
           this.markerPosition !== null &&
           this.isInAllowedArea();
  }

  /**
   * Check if selected location is within allowed area (București for MVP)
   */
  isInAllowedArea(): boolean {
    if (!this.selectedLocation) {
      return false;
    }
    // For MVP, require București (any sector)
    return this.selectedLocation.city === DEFAULT_CITY;
  }

  /**
   * Get validation message for location restriction
   */
  getLocationRestrictionMessage(): string | null {
    if (!this.selectedLocation) {
      return null;
    }
    if (!this.isInAllowedArea()) {
      const city = this.selectedLocation.city;
      if (city && city !== DEFAULT_CITY) {
        return `Locația selectată este în ${city}. Pentru MVP, acceptăm doar adrese din ${DEFAULT_CITY}.`;
      }
      return `Pentru MVP, acceptăm doar adrese din ${DEFAULT_CITY}.`;
    }
    return null;
  }

  /**
   * Get the selected location data
   */
  getSelectedLocation(): LocationData | null {
    return this.selectedLocation;
  }

  /**
   * Confirm and close modal with selected location
   */
  confirmLocation(): void {
    if (this.selectedLocation) {
      this._modalRef.close(this.selectedLocation);
    }
  }

  /**
   * Cancel and close modal
   */
  cancel(): void {
    this._modalRef.close(null);
  }
}
