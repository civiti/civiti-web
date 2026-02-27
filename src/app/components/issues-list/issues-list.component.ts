import { Component, inject, OnInit, DestroyRef, PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import { AppState } from '../../store/app.state';
import * as IssueActions from '../../store/issues/issue.actions';
import * as IssueSelectors from '../../store/issues/issue.selectors';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { selectCity } from '../../store/location/location.selectors';
import { IssueItem, IssueCategory, CategoryResponse } from '../../types/civica-api.types';
import { CategoryService } from '../../services/category.service';
import { BUCHAREST_DISTRICTS, DEFAULT_CITY } from '../../data/romanian-locations';
import { BUCHAREST_LOCATION_BIAS } from '../../types/location.types';
import { StatusTextPipe, StatusColorPipe } from '../../pipes/status.pipe';
import { IsUrgentPipe } from '../../pipes/urgency.pipe';
import { DaysSincePipe } from '../../pipes/date.pipe';

@Component({
  selector: 'app-issues-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzSelectModule,
    NzFormModule,
    NzGridModule,
    NzEmptyModule,
    NzToolTipModule,
    NzModalModule,
    NzPaginationModule,
    NzInputModule,
    StatusTextPipe,
    StatusColorPipe,
    IsUrgentPipe,
    DaysSincePipe,
  ],
  templateUrl: './issues-list.component.html',
  styleUrl: './issues-list.component.scss'
})
export class IssuesListComponent implements OnInit {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _store = inject(Store<AppState>);
  private _modal = inject(NzModalService);
  private _platformId = inject(PLATFORM_ID);
  private _categoryService = inject(CategoryService);
  private _destroyRef = inject(DestroyRef);
  private _imageErrorCount: Map<string, number> = new Map();

  issues$!: Observable<IssueItem[]>;
  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  sortBy$!: Observable<string>;
  totalIssues$!: Observable<number>;
  isAuthenticated$!: Observable<boolean>;
  paginationInfo$!: Observable<{
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    startItem: number;
    endItem: number;
  }>;

  sortBy = 'date';
  readonly PAGE_SIZE = 12;

  // Filter state
  selectedDistrict: string | null = null;
  selectedCategory: IssueCategory | null = null;
  addressFilter: string | null = null;
  selectedStatus: string = 'Active';
  districts = BUCHAREST_DISTRICTS;
  categories: CategoryResponse[] = [];

