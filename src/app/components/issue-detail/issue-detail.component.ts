import { Component, inject, OnInit, OnDestroy, AfterViewInit, PLATFORM_ID, viewChild, ChangeDetectorRef, signal, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Observable, Subject, combineLatest } from 'rxjs';
import { take, filter, takeUntil } from 'rxjs/operators';
import { AppState } from '../../store/app.state';
import * as IssueActions from '../../store/issues/issue.actions';
import * as IssueSelectors from '../../store/issues/issue.selectors';
import { selectIsAdmin, selectIsAuthInitialized, selectAuthUser, selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { IssueDetailResponse, isPubliclyViewableStatus } from '../../types/civica-api.types';
import { EmailModalComponent } from './email-modal.component';
import { GoogleMap, MapMarker, MapInfoWindow } from '@angular/google-maps';
import { GoogleMapsConfigService } from '../../services/google-maps-config.service';
import { StatusTextPipe, StatusColorPipe, IsActivePipe, IsTerminalStatePipe } from '../../pipes/status.pipe';
import { IsUrgentPipe } from '../../pipes/urgency.pipe';
import { DaysSincePipe } from '../../pipes/date.pipe';
import { CommentsComponent } from '../shared/comments/comments.component';
import { PhotoDownloadService, PhotoDownloadProgress } from '../../services/photo-download.service';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../services/seo.service';

@Component({
    selector: 'app-issue-detail',
    standalone: true,
    imports: [
        CommonModule,
        NzCardModule,
        NzButtonModule,
        NzIconModule,
        NzTagModule,
        NzModalModule,
        NzTabsModule,
        NzCollapseModule,
        NzSpaceModule,
        NzBadgeModule,
        NzGridModule,
        NzDividerModule,
        NzTypographyModule,
        NzToolTipModule,
        NzProgressModule,
        GoogleMap,
        MapMarker,
        MapInfoWindow,
        StatusTextPipe,
        StatusColorPipe,
        IsActivePipe,
        IsTerminalStatePipe,
        IsUrgentPipe,
        DaysSincePipe,
        CommentsComponent,
    ],
    templateUrl: './issue-detail.component.html',
    styleUrl: './issue-detail.component.scss'
})
export class IssueDetailComponent implements OnInit, OnDestroy, AfterViewInit {
    private _route = inject(ActivatedRoute);
    private _router = inject(Router);
    private _store = inject(Store<AppState>);
    private _modal = inject(NzModalService);
    private _message = inject(NzMessageService);
    private _platformId = inject(PLATFORM_ID);
    private _cdr = inject(ChangeDetectorRef);
    private _http = inject(HttpClient);
    private _photoDownloadService = inject(PhotoDownloadService);
    private _seo = inject(SeoService);
    private _imageErrorCount: Map<string, number> = new Map();
    private _lightbox: any;
    private _geocodedAddress: string | null = null;
    private _destroyRef = inject(DestroyRef);
    private _isDestroyed = false;
    private _geocodeRetryCount = 0;
    private readonly _maxGeocodeRetries = 10;
    private _geocodeTimeoutId?: number;
    private _galleryTimeoutId?: number;
    private readonly _googleMapsConfig = inject(GoogleMapsConfigService);
    
    infoWindow = viewChild<MapInfoWindow>('infoWindow');
    markerElement = viewChild<MapMarker>('markerElement');

    issue$!: Observable<IssueDetailResponse | null | undefined>;
    isLoading$!: Observable<boolean>;
    error$!: Observable<string | null>;
    isAdmin$!: Observable<boolean>;
    isAuthenticated$!: Observable<boolean>;

    // Voting state
    isVoting = signal(false);
    private _actions$ = inject(Actions);
    private _currentUserId: string | null = null;
    private _currentIssueId: string | null = null;

    // Photo download state
    isDownloading = false;
    downloadProgress: PhotoDownloadProgress | null = null;
    private _currentDownloadId: string | null = null;
    private _downloadComplete$ = new Subject<void>();

    // Poster download state
    isPosterLoading = false;

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
        this.isAdmin$ = this._store.select(selectIsAdmin);
        this.isAuthenticated$ = this._store.select(selectIsAuthenticated);

        // Track current user ID for vote validation
        this._store.select(selectAuthUser).pipe(
            takeUntilDestroyed(this._destroyRef)
        ).subscribe(user => {
            this._currentUserId = user?.id || null;
        });

        // Subscribe to voting action results to manage loading state
        // Filter by current issue ID to prevent premature loading state reset
        this._actions$.pipe(
            ofType(
                IssueActions.voteForIssueSuccess,
                IssueActions.voteForIssueFailure,
                IssueActions.removeVoteFromIssueSuccess,
                IssueActions.removeVoteFromIssueFailure,
                IssueActions.syncVoteState
            ),
            filter(action => action.issueId === this._currentIssueId),
            takeUntilDestroyed(this._destroyRef)
        ).subscribe(() => {
            this.isVoting.set(false);
        });

        // Reinitialize gallery when issue data changes (only in browser)
        if (isPlatformBrowser(this._platformId) && this.issue$) {
            this.issue$.pipe(
                takeUntilDestroyed(this._destroyRef)
            ).subscribe(issue => {
                if (issue && this._lightbox) {
                    // Clear any existing timeout
                    if (this._galleryTimeoutId) {
                        clearTimeout(this._galleryTimeoutId);
                    }
                    this._galleryTimeoutId = setTimeout(() => {
                        if (!this._isDestroyed) {
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
            this._currentIssueId = issueId;
            this._store.dispatch(IssueActions.loadIssue({ id: issueId }));

            // Check access control: wait for auth to initialize, then check permissions
            // Users can view: Active/Resolved issues (public), their own issues, or any issue if admin
            combineLatest([
                this.issue$.pipe(filter(issue => !!issue)),
                this._store.select(selectIsAuthInitialized).pipe(filter(initialized => initialized)),
                this.isAdmin$,
                this._store.select(selectAuthUser)
            ]).pipe(
                take(1),
                takeUntilDestroyed(this._destroyRef)
            ).subscribe(([issue, _initialized, isAdmin, currentUser]) => {
                const canView = isPubliclyViewableStatus(issue.status);
                const isOwner = currentUser?.id === issue.user.id;

                if (!canView && !isAdmin && !isOwner) {
                    console.warn(`[ACCESS DENIED] Issue ${issue.id} has status "${issue.status}" - redirecting (not owner, not admin)`);
                    this._router.navigate(['/issues']);
                    return;
                }
            });

            // Set dynamic SEO meta tags when issue data loads
            this.issue$.pipe(
                filter(issue => !!issue),
                take(1),
                takeUntilDestroyed(this._destroyRef)
            ).subscribe(issue => {
                const description = issue.description?.trim()
                    ? (issue.description.length > 155
                        ? issue.description.substring(0, 152) + '...'
                        : issue.description)
                    : `Problemă raportată: ${issue.title}`;
                const primaryPhoto = issue.photos?.find(p => p.isPrimary)?.url || issue.photos?.[0]?.url;
                const baseUrl = environment.production ? 'https://civiti.ro' : 'http://localhost:4200';
                this._seo.updateMetaTags({
                    title: issue.title,
                    description,
                    ogImage: primaryPhoto,
                    ogUrl: `${baseUrl}/issue/${issue.id}`,
                    ogType: 'article',
                });
            });

            // Initialize Google Maps with the new loader
            this.initializeGoogleMaps().then(() => {
                this.isMapLoaded = true;

                // Get issue data and geocode address
                // Use filter to wait for non-null issue before taking the first value
                this.issue$.pipe(
                    filter(issue => !!issue),
                    take(1),
                    takeUntilDestroyed(this._destroyRef)
                ).subscribe(issue => {
                    // Update marker options with issue title
                    this.markerOptions = {
                        ...this.markerOptions,
                        title: issue.title
                    };
                    // Geocode the address
                    this.geocodeAddress(issue.address);
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
        this._isDestroyed = true;

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

    openEmailCampaignModal(issue: IssueDetailResponse): void {
        if (!issue.authorities || issue.authorities.length === 0) return;

        const modalRef: any = this._modal.create({
            nzTitle: 'Trimite Mail',
            nzContent: EmailModalComponent,
            nzData: { issue, authorities: issue.authorities },
            nzWidth: 700,
            nzMaskClosable: true,
            nzFooter: [
                {
                    label: 'Închide',
                    onClick: () => modalRef.close(false)
                },
                {
                    label: 'Am trimis email-ul',
                    type: 'primary',
                    onClick: () => {
                        const componentInstance: any = modalRef.getContentComponent();
                        componentInstance?.confirmEmailSent();
                    }
                }
            ],
            nzIconType: 'mail'
        });

        // Refresh issue data after modal closes to update email count
        modalRef.afterClose.pipe(
            take(1)
        ).subscribe((result: boolean) => {
            if (result) {
                this._store.dispatch(IssueActions.loadIssue({ id: issue.id }));
            }
        });
    }

    refreshGallery(): void {
        // Refresh the lightbox after content changes
        if (this._lightbox) {
            this._lightbox.reload();
        }
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

    /**
     * Check if user cannot vote on this issue.
     * Returns true if: not authenticated, is own issue, or issue is in terminal state.
     */
    cannotVote(issue: IssueDetailResponse): boolean {
        // Not authenticated
        if (!this._currentUserId) {
            return true;
        }
        // Own issue
        if (issue.user.id === this._currentUserId) {
            return true;
        }
        // Terminal state (resolved, rejected, cancelled)
        const status = (issue.status || '').toLowerCase();
        if (status === 'resolved' || status === 'rejected' || status === 'cancelled') {
            return true;
        }
        return false;
    }

    /**
     * Get tooltip text for disabled vote button
     */
    getVoteTooltip(issue: IssueDetailResponse): string {
        if (!this._currentUserId) {
            return 'Autentifică-te pentru a vota';
        }
        if (issue.user.id === this._currentUserId) {
            return 'Nu poți vota propria problemă';
        }
        const status = (issue.status || '').toLowerCase();
        if (status === 'resolved' || status === 'rejected' || status === 'cancelled') {
            return 'Problema este închisă';
        }
        return '';
    }

    /**
     * Toggle vote for the issue (vote or unvote)
     */
    toggleVote(issue: IssueDetailResponse): void {
        if (this.cannotVote(issue) || this.isVoting()) {
            return;
        }

        this.isVoting.set(true);

        if (issue.hasVoted) {
            this._store.dispatch(IssueActions.removeVoteFromIssue({ issueId: issue.id }));
        } else {
            this._store.dispatch(IssueActions.voteForIssue({ issueId: issue.id }));
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
                if (!this._isDestroyed) {
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
                        takeUntilDestroyed(this._destroyRef)
                    ).subscribe(issue => {
                        if (issue.latitude && issue.longitude) {
                            this.mapCenter = { lat: issue.latitude, lng: issue.longitude };
                            this.markerPosition = { lat: issue.latitude, lng: issue.longitude };
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
                if (!this._isDestroyed) {
                    this.geocodeAddress(address);
                }
            }, delay) as any;
        }
    }

    openInfoWindow(): void {
        const infoWindow = this.infoWindow();
        const markerElement = this.markerElement();
        if (infoWindow && markerElement) {
            infoWindow.open(markerElement);
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
            takeUntilDestroyed(this._destroyRef)
        ).subscribe(issue => {
            if (issue.latitude && issue.longitude) {
                this.mapCenter = { lat: issue.latitude, lng: issue.longitude };
                this.markerPosition = { lat: issue.latitude, lng: issue.longitude };
                console.log('Using fallback coordinates from issue data');
            } else {
                // Use default Bucharest coordinates as last resort
                console.log('Using default Bucharest coordinates');
            }
            this._cdr.detectChanges();
        });
    }

    // Social sharing methods
    private getIssueUrl(issue: IssueDetailResponse): string {
        if (!isPlatformBrowser(this._platformId)) {
            return '';
        }
        return `${window.location.origin}/issue/${issue.id}`;
    }

    shareOnFacebook(issue: IssueDetailResponse): void {
        if (!isPlatformBrowser(this._platformId)) return;

        const url = encodeURIComponent(this.getIssueUrl(issue));
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            '_blank',
            'width=600,height=400'
        );
    }

    shareOnTwitter(issue: IssueDetailResponse): void {
        if (!isPlatformBrowser(this._platformId)) return;

        const url = encodeURIComponent(this.getIssueUrl(issue));
        const text = encodeURIComponent(`${issue.title} - Ajută-ne să rezolvăm această problemă!`);
        window.open(
            `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
            '_blank',
            'width=600,height=400'
        );
    }

    shareOnLinkedIn(issue: IssueDetailResponse): void {
        if (!isPlatformBrowser(this._platformId)) return;

        const url = encodeURIComponent(this.getIssueUrl(issue));
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
            '_blank',
            'width=600,height=600'
        );
    }

    async copyIssueLink(issue: IssueDetailResponse): Promise<void> {
        if (!isPlatformBrowser(this._platformId)) return;

        const url = this.getIssueUrl(issue);

        try {
            await navigator.clipboard.writeText(url);
            this._message.success('Link copiat în clipboard!');
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this._message.success('Link copiat în clipboard!');
        }
    }

    /**
     * Open QR poster PDF in a new tab for printing.
     * Uses HttpClient to ensure auth interceptor adds the JWT token.
     */
    downloadPoster(issue: IssueDetailResponse): void {
        if (!isPlatformBrowser(this._platformId)) return;
        if (this.isPosterLoading) return;

        this.isPosterLoading = true;
        const posterUrl = `${environment.apiUrl}/issues/${issue.id}/poster`;

        this._http.get(posterUrl, { responseType: 'blob' })
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: (blob) => {
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');

                    // Clean up the blob URL after a delay to allow the new tab to load
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

                    this.isPosterLoading = false;
                    this._cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Error opening poster:', error);
                    this._message.error('Eroare la deschiderea posterului.');
                    this.isPosterLoading = false;
                    this._cdr.detectChanges();
                }
            });
    }

    downloadAllPhotos(issue: IssueDetailResponse): void {
        if (!isPlatformBrowser(this._platformId)) return;
        if (!issue.photos || issue.photos.length === 0) return;
        if (this.isDownloading) return;

        this.isDownloading = true;
        this.downloadProgress = null;

        // Generate unique ID for this download to filter progress from concurrent downloads
        const downloadId = this._photoDownloadService.generateDownloadId();
        this._currentDownloadId = downloadId;

        // Subscribe to progress updates - filter by download ID and complete when done
        this._photoDownloadService.progress$
            .pipe(
                filter(progress => progress.downloadId === this._currentDownloadId),
                takeUntil(this._downloadComplete$),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe(progress => {
                this.downloadProgress = progress;
                this._cdr.detectChanges();
            });

        this._photoDownloadService
            .downloadPhotosAsZip(issue.photos, issue.id, downloadId, issue.title)
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: result => {
                    // Only process if this is still the current download
                    if (result.downloadId === this._currentDownloadId) {
                        this._downloadComplete$.next();
                        this.isDownloading = false;
                        this.downloadProgress = null;
                        this._currentDownloadId = null;
                        this._cdr.detectChanges();

                        if (result.success) {
                            if (result.failedCount > 0) {
                                this._message.warning(result.message);
                            } else {
                                this._message.success(result.message);
                            }
                        } else {
                            this._message.error(result.message);
                        }
                    }
                },
                error: error => {
                    console.error('Photo download error:', error);
                    this._downloadComplete$.next();
                    this.isDownloading = false;
                    this.downloadProgress = null;
                    this._currentDownloadId = null;
                    this._cdr.detectChanges();
                    this._message.error('Eroare la descărcarea fotografiilor.');
                }
            });
    }
}