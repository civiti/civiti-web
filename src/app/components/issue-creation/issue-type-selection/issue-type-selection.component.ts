import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
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
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
    NzSpinModule,
    NzTypographyModule,
    NzAlertModule,
    NzTagModule,
    NzModalModule,
    NzInputModule,
    NzSelectModule,
    NzToolTipModule
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
      nzTitle: 'Selectează Locația',
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