  // Status filter options
  readonly statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Resolved', label: 'Rezolvate' },
    { value: 'Active,Resolved', label: 'Toate' }
  ];

  // Google autocomplete for address search
  addressSearchControl = new FormControl('');
  suggestions: Array<{ description: string; place_id: string }> = [];
  showSuggestions = false;
  isSearching = false;
  private _autocompleteService: google.maps.places.AutocompleteService | null = null;
  private _placesService: google.maps.places.PlacesService | null = null;

  // City from location store
  private _currentCity: string = DEFAULT_CITY;

  constructor() {
    this.issues$ = this._store.select(IssueSelectors.selectSortedIssues);
    this.isLoading$ = this._store.select(IssueSelectors.selectIssuesLoading);
    this.error$ = this._store.select(IssueSelectors.selectIssuesError);
    this.sortBy$ = this._store.select(IssueSelectors.selectSortBy);
    this.totalIssues$ = this._store.select(IssueSelectors.selectTotalItems);
    this.isAuthenticated$ = this._store.select(selectIsAuthenticated);
    this.paginationInfo$ = this._store.select(IssueSelectors.selectPaginationInfo);

    // Sync local sortBy with store state using takeUntilDestroyed (Angular 19 best practice)
    this.sortBy$
      .pipe(takeUntilDestroyed())
      .subscribe(sortBy => {
        if (sortBy && this.sortBy !== sortBy) {
          this.sortBy = sortBy;
        }
      });
  }

  ngOnInit(): void {
    // Load categories from backend
    this._categoryService.getCategories()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(categories => {
        this.categories = categories;
      });

    // Subscribe to city from location store
    this._store.select(selectCity)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(city => {
        this._currentCity = city || DEFAULT_CITY;
      });

    // Setup address search debounce
    this.addressSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(value => {
        if (value && value.length >= 3) {
          this.searchAddress(value);
        } else {
          this.suggestions = [];
          this.showSuggestions = false;
        }
      });

    // Initialize Google autocomplete
    if (isPlatformBrowser(this._platformId)) {
      this.initGoogleAutocomplete();
    }

    // Listen to URL query params and sync with store
    this._route.queryParams
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map(params => {
          let page = params['page'] ? parseInt(params['page'], 10) : 1;
          // Validate page number
          if (isNaN(page) || page < 1) {
            page = 1;
          }
          return {
            page,
            sortBy: params['sortBy'] || 'date',
            district: params['district'] || null,
            category: params['category'] || null,
            address: params['address'] || null,
            status: params['status'] || 'Active'
          };
        }),
        distinctUntilChanged((prev, curr) =>
          prev.page === curr.page &&
          prev.sortBy === curr.sortBy &&
          prev.district === curr.district &&
          prev.category === curr.category &&
          prev.address === curr.address &&
          prev.status === curr.status
        )
      )
      .subscribe(({ page, sortBy, district, category, address, status }) => {
        // Sync filter state from URL
        this.selectedDistrict = district;
        this.selectedCategory = category as IssueCategory | null;
        this.addressFilter = address;
        this.selectedStatus = status;

        // Sync address input with URL (only if different to avoid loops)
        const currentInputValue = this.addressSearchControl.value || '';
        if (address && address !== currentInputValue) {
          this.addressSearchControl.setValue(address, { emitEvent: false });
        } else if (!address && currentInputValue) {
          this.addressSearchControl.setValue('', { emitEvent: false });
        }

        // Update local sortBy if different
        if (sortBy !== this.sortBy) {
          this.sortBy = sortBy;
          this._store.dispatch(IssueActions.changeSortBy({
            sortBy: sortBy as 'date' | 'emails' | 'urgency' | 'votes'
          }));
        }

        // Load issues with pagination and filter params
        this._store.dispatch(IssueActions.loadIssues({
          params: {
            page,
            pageSize: this.PAGE_SIZE,
            city: this._currentCity,
            district: district || undefined,
            category: category as IssueCategory || undefined,
            address: address || undefined,
            status: status || undefined,
            ...this.getSortParams(sortBy)
          }
        }));
      });
  }

  onPageChange(page: number): void {
    // Update URL - this will trigger the queryParams subscription
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  private getSortParams(sortBy: string): { sortBy?: string; sortDescending?: boolean } {
    switch (sortBy) {
      case 'emails':
        return { sortBy: 'emails', sortDescending: true };
      case 'votes':
        return { sortBy: 'communityVotes', sortDescending: true };
      case 'urgency':
        return { sortBy: 'urgency', sortDescending: true };
      case 'date':
      default:
        return { sortBy: 'createdAt', sortDescending: true };
    }
  }

  onSortChange(): void {
    // Dispatch sort change to store first
    this._store.dispatch(IssueActions.changeSortBy({
      sortBy: this.sortBy as 'date' | 'emails' | 'urgency' | 'votes'
    }));

    // Update URL with new sort and reset to page 1
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        page: 1,
        sortBy: this.sortBy
      },
      queryParamsHandling: 'merge'
    });
  }

  getIssueImage(issue: IssueItem): string {
    if (issue.mainPhotoUrl) {
      return issue.mainPhotoUrl;
    }
    return '/images/placeholders/issue-placeholder.svg';
  }

  onImageError(event: any): void {
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

  viewIssueDetails(issueId: string): void {
    this._store.dispatch(IssueActions.selectIssue({ id: issueId }));
    this._router.navigate(['/issue', issueId]);
  }

  /**
   * Check if issue is resolved (actions should be disabled)
   */
  isResolved(issue: IssueItem): boolean {
    return (issue.status || '').toLowerCase() === 'resolved';
  }

  promptToCreateIssue(): void {
    // Check auth state and navigate directly if authenticated
    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this._router.navigate(['/create-issue']);
        } else {
          // Show auth modal for unauthenticated users
          const modalRef = this._modal.create({
            nzTitle: 'Conectare necesară pentru crearea unei probleme',
            nzContent: 'Pentru a raporta o problemă nouă, este necesar să ai un cont. Poți să te conectezi dacă ai deja unul sau să îți creezi un cont nou.',
            nzFooter: [
              {
                label: 'Mai târziu',
                type: 'text',
                onClick: () => {
                  modalRef.close();
                }
              },
              {
                label: 'Am deja cont',
                type: 'default',
                onClick: () => {
                  modalRef.close();
                  this._router.navigate(['/auth/login'], { queryParams: { returnUrl: '/create-issue' } });
                }
              },
              {
                label: 'Creează cont nou',
                type: 'primary',
                onClick: () => {
                  modalRef.close();
                  this._router.navigate(['/auth/register'], { queryParams: { returnUrl: '/create-issue' } });
                }
              }
            ],
            nzIconType: 'user',
            nzWidth: 500,
            nzCentered: true
          });
        }
      });
  }

  // Filter methods
  onDistrictChange(): void {
    this.updateFiltersInUrl();
  }

  onCategoryChange(): void {
    this.updateFiltersInUrl();
  }

  /**
   * Handle Enter key press in address input - triggers search with typed text
   */
  onAddressSearch(): void {
    const value = this.addressSearchControl.value?.trim();
    this.showSuggestions = false;

    if (value && value.length >= 2) {
      this.addressFilter = value;
      this.updateFiltersInUrl();
    } else if (!value) {
      // Clear address filter if input is empty
      this.addressFilter = null;
      this.updateFiltersInUrl();
    }
  }

  /**
   * Clear address filter and trigger search
   */
  clearAddressFilter(): void {
    this.addressSearchControl.setValue('', { emitEvent: false });
    this.addressFilter = null;
    this.showSuggestions = false;
    this.updateFiltersInUrl();
  }

  clearFilters(): void {
    this.selectedDistrict = null;
    this.selectedCategory = null;
    this.addressFilter = null;
    this.selectedStatus = 'Active';
    this.addressSearchControl.setValue('', { emitEvent: false });
    this.updateFiltersInUrl();
  }

  hasActiveFilters(): boolean {
    // 'Active' is the default status, so don't count it as an active filter
    const hasNonDefaultStatus = this.selectedStatus && this.selectedStatus !== 'Active';
    return !!(this.selectedDistrict || this.selectedCategory || this.addressFilter || hasNonDefaultStatus);
  }

  private updateFiltersInUrl(): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        page: 1, // Reset to page 1 when filters change
        district: this.selectedDistrict || null,
        category: this.selectedCategory || null,
        address: this.addressFilter || null,
        // Don't add status param for default 'Active' to keep URLs clean
        status: this.selectedStatus && this.selectedStatus !== 'Active' ? this.selectedStatus : null
      },
      queryParamsHandling: 'merge'
    });
  }

  onStatusChange(): void {
    this.updateFiltersInUrl();
  }

  // Google autocomplete methods
  private async initGoogleAutocomplete(): Promise<void> {
    try {
      await this.waitForGoogleMaps();
      this._autocompleteService = new google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService (required by API)
      const dummyDiv = document.createElement('div');
      this._placesService = new google.maps.places.PlacesService(dummyDiv);
    } catch (error) {
      console.warn('Google Maps not available for address autocomplete');
    }
  }

  private waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;

      const check = async () => {
        if (typeof google !== 'undefined' && google.maps && google.maps.importLibrary) {
          try {
            await google.maps.importLibrary('places');
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

  private searchAddress(query: string): void {
    if (!this._autocompleteService) {
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
      }
    );
  }

  onAddressSuggestionSelected(suggestion: { description: string; place_id: string }): void {
    this.showSuggestions = false;
    this.addressSearchControl.setValue(suggestion.description, { emitEvent: false });

    // Extract a useful search term from the address (street name, not full address)
    // e.g., "Bulevardul Unirii 15, București" -> use partial match
    const addressParts = suggestion.description.split(',');
    const streetAddress = addressParts[0]?.trim() || suggestion.description;
    this.addressFilter = streetAddress;

    if (!this._placesService) {
      // If Places service unavailable, just use the address filter
      this.updateFiltersInUrl();
      return;
    }

    // Get place details to also extract district
    this._placesService.getDetails(
      { placeId: suggestion.place_id, fields: ['address_components'] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.address_components) {
          const district = this.extractDistrict(place.address_components);
          if (district) {
            this.selectedDistrict = district;
          }
        }
        // Always update URL with address filter
        this.updateFiltersInUrl();
      }
    );
  }

  onAddressInputBlur(): void {
    // Small delay to allow click events on suggestions to fire first
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  private extractDistrict(components: google.maps.GeocoderAddressComponent[]): string | null {
    if (!components) return null;

    // Look for sector in various component types
    for (const component of components) {
      const name = component.long_name.toLowerCase();
      if (name.includes('sector')) {
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

  private normalizeDistrict(district: string): string {
    // Extract sector number (supports multi-digit for future expansion)
    const match = district.match(/sector\w*\s*(\d+)/i);
    if (match) {
      return `Sector ${match[1]}`;
    }
    return district;
  }
} 