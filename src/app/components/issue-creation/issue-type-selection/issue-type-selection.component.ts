import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { AppState } from '../../../store/app.state';
import { selectIsAuthenticated } from '../../../store/auth/auth.selectors';
import { CategoryService, CategoryInfo } from '../../../services/category.service';
import { LocationPickerModalComponent } from '../../shared/location-picker-modal/location-picker-modal.component';
import { LocationData } from '../../../types/location.types';
import { generateIssueTitle } from '../issue-title.util';

@Component({
  selector: 'app-issue-type-selection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzAlertModule,
    NzModalModule,
    NzInputModule,
    NzToolTipModule
  ],
  templateUrl: './issue-type-selection.component.html',
  styleUrls: ['./issue-type-selection.component.scss']
})
export class IssueTypeSelectionComponent implements OnInit {
  private _destroyRef = inject(DestroyRef);

  categories: CategoryInfo[] = [];
  selectedCategory: CategoryInfo | null = null;
  isLoading = false;
  currentLocation: {
    address: string;
    coordinates: { lat: number; lng: number };
    city?: string;
    district?: string;
  } | null = null;

  issueTitle = '';
  isTitleCustomized = false;

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
    this.loadSavedTitle();
  }

  private loadCategories(): void {
    this.isLoading = true;

    this.categoryService.getCategoriesWithInfo()
      .pipe(takeUntilDestroyed(this._destroyRef))
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

    // No default - user must explicitly select a location
    this.currentLocation = null;
  }

  onMobileCategorySelect(name: string): void {
    const category = this.categories.find(c => c.name === name);
    if (category) {
      this.selectCategory(category);
    }
  }

  selectCategory(category: CategoryInfo): void {
    this.selectedCategory = category;
    console.log('[TIP PROBLEMĂ] Categorie selectată:', category.name);
    if (!this.isTitleCustomized) {
      this.issueTitle = this.generateDefaultTitle();
      sessionStorage.setItem('civica_issue_title', this.issueTitle);
    }
  }

  /**
   * Check if user has selected a valid location
   */
  hasValidLocation(): boolean {
    return this.currentLocation !== null;
  }

  continueToPhotos(): void {
    if (!this.selectedCategory) {
      console.warn('[TIP PROBLEMĂ] Nicio categorie selectată');
      return;
    }

    // Validate that user has selected a location
    if (!this.hasValidLocation()) {
      this.locationError = 'Te rugăm să selectezi o locație pentru a continua';
      // Auto-open the location picker
      this.changeLocation();
      return;
    }

    // Clear any previous error
    this.locationError = null;

    console.log('[TIP PROBLEMĂ] Se continuă cu fotografiile pentru categoria:', this.selectedCategory.name);

    // Store selected category and title in session storage for the creation flow
    sessionStorage.setItem('civica_selected_category', JSON.stringify(this.selectedCategory));
    sessionStorage.setItem('civica_current_location', JSON.stringify(this.currentLocation));
    if (this.issueTitle) {
      sessionStorage.setItem('civica_issue_title', this.issueTitle);
    } else {
      sessionStorage.removeItem('civica_issue_title');
    }
    sessionStorage.setItem('civica_issue_title_customized', String(this.isTitleCustomized));

    this.router.navigate(['/create-issue/photo']);
  }

  onTitleChange(): void {
    this.isTitleCustomized = true;
    sessionStorage.setItem('civica_issue_title', this.issueTitle);
    sessionStorage.setItem('civica_issue_title_customized', 'true');
  }

  resetTitle(): void {
    this.isTitleCustomized = false;
    this.issueTitle = this.generateDefaultTitle();
    sessionStorage.setItem('civica_issue_title', this.issueTitle);
    sessionStorage.setItem('civica_issue_title_customized', 'false');
  }

  private generateDefaultTitle(): string {
    return generateIssueTitle(
      this.selectedCategory?.name || '',
      this.currentLocation?.address || ''
    );
  }

  private loadSavedTitle(): void {
    const savedTitle = sessionStorage.getItem('civica_issue_title');
    if (savedTitle) {
      this.issueTitle = savedTitle;
    }
    this.isTitleCustomized = sessionStorage.getItem('civica_issue_title_customized') === 'true';
  }

  changeLocation(): void {
    console.log('[TIP PROBLEMĂ] Schimbare locație solicitată');

    const modalRef = this.modalService.create({
      nzTitle: 'Selectează locația',
      nzContent: LocationPickerModalComponent,
      nzWidth: window.innerWidth < 576 ? '95vw' : 700,
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

        // Clear location error since a valid location was selected
        this.locationError = null;

        // Regenerate title if not customized
        if (!this.isTitleCustomized) {
          this.issueTitle = this.generateDefaultTitle();
          sessionStorage.setItem('civica_issue_title', this.issueTitle);
        }
      }
    });
  }

}