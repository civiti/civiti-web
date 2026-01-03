import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AuthorityListResponse } from '../../../types/civica-api.types';
import { ApiService } from '../../../services/api.service';

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Selected authority with optional authorityId for predefined authorities
 */
interface SelectedAuthority {
  /** Server authority ID (only for predefined authorities) */
  authorityId?: string;
  email: string;
  name: string;
  isCustom: boolean;
}

interface LocationData {
  address: string;
  coordinates?: { lat: number; lng: number };
  accuracy?: number;
  city?: string;
  district?: string;
}

interface IssueCategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  examples: string[];
}

@Component({
  selector: 'app-authority-selection',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzFormModule,
    NzInputModule,
    NzCheckboxModule,
    NzTagModule,
    NzAlertModule,
    NzEmptyModule,
    NzDividerModule,
    NzBadgeModule,
    NzSpinModule
  ],
  templateUrl: './authority-selection.component.html',
  styleUrls: ['./authority-selection.component.scss']
})
export class AuthoritySelectionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Data from previous steps
  selectedCategory: IssueCategoryInfo | null = null;
  currentLocation: LocationData | null = null;

  // Issue location for filtering authorities
  issueCity = '';
  issueDistrict = '';

  // Authority selection state
  availableAuthorities: AuthorityListResponse[] = [];
  filteredAuthorities: AuthorityListResponse[] = [];
  selectedAuthorities: SelectedAuthority[] = [];
  searchTerm = '';
  isLoadingAuthorities = false;
  isSearching = false;

  // Custom email form
  customEmailForm!: FormGroup;
  showCustomEmailInput = false;

  // Validation constants
  readonly MAX_AUTHORITIES = 5;
  readonly MIN_AUTHORITIES = 1;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private message: NzMessageService,
    private apiService: ApiService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupSearchSubscription();
    const hasRequiredData = this.loadSessionData();
    if (hasRequiredData) {
      this.loadAuthorities();
    }
  }

  private setupSearchSubscription(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.customEmailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['']
    });
  }

  private loadSessionData(): boolean {
    // Load category
    const categoryData = sessionStorage.getItem('civica_selected_category');
    if (categoryData) {
      this.selectedCategory = JSON.parse(categoryData);
    }

    // Load location
    const locationData = sessionStorage.getItem('civica_current_location');
    if (locationData) {
      this.currentLocation = JSON.parse(locationData);
      // Extract city and district for authority filtering
      this.issueCity = this.currentLocation?.city || 'București';
      this.issueDistrict = this.currentLocation?.district || '';
      console.log('[AUTHORITY SELECTION] Loaded location - city:', this.issueCity, 'district:', this.issueDistrict);
    }

    // Load previously selected authorities if returning to this step
    const authoritiesData = sessionStorage.getItem('civica_selected_authorities');
    if (authoritiesData) {
      this.selectedAuthorities = JSON.parse(authoritiesData);
    }

    // Validate we have required data from previous steps
    if (!this.selectedCategory || !this.currentLocation) {
      console.warn('[AUTHORITY SELECTION] Missing category/location data, redirecting to start...');
      this.router.navigate(['/create-issue']);
      return false;
    }

    // Validate Step 3 data exists (issue details + AI analysis)
    const completeIssueData = sessionStorage.getItem('civica_complete_issue_data');
    if (!completeIssueData) {
      console.warn('[AUTHORITY SELECTION] Missing issue details data, redirecting to details step...');
      this.router.navigate(['/create-issue/details']);
      return false;
    }

    return true;
  }

  private loadAuthorities(search?: string): void {
    this.isLoadingAuthorities = true;

    // Build query params for location-based filtering
    const params = {
      city: this.issueCity,
      district: this.issueDistrict || undefined,
      search: search || undefined
    };

    console.log('[AUTHORITY SELECTION] Loading authorities with params:', params);

    this.apiService.getAuthorities(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (authorities) => {
          console.log('[AUTHORITY SELECTION] Loaded authorities from server:', authorities);
          this.availableAuthorities = authorities;
          this.filteredAuthorities = [...authorities];
          this.isLoadingAuthorities = false;
          this.isSearching = false;
        },
        error: (error) => {
          console.error('[AUTHORITY SELECTION] Failed to load authorities:', error);
          this.message.warning('Nu s-au putut încărca autoritățile. Poți adăuga manual.');
          this.availableAuthorities = [];
          this.filteredAuthorities = [];
          this.isLoadingAuthorities = false;
          this.isSearching = false;
        }
      });
  }

  private performSearch(searchTerm: string): void {
    this.loadAuthorities(searchTerm.trim() || undefined);
  }

  filterAuthorities(): void {
    // Use server-side search with debounce
    this.isSearching = true;
    this.searchSubject$.next(this.searchTerm);
  }

  /**
   * Get display label for authority district
   */
  getDistrictLabel(authority: AuthorityListResponse): string {
    return authority.district || 'Nivel municipal';
  }

  isAuthoritySelected(authority: AuthorityListResponse): boolean {
    return this.selectedAuthorities.some(a => a.authorityId === authority.id || a.email === authority.email);
  }

  toggleAuthority(authority: AuthorityListResponse): void {
    const index = this.selectedAuthorities.findIndex(a => a.authorityId === authority.id || a.email === authority.email);

    if (index >= 0) {
      // Remove authority
      this.selectedAuthorities.splice(index, 1);
    } else {
      // Add authority (check limit)
      if (this.selectedAuthorities.length >= this.MAX_AUTHORITIES) {
        this.message.warning(`Poți selecta maximum ${this.MAX_AUTHORITIES} autorități`);
        return;
      }

      this.selectedAuthorities.push({
        authorityId: authority.id,
        email: authority.email,
        name: authority.name,
        isCustom: false
      });
    }

    this.saveToSession();
  }

  toggleCustomEmailInput(): void {
    this.showCustomEmailInput = !this.showCustomEmailInput;
    if (!this.showCustomEmailInput) {
      this.customEmailForm.reset();
    }
  }

  addCustomAuthority(): void {
    if (!this.customEmailForm.valid) {
      Object.keys(this.customEmailForm.controls).forEach(key => {
        this.customEmailForm.get(key)?.markAsTouched();
      });
      return;
    }

    const email = this.customEmailForm.get('email')?.value?.trim();
    const name = this.customEmailForm.get('name')?.value?.trim() || email;

    // Check if already exists
    if (this.selectedAuthorities.some(a => a.email.toLowerCase() === email.toLowerCase())) {
      this.message.warning('Această adresă de email este deja adăugată');
      return;
    }

    // Check limit
    if (this.selectedAuthorities.length >= this.MAX_AUTHORITIES) {
      this.message.warning(`Poți selecta maximum ${this.MAX_AUTHORITIES} autorități`);
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      this.message.error('Adresa de email nu este validă');
      return;
    }

    this.selectedAuthorities.push({
      email,
      name,
      isCustom: true
    });

    this.customEmailForm.reset();
    this.showCustomEmailInput = false;
    this.message.success('Autoritate adăugată cu succes');
    this.saveToSession();
  }

  removeAuthority(authority: SelectedAuthority): void {
    const index = this.selectedAuthorities.findIndex(a => a.email === authority.email);
    if (index >= 0) {
      this.selectedAuthorities.splice(index, 1);
      this.saveToSession();
    }
  }

  private saveToSession(): void {
    sessionStorage.setItem('civica_selected_authorities', JSON.stringify(this.selectedAuthorities));
  }

  get canContinue(): boolean {
    return this.selectedAuthorities.length >= this.MIN_AUTHORITIES;
  }

  get remainingSlots(): number {
    return this.MAX_AUTHORITIES - this.selectedAuthorities.length;
  }

  continueToReview(): void {
    if (!this.canContinue) {
      this.message.warning(`Selectează cel puțin ${this.MIN_AUTHORITIES} autoritate`);
      return;
    }

    this.saveToSession();
    this.router.navigate(['/create-issue/review']);
  }

  goBack(): void {
    this.saveToSession();
    this.router.navigate(['/create-issue/details']);
  }
}
