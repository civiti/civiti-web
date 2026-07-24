import { Component, DestroyRef, inject, input, model, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';

// NG-ZORRO
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AuthorityListResponse } from '../../../types/civica-api.types';
import { ApiService } from '../../../services/api.service';
import { MAX_AUTHORITIES } from '../../issue-creation/issue-field.constants';

/** A selected authority (predefined or custom). Shared by the create wizard and the edit editor. */
export interface SelectedAuthority {
  /** Server authority ID (only for predefined authorities). */
  authorityId?: string;
  email: string;
  name: string;
  isCustom: boolean;
}

/** Grouped authorities for display (municipal vs district). */
export interface AuthorityGroup {
  label: string;
  icon: string;
  authorities: AuthorityListResponse[];
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Presentational authority picker shared by create + edit. It owns ONLY selection + the
 * location-filtered authority list. The parent owns persistence (session for create,
 * signal for edit), min-count gating, and navigation.
 *
 * Selection is a two-way `model` so create can persist it and edit can bind it to its own signal.
 * The load stream is keyed on the composite {city, district, search}, so a location change re-fires
 * automatically (no imperative re-trigger) while a repeated same-search is suppressed.
 * The child enforces only MAX_AUTHORITIES — never a minimum (edit must stay usable for issues
 * created with zero authorities, e.g. via the MCP tool).
 */
@Component({
  selector: 'app-authority-picker',
  standalone: true,
  imports: [
    CommonModule,
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
    NzSpinModule,
  ],
  templateUrl: './authority-picker.component.html',
  styleUrls: ['./authority-picker.component.scss'],
})
export class AuthorityPickerComponent {
  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly MAX_AUTHORITIES = MAX_AUTHORITIES;

  // Inputs
  city = input.required<string>();      // feeds getAuthorities({city}) + card title
  district = input<string>('');         // feeds {district} + district group label
  // Two-way selection — the source of truth for tags + checkbox state.
  selected = model<SelectedAuthority[]>([]);

  // Internal state
  searchTerm = signal('');
  filteredAuthorities = signal<AuthorityListResponse[]>([]);
  isLoading = signal(true); // true until the first fetch resolves (avoids a false empty-state flash)
  showCustomEmailInput = signal(false);
  customEmailForm: FormGroup;

  readonly isAtLimit = computed(() => this.selected().length >= MAX_AUTHORITIES);
  readonly remainingSlots = computed(() => MAX_AUTHORITIES - this.selected().length);

  readonly groupedAuthorities = computed<AuthorityGroup[]>(() => {
    const filtered = this.filteredAuthorities();
    const municipal = filtered.filter(a => !a.district);
    const district = filtered.filter(a => a.district);
    const groups: AuthorityGroup[] = [];
    if (municipal.length > 0) {
      groups.push({ label: 'Autorități municipale', icon: 'bank', authorities: municipal });
    }
    if (district.length > 0) {
      groups.push({ label: `Autorități ${this.district() || 'locale'}`, icon: 'home', authorities: district });
    }
    return groups;
  });

  // Composite load key — re-fires on any of {city, district, search}.
  private readonly loadKey = computed(() => ({
    city: this.city(),
    district: this.district() || undefined,
    search: this.searchTerm().trim() || undefined,
  }));

  constructor() {
    this.customEmailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: [''],
    });

    toObservable(this.loadKey)
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => a.city === b.city && a.district === b.district && a.search === b.search),
        tap(() => this.isLoading.set(true)),
        switchMap(key =>
          this.apiService.getAuthorities(key).pipe(
            catchError(() => {
              this.message.warning('Nu s-au putut încărca autoritățile. Poți adăuga manual.');
              return of([] as AuthorityListResponse[]);
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(authorities => {
        this.filteredAuthorities.set([...authorities]);
        this.isLoading.set(false);
      });
  }

  isAuthoritySelected(authority: AuthorityListResponse): boolean {
    return this.selected().some(a => a.authorityId === authority.id || a.email === authority.email);
  }

  toggleAuthority(authority: AuthorityListResponse): void {
    const current = this.selected();
    const index = current.findIndex(a => a.authorityId === authority.id || a.email === authority.email);
    if (index >= 0) {
      this.selected.set(current.filter((_, i) => i !== index));
    } else {
      if (this.isAtLimit()) return;
      this.selected.set([...current, {
        authorityId: authority.id,
        email: authority.email,
        name: authority.name,
        isCustom: false,
      }]);
    }
  }

  toggleCustomEmailInput(): void {
    this.showCustomEmailInput.update(v => !v);
    if (!this.showCustomEmailInput()) {
      this.customEmailForm.reset();
    }
  }

  addCustomAuthority(): void {
    if (!this.customEmailForm.valid) {
      Object.keys(this.customEmailForm.controls).forEach(k => this.customEmailForm.get(k)?.markAsTouched());
      return;
    }
    const email = this.customEmailForm.get('email')?.value?.trim();
    const name = this.customEmailForm.get('name')?.value?.trim() || email;

    if (this.selected().some(a => a.email.toLowerCase() === email.toLowerCase())) {
      this.message.warning('Această adresă de email este deja adăugată');
      return;
    }
    if (this.isAtLimit()) {
      this.message.warning(`Poți selecta maximum ${MAX_AUTHORITIES} autorități`);
      return;
    }
    if (!isValidEmail(email)) {
      this.message.error('Adresa de email nu este validă');
      return;
    }

    this.selected.set([...this.selected(), { email, name, isCustom: true }]);
    this.customEmailForm.reset();
    this.showCustomEmailInput.set(false);
    this.message.success('Autoritate adăugată cu succes');
  }

  removeAuthority(authority: SelectedAuthority): void {
    this.selected.set(this.selected().filter(a => a.email !== authority.email));
  }
}
