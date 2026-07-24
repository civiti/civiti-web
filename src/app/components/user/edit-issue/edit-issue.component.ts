import { Component, OnInit, OnDestroy, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';
import { of, from, merge, Subject } from 'rxjs';
import { switchMap, catchError, toArray, debounceTime, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { AppState } from '../../../store/app.state';
import { ApiService } from '../../../services/api.service';
import { StorageService, UploadResult } from '../../../services/storage.service';
import { PhotoUploadService } from '../../../services/photo-upload.service';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { CategoryService, CategoryInfo } from '../../../services/category.service';
import {
  IssueDetailResponse,
  IssueAuthorityInput,
  AuthorityListResponse,
  EditUserIssueRequest,
  UrgencyLevel,
  URGENCY_OPTIONS,
  normalizeStatus,
} from '../../../types/civica-api.types';
import { LocationData } from '../../../types/location.types';
import { DEFAULT_CITY } from '../../../data/romanian-locations';
import { LocationPickerModalComponent } from '../../shared/location-picker-modal/location-picker-modal.component';
import {
  ISSUE_TITLE_MAX,
  DESCRIPTION_MIN,
  DESCRIPTION_MAX,
  TEXTAREA_MAX,
  MAX_AUTHORITIES,
  MAX_PHOTOS,
  isOwnerEditableStatus,
} from '../../issue-creation/issue-field.constants';
import * as UserIssuesActions from '../../../store/user-issues/user-issues.actions';
import * as IssueActions from '../../../store/issues/issue.actions';

/** A photo in the edit form — either loaded from the server or freshly uploaded. */
interface EditPhoto {
  id: string;
  url: string;          // final URL, or a blob: preview while uploading
  storagePath: string;  // '' for server-loaded photos; set for freshly uploaded ones
  isPrimary: boolean;
  isExisting: boolean;  // true = loaded from server (backend owns blob GC on removal)
  isUploading: boolean;
}

/** A selected authority (predefined or custom). */
interface SelectedAuthority {
  authorityId?: string;
  email: string;
  name: string;
  isCustom: boolean;
}

interface AuthorityGroup {
  label: string;
  icon: string;
  authorities: AuthorityListResponse[];
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

@Component({
  selector: 'app-edit-issue',
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
    NzSelectModule,
    NzCheckboxModule,
    NzTagModule,
    NzAlertModule,
    NzEmptyModule,
    NzDividerModule,
    NzBadgeModule,
    NzSpinModule,
    NzToolTipModule,
  ],
  templateUrl: './edit-issue.component.html',
  styleUrls: ['./edit-issue.component.scss']
})
export class EditIssueComponent implements OnInit, OnDestroy {
  private _destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private store = inject(Store<AppState>);
  private apiService = inject(ApiService);
  private storageService = inject(StorageService);
  private photoUploadService = inject(PhotoUploadService);
  private authService = inject(SupabaseAuthService);
  private categoryService = inject(CategoryService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  private currentUserId: string | null = null;

  // Exposed constants for the template
  readonly TITLE_MAX = ISSUE_TITLE_MAX;
  readonly DESCRIPTION_MAX = DESCRIPTION_MAX;
  readonly TEXTAREA_MAX = TEXTAREA_MAX;
  readonly MAX_PHOTOS = MAX_PHOTOS;
  readonly MAX_AUTHORITIES = MAX_AUTHORITIES;
  readonly urgencyOptions = URGENCY_OPTIONS;

  issueId = '';
  issue: IssueDetailResponse | null = null;
  isLoading = true;
  isSaving = false;
  loadError: string | null = null;
  private savedSuccessfully = false;

  editForm: FormGroup;
  categories: CategoryInfo[] = [];

  // Photos
  photos = signal<EditPhoto[]>([]);
  isUploading = computed(() => this.photos().some(p => p.isUploading));

  // Location
  location = signal<LocationData | null>(null);

  // Authorities
  private readonly loadTrigger$ = new Subject<string>();
  private issueCity = DEFAULT_CITY;
  issueDistrict = signal('');
  filteredAuthorities = signal<AuthorityListResponse[]>([]);
  selectedAuthorities = signal<SelectedAuthority[]>([]);
  searchTerm = '';
  isLoadingAuthorities = false;
  showCustomEmailInput = false;
  customEmailForm: FormGroup;

  readonly isAtAuthorityLimit = computed(() => this.selectedAuthorities().length >= MAX_AUTHORITIES);
  readonly remainingAuthoritySlots = computed(() => MAX_AUTHORITIES - this.selectedAuthorities().length);
  // No client-side authority minimum: issues created without authorities (e.g. via the
  // MCP tool) are valid, and the backend enforces no minimum — a client minimum would
  // lock those owners out of editing entirely.

  readonly groupedAuthorities = computed<AuthorityGroup[]>(() => {
    const filtered = this.filteredAuthorities();
    const municipal = filtered.filter(a => !a.district);
    const district = filtered.filter(a => a.district);
    const groups: AuthorityGroup[] = [];
    if (municipal.length > 0) {
      groups.push({ label: 'Autorități municipale', icon: 'bank', authorities: municipal });
    }
    if (district.length > 0) {
      groups.push({ label: `Autorități ${this.issueDistrict() || 'locale'}`, icon: 'home', authorities: district });
    }
    return groups;
  });

  constructor() {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(ISSUE_TITLE_MAX)]],
      category: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(DESCRIPTION_MIN), Validators.maxLength(DESCRIPTION_MAX)]],
      // Optional in the API/response — not required, so a legacy issue that lacks
      // them can still be edited. minLength only applies once the field is non-empty.
      desiredOutcome: ['', [Validators.minLength(DESCRIPTION_MIN), Validators.maxLength(TEXTAREA_MAX)]],
      communityImpact: ['', [Validators.minLength(DESCRIPTION_MIN), Validators.maxLength(TEXTAREA_MAX)]],
      urgency: ['medium'],
    });
    this.customEmailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: [''],
    });
    this.setupAuthorityStream();
    this.loadCategories();
  }

  ngOnInit(): void {
    this.authService.getCurrentUserOnceReady()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(user => {
        if (user) {
          this.currentUserId = user.id;
          this.route.params.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(params => {
            this.issueId = params['id'];
            if (this.issueId) {
              this.loadIssue();
            }
          });
        } else {
          this.isLoading = false;
          this.loadError = 'Trebuie să fiți autentificat pentru a edita o problemă.';
        }
      });
  }

  // ---- Loading & pre-fill ----------------------------------------------------

  private loadCategories(): void {
    this.categoryService.getCategoriesWithInfo()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(categories => {
        this.categories = categories;
        this.reconcileCategoryValue();
      });
  }

  private loadIssue(): void {
    this.isLoading = true;
    this.loadError = null;

    this.apiService.getIssueById(this.issueId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (issue) => {
          this.isLoading = false;

          if (issue.user.id !== this.currentUserId) {
            this.loadError = 'Nu aveți permisiunea de a edita această problemă.';
            return;
          }

          if (!isOwnerEditableStatus(issue.status)) {
            this.loadError = 'Această problemă nu mai poate fi editată.';
            return;
          }

          this.issue = issue;
          this.populateForm(issue);
        },
        error: (error) => {
          console.error('[EditIssue] Nu s-a putut încărca problema:', error);
          this.isLoading = false;
          this.loadError = 'Nu am putut încărca problema. Încercați din nou.';
        }
      });
  }

  private populateForm(issue: IssueDetailResponse): void {
    this.editForm.patchValue({
      title: issue.title,
      category: issue.category,
      description: issue.description,
      desiredOutcome: issue.desiredOutcome || '',
      communityImpact: issue.communityImpact || '',
      urgency: this.normalizeUrgency(issue.urgency),
    });
    this.reconcileCategoryValue(); // in case categories already loaded

    // Location — response carries no city, default to București (MVP, matches create flow)
    this.location.set({
      address: issue.address,
      latitude: issue.latitude,
      longitude: issue.longitude,
      city: DEFAULT_CITY,
      district: issue.district ?? null,
    });
    this.issueCity = DEFAULT_CITY;
    this.issueDistrict.set(issue.district || '');

    // Photos — map server photos, guarantee exactly one primary
    const photos: EditPhoto[] = (issue.photos || []).map((ph, i) => ({
      id: ph.id || `existing-${i}`,
      url: ph.url,
      storagePath: '',
      isPrimary: !!ph.isPrimary,
      isExisting: true,
      isUploading: false,
    }));
    if (photos.length > 0 && !photos.some(p => p.isPrimary)) {
      photos[0].isPrimary = true;
    }
    this.photos.set(photos);

    // Authorities — rehydrate from the response
    this.selectedAuthorities.set((issue.authorities || []).map(a => ({
      authorityId: a.authorityId,
      email: a.email,
      name: a.name,
      isCustom: !a.isPredefined,
    })));

    // Load the authority picklist for this location
    this.isLoadingAuthorities = true;
    this.loadTrigger$.next('');
  }

  private normalizeUrgency(value: string | undefined): UrgencyLevel {
    // Preserve 'unspecified' — coercing it to 'medium' would silently change the
    // field on save even when the owner never touched the urgency control.
    const valid: UrgencyLevel[] = ['unspecified', 'low', 'medium', 'high', 'urgent'];
    const normalized = (value || '').toLowerCase() as UrgencyLevel;
    return valid.includes(normalized) ? normalized : 'unspecified';
  }

  /** Status-aware banner shown above the form. */
  get statusBanner(): { type: 'warning' | 'info'; message: string; description: string } | null {
    if (!this.issue) return null;
    const status = normalizeStatus(this.issue.status);
    if (status === 'Rejected') {
      return {
        type: 'warning',
        message: 'Această problemă a fost respinsă',
        description: 'Editează detaliile și retrimite pentru aprobare.',
      };
    }
    if (status === 'Active') {
      return {
        type: 'warning',
        message: 'Această problemă este publică',
        description: 'Dacă o modifici, va fi retrasă temporar din listă și retrimisă spre aprobare. Voturile și emailurile trimise se păstrează.',
      };
    }
    if (status === 'Submitted' || status === 'UnderReview') {
      return {
        type: 'info',
        message: 'Problema așteaptă aprobarea',
        description: 'Modificările tale vor fi verificate de un administrator.',
      };
    }
    return null;
  }

  // ---- Category --------------------------------------------------------------

  categoryIcon(id: string): string {
    return this.categories.find(c => c.id === id)?.icon || 'question-circle';
  }

  /**
   * Snap the prefilled category to the exact option id (case-insensitively).
   * GET /api/categories returns option values in PascalCase ("PublicServices"), but
   * GET /api/issues/{id} serializes the enum in camelCase ("publicServices"); without
   * this the select would fail to match and render blank. Runs both when categories
   * load and after prefill, since the two arrive asynchronously.
   */
  private reconcileCategoryValue(): void {
    const raw = this.editForm.get('category')?.value;
    if (!raw || this.categories.length === 0) return;
    const match = this.categories.find(c => c.id.toLowerCase() === String(raw).toLowerCase());
    if (match && match.id !== raw) {
      this.editForm.patchValue({ category: match.id }, { emitEvent: false });
    }
  }

  // ---- Location --------------------------------------------------------------

  changeLocation(): void {
    const current = this.location();
    const modalRef = this.modal.create({
      nzTitle: 'Selectează Locația',
      nzContent: LocationPickerModalComponent,
      nzWidth: window.innerWidth < 576 ? '95vw' : 700,
      nzMaskClosable: false,
      nzData: {
        config: {
          initialLocation: current ? { lat: current.latitude, lng: current.longitude } : undefined,
          initialAddress: current?.address,
          initialCity: current?.city,
          initialDistrict: current?.district ?? undefined,
        },
      },
      nzFooter: null,
    });

    modalRef.afterClose.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((result: LocationData | null) => {
      if (result) {
        this.location.set(result);
        // Re-filter authorities for the (possibly new) district
        this.issueCity = result.city || DEFAULT_CITY;
        this.issueDistrict.set(result.district || '');
        this.isLoadingAuthorities = true;
        this.loadTrigger$.next(this.searchTerm);
      }
    });
  }

  // ---- Photos ----------------------------------------------------------------

  triggerFileInput(): void {
    const input = document.getElementById('edit-photo-input') as HTMLInputElement | null;
    input?.click();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    if (this.photos().length + files.length > MAX_PHOTOS) {
      this.message.warning(`Maxim ${MAX_PHOTOS} fotografii permise. Ștergeți câteva pentru a adăuga altele.`);
      target.value = '';
      return;
    }
    if (!this.currentUserId) {
      this.message.error('Trebuie să fiți autentificat pentru a încărca fotografii.');
      target.value = '';
      return;
    }

    const filesToProcess = Array.from(files);
    target.value = '';

    const tasks = filesToProcess.map(file => this.processFile(file));
    merge(...tasks).pipe(takeUntilDestroyed(this._destroyRef), toArray()).subscribe();
  }

  private processFile(file: File) {
    const validation = this.photoUploadService.validate(file);
    if (!validation.ok) {
      this.message.error(validation.reason);
      return of(null);
    }

    const id = 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const previewUrl = URL.createObjectURL(file);
    const hasPrimary = this.photos().some(p => p.isPrimary);

    this.photos.update(list => [...list, {
      id,
      url: previewUrl,
      storagePath: '',
      isPrimary: !hasPrimary,
      isExisting: false,
      isUploading: true,
    }]);

    return from(this.photoUploadService.compress(file)).pipe(
      switchMap(compressed => this.storageService.uploadPhotoWithRetry(this.currentUserId!, compressed)),
      switchMap((result: UploadResult) => {
        // Photo removed mid-upload → clean the orphan
        if (!this.photos().some(p => p.id === id)) {
          this.storageService.deletePhotoWithRetry(result.path)
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({ error: () => {} });
          URL.revokeObjectURL(previewUrl);
          return of(null);
        }
        this.photos.update(list => list.map(p =>
          p.id === id ? { ...p, url: result.url, storagePath: result.path, isUploading: false } : p
        ));
        setTimeout(() => URL.revokeObjectURL(previewUrl), 500);
        return of(result);
      }),
      catchError(error => {
        console.error('[EditIssue] Încărcarea fotografiei a eșuat:', error);
        this.photos.update(list => list.filter(p => p.id !== id));
        URL.revokeObjectURL(previewUrl);
        this.message.error('Încărcarea fotografiei a eșuat. Încercați din nou.');
        return of(null);
      })
    );
  }

  removePhoto(id: string): void {
    const photo = this.photos().find(p => p.id === id);
    if (!photo) return;

    const wasPrimary = photo.isPrimary;
    this.photos.update(list => list.filter(p => p.id !== id));

    // Reassign primary to the first remaining photo if needed
    if (wasPrimary && this.photos().length > 0) {
      this.photos.update(list => list.map((p, i) => ({ ...p, isPrimary: i === 0 })));
    }

    // Only delete blobs we uploaded this session; server-owned photos are GC'd by the backend
    if (photo.storagePath && !photo.isExisting) {
      this.storageService.deletePhotoWithRetry(photo.storagePath)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({ error: () => {} });
    } else if (photo.url.startsWith('blob:')) {
      URL.revokeObjectURL(photo.url);
    }
  }

  setPrimaryPhoto(id: string): void {
    this.photos.update(list => list.map(p => ({ ...p, isPrimary: p.id === id })));
  }

  // ---- Authorities -----------------------------------------------------------

  private setupAuthorityStream(): void {
    // NOTE: no distinctUntilChanged here — unlike the create wizard (which only
    // re-triggers on search-text change), the edit flow re-triggers with an
    // UNCHANGED search string on location-change and 409-reload. distinctUntilChanged
    // would suppress those and leave the picker stuck loading with stale authorities.
    this.loadTrigger$
      .pipe(
        debounceTime(300),
        tap(() => (this.isLoadingAuthorities = true)),
        switchMap(search => this.apiService.getAuthorities({
          city: this.issueCity,
          district: this.issueDistrict() || undefined,
          search: search.trim() || undefined,
        }).pipe(
          catchError(error => {
            console.error('[EditIssue] Nu s-au putut încărca autoritățile:', error);
            this.message.warning('Nu s-au putut încărca autoritățile. Poți adăuga manual.');
            return of([] as AuthorityListResponse[]);
          })
        )),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(authorities => {
        this.filteredAuthorities.set([...authorities]);
        this.isLoadingAuthorities = false;
      });
  }

  filterAuthorities(): void {
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
      if (this.isAtAuthorityLimit()) return;
      this.selectedAuthorities.update(list => [...list, {
        authorityId: authority.id,
        email: authority.email,
        name: authority.name,
        isCustom: false,
      }]);
    }
  }

  toggleCustomEmailInput(): void {
    this.showCustomEmailInput = !this.showCustomEmailInput;
    if (!this.showCustomEmailInput) {
      this.customEmailForm.reset();
    }
  }

  addCustomAuthority(): void {
    if (!this.customEmailForm.valid) {
      Object.keys(this.customEmailForm.controls).forEach(key => this.customEmailForm.get(key)?.markAsTouched());
      return;
    }
    const email = this.customEmailForm.get('email')?.value?.trim();
    const name = this.customEmailForm.get('name')?.value?.trim() || email;

    if (this.selectedAuthorities().some(a => a.email.toLowerCase() === email.toLowerCase())) {
      this.message.warning('Această adresă de email este deja adăugată');
      return;
    }
    if (this.isAtAuthorityLimit()) {
      this.message.warning(`Poți selecta maximum ${MAX_AUTHORITIES} autorități`);
      return;
    }
    if (!isValidEmail(email)) {
      this.message.error('Adresa de email nu este validă');
      return;
    }

    this.selectedAuthorities.update(list => [...list, { email, name, isCustom: true }]);
    this.customEmailForm.reset();
    this.showCustomEmailInput = false;
    this.message.success('Autoritate adăugată cu succes');
  }

  removeAuthority(authority: SelectedAuthority): void {
    this.selectedAuthorities.update(list => list.filter(a => a.email !== authority.email));
  }

  // ---- Submit ----------------------------------------------------------------

  onSubmit(): void {
    if (this.editForm.invalid) {
      Object.values(this.editForm.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });
      this.message.warning('Te rugăm să completezi toate câmpurile obligatorii.');
      return;
    }
    if (this.isUploading()) {
      this.message.warning('Așteaptă finalizarea încărcării fotografiilor.');
      return;
    }
    if (this.photos().length === 0) {
      this.message.warning('Adaugă cel puțin o fotografie.');
      return;
    }
    const loc = this.location();
    if (!loc) {
      this.message.warning('Selectează o locație.');
      return;
    }
    if (!loc.district) {
      // The backend requires a non-empty district; București addresses always carry a sector.
      this.message.warning('Selectează o locație cu sector (sectorul este obligatoriu).');
      return;
    }
    // No authority minimum here — see the note on isAtAuthorityLimit.

    const copy = this.buildConfirmCopy();
    this.modal.confirm({
      nzTitle: copy.title,
      nzContent: copy.content,
      nzOkText: copy.ok,
      nzCancelText: 'Anulează',
      nzOnOk: () => this.saveChanges(),
    });
  }

  private buildConfirmCopy(): { title: string; content: string; ok: string } {
    const status = normalizeStatus(this.issue?.status);
    if (status === 'Active') {
      return {
        title: 'Retrimite problema pentru aprobare',
        content: 'Problema ta este momentan publică. Dacă o modifici, va fi retrasă temporar din listă și retrimisă spre aprobare. Va redeveni publică după ce un administrator o aprobă. Voturile și emailurile trimise se păstrează.',
        ok: 'Da, modifică și retrimite',
      };
    }
    if (status === 'Submitted' || status === 'UnderReview') {
      return {
        title: 'Salvează modificările',
        content: 'Problema este deja în așteptarea aprobării. Modificările vor fi verificate de un administrator.',
        ok: 'Salvează',
      };
    }
    return {
      title: 'Retrimite problema',
      content: 'Modificările vor fi trimise spre aprobare. Un administrator le va verifica înainte ca problema să devină publică.',
      ok: 'Da, retrimite',
    };
  }

  private saveChanges(): void {
    if (!this.issue) return;
    this.isSaving = true;

    const loc = this.location()!;
    const sortedPhotos = this.photoUploadService.sortPrimaryFirst(this.photos());
    const authorities: IssueAuthorityInput[] = this.selectedAuthorities().map(a =>
      a.authorityId && !a.isCustom
        ? { authorityId: a.authorityId }
        : { customName: a.name, customEmail: a.email }
    );

    const payload: EditUserIssueRequest = {
      title: this.editForm.value.title,
      description: this.editForm.value.description,
      category: this.editForm.value.category,
      address: loc.address,
      district: loc.district || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
      urgency: this.editForm.value.urgency,
      desiredOutcome: this.editForm.value.desiredOutcome,
      communityImpact: this.editForm.value.communityImpact,
      photoUrls: sortedPhotos.map(p => p.url),
      authorities,
      resubmit: true,
      expectedUpdatedAt: this.issue.updatedAt,
    };

    this.apiService.editUserIssue(this.issueId, payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (updated) => {
          this.isSaving = false;
          this.savedSuccessfully = true; // keep ngOnDestroy from deleting the photos we just submitted
          this.message.success('Problema a fost retrimisă spre aprobare.');
          // Reconcile the public list slice (drop an edited Active issue that left public view)
          // and the selected detail; then refresh the owner's list and navigate. Guard against a
          // contract-violating empty body so a null payload can't throw out of the reducer.
          if (updated) {
            this.store.dispatch(IssueActions.issueEdited({ issue: updated }));
          }
          this.store.dispatch(UserIssuesActions.refreshUserIssues());
          this.router.navigate(['/my-issues']);
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving = false;
          this.handleSaveError(error);
        }
      });
  }

  private handleSaveError(error: HttpErrorResponse): void {
    const body = error.error;
    switch (error.status) {
      case 409:
        // Branch on the stable `code`, never the (localisable) message.
        if (body?.code === 'ISSUE_NOT_EDITABLE') {
          this.loadError = 'Această problemă nu mai poate fi editată.';
          this.message.error(this.loadError);
          return;
        }
        // ISSUE_EDIT_CONFLICT (or any other 409): nothing was written — let the owner
        // decide whether to reload (losing their draft) or keep editing to copy it out.
        this.modal.confirm({
          nzTitle: 'Problema a fost modificată între timp',
          nzContent: 'Un administrator sau o altă sesiune a modificat această problemă. Poți reîncărca ultima versiune (modificările tale nesalvate se vor pierde) sau poți rămâne pe pagină pentru a-ți copia modificările.',
          nzOkText: 'Reîncarcă ultima versiune',
          nzCancelText: 'Rămân pe pagină',
          nzOnOk: () => {
            // Delete this session's uploads first — loadIssue() replaces the photo
            // state and would otherwise orphan them in storage.
            this.cleanupSessionUploads(true);
            this.loadIssue();
          },
        });
        return;
      case 400:
        // Handles both shapes: ValidationProblemDetails `errors` map and `{ error }`.
        this.message.error(this.extractErrorMessage(body));
        return;
      case 403:
        this.message.error(
          body?.title === 'Account Deleted'
            ? 'Contul tău a fost șters.'
            : 'Nu ai permisiunea de a edita această problemă.'
        );
        return;
      case 404:
        this.loadError = 'Problema nu a fost găsită.';
        this.message.error(this.loadError);
        return;
      default:
        console.error('[EditIssue] Nu s-a putut salva:', error);
        this.message.error('Eroare la salvare. Încercați din nou.');
    }
  }

  /** Pull a human message from either 400 shape: a ValidationProblemDetails `errors`
   *  map or a service-level `{ error }` body. */
  private extractErrorMessage(body: any): string {
    if (body?.errors && typeof body.errors === 'object') {
      const messages = (Object.values(body.errors) as string[][]).flat();
      if (messages.length) return messages.join(' ');
    }
    if (typeof body?.error === 'string') return body.error;
    return 'Datele trimise nu sunt valide. Verifică și încearcă din nou.';
  }

  goBack(): void {
    this.router.navigate(['/my-issues']);
  }

  /**
   * Revoke blob previews and (when deleteStorage) delete storage objects for photos
   * uploaded THIS session but not yet persisted to the issue (`!isExisting`). Server-owned
   * existing photos are left intact — the backend owns their lifecycle. Called on abandon
   * (ngOnDestroy) and before a 409 reload, which would otherwise drop these storagePaths
   * and orphan the objects. Fire-and-forget: no takeUntilDestroyed (may run during destroy).
   */
  private cleanupSessionUploads(deleteStorage: boolean): void {
    for (const photo of this.photos()) {
      if (photo.url.startsWith('blob:')) {
        URL.revokeObjectURL(photo.url);
      }
      if (deleteStorage && !photo.isExisting && photo.storagePath) {
        this.storageService.deletePhotoWithRetry(photo.storagePath).subscribe({ error: () => {} });
      }
    }
  }

  ngOnDestroy(): void {
    this.cleanupSessionUploads(!this.savedSuccessfully);
  }
}
