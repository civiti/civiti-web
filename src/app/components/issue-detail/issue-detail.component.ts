import { Component, inject, OnInit, OnDestroy, AfterViewInit, PLATFORM_ID, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { take, filter, takeUntil } from 'rxjs/operators';
import { AppState } from '../../store/app.state';
import * as IssueActions from '../../store/issues/issue.actions';
import * as IssueSelectors from '../../store/issues/issue.selectors';
import { Issue, Authority } from '../../services/mock-data.service';
import { EmailModalComponent } from './email-modal.component';
import { GoogleMap, MapMarker, MapInfoWindow } from '@angular/google-maps';
import { GoogleMapsConfigService } from '../../services/google-maps-config.service';

@Component({
    selector: 'app-issue-detail',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatToolbarModule,
        MatDialogModule,
        MatTabsModule,
        MatExpansionModule,
        GoogleMap,
        MapMarker,
        MapInfoWindow,
    ],
    templateUrl: './issue-detail.component.html',
    styleUrl: './issue-detail.component.scss'
})
export class IssueDetailComponent implements OnInit, OnDestroy, AfterViewInit {
    private _route = inject(ActivatedRoute);
    private _router = inject(Router);
    private _store = inject(Store<AppState>);
    private _dialog = inject(MatDialog);
    private _platformId = inject(PLATFORM_ID);
    private _cdr = inject(ChangeDetectorRef);
    private _imageErrorCount: Map<string, number> = new Map();
    private _lightbox: any;
    private _geocodedAddress: string | null = null;
    private _destroy$ = new Subject<void>();
    private _geocodeRetryCount = 0;
    private readonly _maxGeocodeRetries = 10;
    private _geocodeTimeoutId?: number;
    private _galleryTimeoutId?: number;
    private readonly _googleMapsConfig = inject(GoogleMapsConfigService);
    
    @ViewChild('infoWindow') infoWindow!: MapInfoWindow;
    @ViewChild('markerElement') markerElement!: MapMarker;

    issue$: Observable<Issue | null | undefined>;
    isLoading$: Observable<boolean>;
    error$: Observable<string | null>;
    
    // Google Maps properties
    mapOptions: any = {
        zoom: 17, // Closer zoom for street-level view
        mapTypeId: 'roadmap',
        // mapId: 'DEMO_MAP_ID', // Temporarily disable mapId to test if marker appears
        disableDefaultUI: false,
        zoomControl: true,
        scrollwheel: true,
        mapTypeControl: true, // Allow switching between map/satellite
        streetViewControl: true, // Enable street view
        fullscreenControl: true
    };
    isMapLoaded = false;
    mapLoadError = false;
    mapCenter: any = { lat: 44.4268, lng: 26.1025 }; // Default Bucharest
    markerPosition: any = { lat: 44.4268, lng: 26.1025 };
    markerOptions: any = {
        draggable: false
    };

    constructor() {
        this.issue$ = this._store.select(IssueSelectors.selectSelectedIssue);
        this.isLoading$ = this._store.select(IssueSelectors.selectIssuesLoading);
        this.error$ = this._store.select(IssueSelectors.selectIssuesError);

        // Reinitialize gallery when issue data changes (only in browser)
        if (isPlatformBrowser(this._platformId)) {
            this.issue$.pipe(
                takeUntil(this._destroy$)
            ).subscribe(issue => {
                if (issue && this._lightbox) {
                    // Clear any existing timeout
                    if (this._galleryTimeoutId) {
                        clearTimeout(this._galleryTimeoutId);
                    }
                    this._galleryTimeoutId = setTimeout(() => {
                        if (!this._destroy$.closed) {
                            this.refreshGallery();
                        }
                    }, 100) as any;
                }
            });
        }
    }

