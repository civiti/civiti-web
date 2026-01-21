import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { AppState } from '../../../store/app.state';
import { selectIsAuthenticated } from '../../../store/auth/auth.selectors';
import { CategoryService, CategoryInfo } from '../../../services/category.service';
import { LocationPickerModalComponent } from '../../shared/location-picker-modal/location-picker-modal.component';
import { LocationData, BUCHAREST_CENTER } from '../../../types/location.types';
import { DEFAULT_CITY } from '../../../data/romanian-locations';

@Component({
  selector: 'app-issue-type-selection',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
    NzSpinModule,
    NzTypographyModule,
    NzAlertModule,
    NzTagModule,
    NzModalModule
  ],
  templateUrl: './issue-type-selection.component.html',
  styleUrls: ['./issue-type-selection.component.scss']
})
export class IssueTypeSelectionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  categories: CategoryInfo[] = [];
  selectedCategory: CategoryInfo | null = null;
  isLoading = false;
  currentLocation: {
    address: string;
    coordinates: { lat: number; lng: number };
    city?: string;
    district?: string;
  } | null = null;

  locationError: string | null = null;
  isAuthenticated$!: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private modalService: NzModalService,
    private categoryService: CategoryService
  ) {
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadCurrentLocation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.isLoading = true;

    this.categoryService.getCategoriesWithInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.isLoading = false;
          if (categories.length === 0) {
            console.warn('[TIP PROBLEMĂ] Nu s-au putut încărca categoriile');
          } else {
            console.log('[TIP PROBLEMĂ] Categorii încărcate:', categories.length);
          }
        },
        error: (error) => {
          // Handles errors from map() operator (e.g., malformed API responses)
          console.error('[TIP PROBLEMĂ] Eroare la procesarea categoriilor:', error);
          this.categories = [];
          this.isLoading = false;
        }
      });
  }

  private loadCurrentLocation(): void {
    // Try to load saved location from session storage
    const savedLocation = sessionStorage.getItem('civica_current_location');
    if (savedLocation) {
      try {
        this.currentLocation = JSON.parse(savedLocation);
        return;
      } catch (e) {
        console.warn('[TIP PROBLEMĂ] Nu s-a putut parsa locația salvată');
      }
    }

    // Default location for București (no specific sector)
    this.currentLocation = {
      address: `${DEFAULT_CITY}, România`,
      coordinates: BUCHAREST_CENTER,
      city: DEFAULT_CITY,
      district: undefined
    };
  }

  selectCategory(category: CategoryInfo): void {
    this.selectedCategory = category;
    console.log('[TIP PROBLEMĂ] Categorie selectată:', category.name);
  }

  /**
   * Check if the current location is the default generic one (no specific address selected)
   */
  isLocationGeneric(): boolean {
    if (!this.currentLocation) return true;

    // Check if it's the default generic address without a district
    const isDefaultAddress = this.currentLocation.address === `${DEFAULT_CITY}, România`;
    const hasNoDistrict = !this.currentLocation.district;

    return isDefaultAddress && hasNoDistrict;
  }

  continueToPhotos(): void {
    if (!this.selectedCategory) {
      console.warn('[TIP PROBLEMĂ] Nicio categorie selectată');
      return;
    }

    // Validate that user has selected a specific location
    if (this.isLocationGeneric()) {
      this.locationError = 'Te rugăm să selectezi o adresă specifică pentru a continua';
      // Auto-open the location picker
      this.changeLocation();
      return;
    }

    // Clear any previous error
    this.locationError = null;

    console.log('[TIP PROBLEMĂ] Se continuă cu fotografiile pentru categoria:', this.selectedCategory.name);

    // Store selected category in session storage for the creation flow
    sessionStorage.setItem('civica_selected_category', JSON.stringify(this.selectedCategory));
    sessionStorage.setItem('civica_current_location', JSON.stringify(this.currentLocation));

    this.router.navigate(['/create-issue/photo']);
  }

  changeLocation(): void {
    console.log('[TIP PROBLEMĂ] Schimbare locație solicitată');

    const modalRef = this.modalService.create({
      nzTitle: 'Selectează Locația',
      nzContent: LocationPickerModalComponent,
      nzWidth: 700,
      nzMaskClosable: false,
      nzData: {
        config: {
          initialLocation: this.currentLocation?.coordinates,
          initialAddress: this.currentLocation?.address,
          initialCity: this.currentLocation?.city,
          initialDistrict: this.currentLocation?.district
        }
      },
      nzFooter: null // Footer is in the component
    });

    modalRef.afterClose.subscribe((result: LocationData | null) => {
      if (result) {
        console.log('[TIP PROBLEMĂ] Locație selectată:', result);
        this.currentLocation = {
          address: result.address,
          coordinates: { lat: result.latitude, lng: result.longitude },
          city: result.city,
          district: result.district || undefined
        };
        // Save to session storage for persistence
        sessionStorage.setItem('civica_current_location', JSON.stringify(this.currentLocation));

        // Clear location error if a valid location was selected
        if (!this.isLocationGeneric()) {
          this.locationError = null;
        }
      }
    });
  }

}