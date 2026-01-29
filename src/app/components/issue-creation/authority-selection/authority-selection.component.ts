import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
import { CategoryInfo } from '../../../services/category.service';
import { DEFAULT_CITY } from '../../../data/romanian-locations';

/**
 * Grouped authorities for display
 */
interface AuthorityGroup {
  label: string;
  icon: string;
  authorities: AuthorityListResponse[];
}

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
export class AuthoritySelectionComponent implements OnInit {
  // Angular 19+ inject pattern
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);
  private readonly apiService = inject(ApiService);

  // Unified stream for all authority requests (initial load + search)
  private readonly loadTrigger$ = new Subject<string>();

  // Data from previous steps
  selectedCategory: CategoryInfo | null = null;
  currentLocation: LocationData | null = null;

  // Issue location for filtering authorities
  issueCity = '';
  issueDistrict = signal('');

  // Authority selection state
  availableAuthorities: AuthorityListResponse[] = [];
  filteredAuthorities = signal<AuthorityListResponse[]>([]);
  selectedAuthorities = signal<SelectedAuthority[]>([]);
  searchTerm = '';
  isLoadingAuthorities = false;
  isSearching = false;

  /** Whether the maximum number of authorities has been reached */
  isAtLimit = computed(() => this.selectedAuthorities().length >= this.MAX_AUTHORITIES);

  /** Grouped authorities for display - computed from filteredAuthorities signal */
  groupedAuthorities = computed<AuthorityGroup[]>(() => {
    const filtered = this.filteredAuthorities();
    const municipal = filtered.filter(a => !a.district);
    const district = filtered.filter(a => a.district);

    const groups: AuthorityGroup[] = [];

    if (municipal.length > 0) {
      groups.push({
        label: 'Autorități municipale',
        icon: 'bank',
        authorities: municipal
      });
    }

    if (district.length > 0) {
      groups.push({
        label: `Autorități ${this.issueDistrict() || 'locale'}`,
        icon: 'home',
        authorities: district
      });
    }

    return groups;
  });

  // Custom email form
  customEmailForm!: FormGroup;
  showCustomEmailInput = false;

  // Validation constants
  readonly MAX_AUTHORITIES = 5;
  readonly MIN_AUTHORITIES = 1;

  constructor() {
    this.initializeForm();
    this.setupAuthorityStream();
  }

  ngOnInit(): void {
    const hasRequiredData = this.loadSessionData();
    if (hasRequiredData) {
      // Set loading state immediately to prevent false "no results" during debounce
      this.isLoadingAuthorities = true;
      // Trigger initial load through unified stream
      this.loadTrigger$.next('');
    }
  }

  /**
   * Unified stream for all authority requests.
   * Uses switchMap to automatically cancel in-flight requests when new ones arrive.
   * Both initial load and search go through this single stream.
   */
  private setupAuthorityStream(): void {
    this.loadTrigger$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        // tap AFTER distinctUntilChanged to only set loading when request will actually fire
        tap(search => {
          this.isLoadingAuthorities = true;
          this.isSearching = search.length > 0;
        }),
        switchMap(search => {
          const params = {
            city: this.issueCity,
            district: this.issueDistrict() || undefined,
            search: search.trim() || undefined
          };
          console.log('[AUTHORITY SELECTION] Loading authorities with params:', params);
          return this.apiService.getAuthorities(params).pipe(
            catchError(error => {
              console.error('[AUTHORITY SELECTION] Failed to load authorities:', error);
              this.message.warning('Nu s-au putut încărca autoritățile. Poți adăuga manual.');
              return of([]);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(authorities => {
        console.log('[AUTHORITY SELECTION] Loaded authorities:', authorities);
        this.availableAuthorities = authorities;
        this.filteredAuthorities.set([...authorities]);
        this.isLoadingAuthorities = false;
        this.isSearching = false;
      });
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
      this.issueCity = this.currentLocation?.city || DEFAULT_CITY;
      this.issueDistrict.set(this.currentLocation?.district || '');
      console.log('[AUTHORITY SELECTION] Loaded location - city:', this.issueCity, 'district:', this.issueDistrict());
    }

    // Load previously selected authorities if returning to this step
    const authoritiesData = sessionStorage.getItem('civica_selected_authorities');
    if (authoritiesData) {
      this.selectedAuthorities.set(JSON.parse(authoritiesData));
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

  filterAuthorities(): void {
    // Trigger search through unified stream
    this.loadTrigger$.next(this.searchTerm);
  }

  isAuthoritySelected(authority: AuthorityListResponse): boolean {
    return this.selectedAuthorities().some(a => a.authorityId === authority.id || a.email === authority.email);
  }

  toggleAuthority(authority: AuthorityListResponse): void {
    const current = this.selectedAuthorities();
    const index = current.findIndex(a => a.authorityId === authority.id || a.email === authority.email);

    if (index >= 0) {
      this.selectedAuthorities.update(list => list.filter((_, i) => i !== index));
    } else {
      if (this.isAtLimit()) {
        return;
      }

      this.selectedAuthorities.update(list => [...list, {
        authorityId: authority.id,
        email: authority.email,
        name: authority.name,
        isCustom: false
      }]);
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
    if (this.selectedAuthorities().some(a => a.email.toLowerCase() === email.toLowerCase())) {
      this.message.warning('Această adresă de email este deja adăugată');
      return;
    }

    // Check limit
    if (this.isAtLimit()) {
      this.message.warning(`Poți selecta maximum ${this.MAX_AUTHORITIES} autorități`);
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      this.message.error('Adresa de email nu este validă');
      return;
    }

    this.selectedAuthorities.update(list => [...list, {
      email,
      name,
      isCustom: true
    }]);

    this.customEmailForm.reset();
    this.showCustomEmailInput = false;
    this.message.success('Autoritate adăugată cu succes');
    this.saveToSession();
  }

  removeAuthority(authority: SelectedAuthority): void {
    this.selectedAuthorities.update(list => list.filter(a => a.email !== authority.email));
    this.saveToSession();
  }

  private saveToSession(): void {
    sessionStorage.setItem('civica_selected_authorities', JSON.stringify(this.selectedAuthorities()));
  }

  canContinue = computed(() => this.selectedAuthorities().length >= this.MIN_AUTHORITIES);
  remainingSlots = computed(() => this.MAX_AUTHORITIES - this.selectedAuthorities().length);

  continueToReview(): void {
    if (!this.canContinue()) {
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