    ngOnInit(): void {
        const issueId = this._route.snapshot.paramMap.get('id');
        if (issueId) {
            this._store.dispatch(IssueActions.loadIssue({ id: issueId }));
            
            // Initialize Google Maps with the new loader
            this.initializeGoogleMaps().then(() => {
                this.isMapLoaded = true;
                
                // Get issue data and geocode address
                // Use filter to wait for non-null issue before taking the first value
                this.issue$.pipe(
                    filter(issue => !!issue),
                    take(1),
                    takeUntil(this._destroy$)
                ).subscribe(issue => {
                    // Update marker options with issue title
                    this.markerOptions = {
                        ...this.markerOptions,
                        title: issue.title
                    };
                    // Geocode the address
                    this.geocodeAddress(issue.location.address);
                });
            }).catch(error => {
                console.error('Failed to load Google Maps:', error);
                this.mapLoadError = true;
            });
        } else {
            this.goBack();
        }
    }

    ngAfterViewInit(): void {
        // Initialize GLightbox after view is ready (only in browser)
        if (isPlatformBrowser(this._platformId)) {
            this.initializeGallery();
        }
        
    }

    ngOnDestroy(): void {
        // Clean up subscriptions
        this._destroy$.next();
        this._destroy$.complete();
        
        // Clear all pending timeouts
        if (this._geocodeTimeoutId) {
            clearTimeout(this._geocodeTimeoutId);
        }
        if (this._galleryTimeoutId) {
            clearTimeout(this._galleryTimeoutId);
        }
        
        // Clean up the lightbox instance
        if (this._lightbox) {
            this._lightbox.destroy();
        }
        
        // Reset geocoding retry count
        this._geocodeRetryCount = 0;
    }

    private async initializeGallery(): Promise<void> {
        // Only load GLightbox in the browser
        if (!isPlatformBrowser(this._platformId)) {
            return;
        }

        try {
            // Dynamically import GLightbox to avoid SSR issues
            const GLightbox = (await import('glightbox')).default;
            
            // Initialize GLightbox for photo gallery
            this._lightbox = GLightbox({
                selector: '.photo-gallery-item',
                touchNavigation: true,
                loop: true,
                autoplayVideos: false,
                closeOnOutsideClick: true,
                moreText: 'Vezi mai multe',
                moreLength: 60,
                slideEffect: 'slide',
                skin: 'clean',
                cssEffects: {
                    fade: { in: 'fadeIn', out: 'fadeOut' },
                    zoom: { in: 'zoomIn', out: 'zoomOut' }
                }
            });
        } catch (error) {
            console.error('Error loading GLightbox:', error);
        }
    }

    openEmailModal(authority: Authority, issue: Issue): void {
        const dialogRef = this._dialog.open(EmailModalComponent, {
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            disableClose: false,
            data: { issue, authority }
        });

        // Refresh issue data after modal closes to update email count
        // Using take(1) to automatically unsubscribe after the first emission
        dialogRef.afterClosed().pipe(
            take(1)
        ).subscribe(() => {
            this._store.dispatch(IssueActions.loadIssue({ id: issue.id }));
        });
    }

    refreshGallery(): void {
        // Refresh the lightbox after content changes
        if (this._lightbox) {
            this._lightbox.reload();
        }
    }

    getPhotoUrl(photoPath: string): string {
        // Use local placeholder for development
        // In production, this would return the actual photo URL from backend
        return '/images/placeholders/issue-placeholder.svg';
    }

    onImageError(event: any, index?: number): void {
        const imgElement = event.target;
        const currentSrc = imgElement.src;
        
        // Track error count per image to prevent infinite loops
        const errorCount = this._imageErrorCount.get(currentSrc) || 0;
        if (errorCount >= 1) {
            // Already tried fallback, hide the image to prevent further errors
            imgElement.style.display = 'none';
            return;
        }
        
        this._imageErrorCount.set(currentSrc, errorCount + 1);
        
        // Try local fallback image
        imgElement.src = '/images/placeholders/issue-placeholder.svg';
    }

    getUrgencyLevel(issue: Issue): 'urgent' | 'normal' {
        return issue.emailsSent > 100 ? 'urgent' : 'normal';
    }

    getDaysSince(date: Date): string {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays.toString();
    }

    getStatusText(status: string): string {
        switch (status) {
            case 'open': return 'DESCHISĂ';
            case 'in-progress': return 'ÎN PROGRES';
            case 'resolved': return 'REZOLVATĂ';
            default: return 'NECUNOSCUTĂ';
        }
    }

    goBack(): void {
        this._router.navigate(['/issues']);
    }

    private async initializeGoogleMaps(): Promise<void> {
        if (!isPlatformBrowser(this._platformId)) {
            return;
        }

        try {
            // Wait for Google Maps to be loaded (it's loaded in index.html)
            await this.waitForGoogleMaps();
        } catch (error) {
            console.error('Error initializing Google Maps:', error);
            throw error;
        }
    }

    private waitForGoogleMaps(): Promise<void> {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 20;

            const check = async () => {
                if (typeof google !== 'undefined' && google.maps && google.maps.importLibrary) {
                    console.log('Google Maps is ready, loading required libraries...');
                    
                    try {
                        // Load the required libraries using importLibrary
                        await Promise.all([
                            google.maps.importLibrary('maps'),
                            google.maps.importLibrary('geocoding'),
                            google.maps.importLibrary('places')
                        ]);
                        console.log('All Google Maps libraries loaded successfully');
                        resolve();
                    } catch (error) {
                        console.error('Failed to load Google Maps libraries:', error);
                        reject(new Error('Failed to load Google Maps libraries'));
                    }
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Google Maps failed to load'));
                } else {
                    attempts++;
                    setTimeout(check, 500);
                }
            };

            check();
        });
    }


    private checkGoogleMapsLoaded(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Only check in browser
            if (!isPlatformBrowser(this._platformId)) {
                resolve();
                return;
            }

            let attempts = 0;
            const maxAttempts = 20; // 10 seconds max wait

            const checkInterval = setInterval(() => {
                attempts++;
                
                // Log the state of window.google for debugging
                console.log(`Checking Google Maps (attempt ${attempts}/${maxAttempts}):`, {
                    googleDefined: typeof google !== 'undefined',
                    googleMaps: typeof google !== 'undefined' && !!google.maps,
                    googleMapsMap: typeof google !== 'undefined' && !!google.maps?.Map
                });
                
                // Check if Google Maps is loaded
                if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
                    clearInterval(checkInterval);
                    console.log('Google Maps loaded successfully!');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.error('Google Maps failed to load. Final state:', {
                        window: typeof window !== 'undefined',
                        google: typeof google !== 'undefined' ? google : 'undefined',
                        googleMaps: typeof google !== 'undefined' ? google.maps : 'undefined'
                    });
                    reject(new Error('Google Maps API failed to load after 10 seconds'));
                }
            }, 500);
        });
    }

    private geocodeAddress(address: string): void {
        if (!isPlatformBrowser(this._platformId) || !address) {
            return;
        }

        // Check if we've already geocoded this address
        if (this._geocodedAddress === address) {
            return;
        }

        // Check if Google Maps API is loaded
        if (typeof google === 'undefined' || !google.maps || !google.maps.Geocoder) {
            this._geocodeRetryCount++;
            
            if (this._geocodeRetryCount >= this._maxGeocodeRetries) {
                console.error(`Google Maps API failed to load after ${this._maxGeocodeRetries} attempts`);
                // Fall back to default coordinates if available
                this.fallbackToDefaultCoordinates();
                return;
            }
            
            console.warn(`Google Maps API not yet loaded, retrying... (attempt ${this._geocodeRetryCount}/${this._maxGeocodeRetries})`);
            // Retry after a delay with exponential backoff
            const delay = Math.min(500 * Math.pow(1.5, this._geocodeRetryCount - 1), 5000);
            
            // Clear any existing timeout before setting a new one
            if (this._geocodeTimeoutId) {
                clearTimeout(this._geocodeTimeoutId);
            }
            
            this._geocodeTimeoutId = setTimeout(() => {
                // Check if component is still alive before calling geocodeAddress
                if (!this._destroy$.closed) {
                    this.geocodeAddress(address);
                }
            }, delay) as any;
            return;
        }
        
        // Reset retry count on successful API access
        this._geocodeRetryCount = 0;

        try {
            const geocoder = new google.maps.Geocoder();
            
            geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    this.mapCenter = {
                        lat: location.lat(),
                        lng: location.lng()
                    };
                    this.markerPosition = {
                        lat: location.lat(),
                        lng: location.lng()
                    };
                    // Mark this address as geocoded
                    this._geocodedAddress = address;
                    console.log(`Geocoded address "${address}" to:`, this.mapCenter);
                    console.log('Marker position updated to:', this.markerPosition);
                    
                    // Force change detection
                    this._cdr.detectChanges();
                    
                    // Info window will open on marker click instead of automatically
                } else {
                    const errorMessage = this.getGeocodeErrorMessage(status);
                    console.error('Geocode was not successful:', errorMessage);
                    
                    // Fall back to coordinates if available - use filter and take(1) to prevent multiple subscriptions
                    this.issue$.pipe(
                        filter(issue => !!issue),
                        take(1),
                        takeUntil(this._destroy$)
                    ).subscribe(issue => {
                        if (issue.location.lat && issue.location.lng) {
                            this.mapCenter = { lat: issue.location.lat, lng: issue.location.lng };
                            this.markerPosition = { lat: issue.location.lat, lng: issue.location.lng };
                            this._cdr.detectChanges();
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error initializing geocoder:', error);
            this._geocodeRetryCount++;
            
            if (this._geocodeRetryCount >= this._maxGeocodeRetries) {
                console.error('Max retry attempts reached for geocoding');
                this.fallbackToDefaultCoordinates();
                return;
            }
            
            // Retry after a delay with exponential backoff
            const delay = Math.min(1000 * Math.pow(1.5, this._geocodeRetryCount - 1), 5000);
            
            // Clear any existing timeout before setting a new one
            if (this._geocodeTimeoutId) {
                clearTimeout(this._geocodeTimeoutId);
            }
            
            this._geocodeTimeoutId = setTimeout(() => {
                // Check if component is still alive before calling geocodeAddress
                if (!this._destroy$.closed) {
                    this.geocodeAddress(address);
                }
            }, delay) as any;
        }
    }

    openInfoWindow(): void {
        if (this.infoWindow && this.markerElement) {
            this.infoWindow.open(this.markerElement);
        }
    }
    
    private getGeocodeErrorMessage(status: string): string {
        switch (status) {
            case 'ZERO_RESULTS':
                return 'No results found for this address';
            case 'OVER_QUERY_LIMIT':
                return 'Geocoding quota exceeded';
            case 'REQUEST_DENIED':
                return 'Geocoding request denied - check API key configuration';
            case 'INVALID_REQUEST':
                return 'Invalid geocoding request';
            case 'UNKNOWN_ERROR':
                return 'Unknown server error occurred';
            default:
                return `Geocoding failed with status: ${status}`;
        }
    }
    
    private fallbackToDefaultCoordinates(): void {
        // Try to use coordinates from the issue if available
        this.issue$.pipe(
            filter(issue => !!issue),
            take(1),
            takeUntil(this._destroy$)
        ).subscribe(issue => {
            if (issue.location.lat && issue.location.lng) {
                this.mapCenter = { lat: issue.location.lat, lng: issue.location.lng };
                this.markerPosition = { lat: issue.location.lat, lng: issue.location.lng };
                console.log('Using fallback coordinates from issue data');
            } else {
                // Use default Bucharest coordinates as last resort
                console.log('Using default Bucharest coordinates');
            }
            this._cdr.detectChanges();
        });
    }
}