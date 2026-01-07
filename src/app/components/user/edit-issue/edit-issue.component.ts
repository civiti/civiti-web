import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, of, from, merge } from 'rxjs';
import { takeUntil, switchMap, finalize, catchError, toArray } from 'rxjs/operators';
import imageCompression from 'browser-image-compression';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzAlertModule } from 'ng-zorro-antd/alert';

import { AppState } from '../../../store/app.state';
import { ApiService } from '../../../services/api.service';
import { StorageService, UploadResult } from '../../../services/storage.service';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { IssueDetailResponse } from '../../../types/civica-api.types';
import * as UserIssuesActions from '../../../store/user-issues/user-issues.actions';

@Component({
  selector: 'app-edit-issue',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzFormModule,
    NzInputModule,
    NzSpinModule,
    NzUploadModule,
    NzAlertModule
  ],
  templateUrl: './edit-issue.component.html',
  styleUrls: ['./edit-issue.component.scss']
})
export class EditIssueComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private store = inject(Store<AppState>);
  private apiService = inject(ApiService);
  private storageService = inject(StorageService);
  private authService = inject(SupabaseAuthService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  private currentUserId: string | null = null;

  // Compression settings (same as photo-upload component)
  private readonly compressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    preserveExif: false,
    initialQuality: 0.85,
  };

  issueId: string = '';
  issue: IssueDetailResponse | null = null;
  isLoading = true;
  isSaving = false;
  isUploading = false;
  loadError: string | null = null;

  editForm: FormGroup;
  photoList: NzUploadFile[] = [];

  constructor() {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(30), Validators.maxLength(2000)]]
    });
  }

  ngOnInit(): void {
    // Load current user first, then load issue
    this.authService.getCurrentUserOnceReady()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUserId = user.id;
          // Now that we have the user, check for issue ID and load
          this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.issueId = params['id'];
            if (this.issueId) {
              this.loadIssue();
            }
          });
        } else {
          // Not authenticated
          this.isLoading = false;
          this.loadError = 'Trebuie să fiți autentificat pentru a edita o problemă.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadIssue(): void {
    this.isLoading = true;
    this.loadError = null;

    this.apiService.getIssueById(this.issueId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (issue) => {
          this.isLoading = false;

          // Check ownership - user can only edit their own issues
          if (issue.user.id !== this.currentUserId) {
            this.loadError = 'Nu aveți permisiunea de a edita această problemă.';
            return;
          }

          // Check if issue can be edited (only Rejected status)
          if (issue.status.toLowerCase() !== 'rejected') {
            this.loadError = 'Doar problemele respinse pot fi editate.';
            return;
          }

          // All checks passed - populate the form
          this.issue = issue;

          // Populate form
          this.editForm.patchValue({
            title: issue.title,
            description: issue.description
          });

          // Populate photos (reset first to handle issues without photos)
          if (issue.photos && issue.photos.length > 0) {
            this.photoList = issue.photos.map((photo, index) => ({
              uid: photo.id || `${index}`,
              name: `photo-${index + 1}`,
              status: 'done',
              url: photo.url,
              thumbUrl: photo.url
            }));
          } else {
            this.photoList = [];
          }
        },
        error: (error) => {
          console.error('[EditIssue] Failed to load issue:', error);
          this.isLoading = false;
          this.loadError = 'Nu am putut încărca problema. Încercați din nou.';
        }
      });
  }

  // Photo upload handling
  beforeUpload = (file: NzUploadFile): boolean => {
    // Check photo limit (max 5 photos)
    if (this.photoList.length >= 5) {
      this.message.warning('Maxim 5 fotografii permise. Ștergeți una pentru a adăuga alta.');
      return false;
    }

    const isImage = file.type?.startsWith('image/');
    if (!isImage) {
      this.message.error('Poți încărca doar imagini!');
      return false;
    }

    const isLt5M = (file.size || 0) / 1024 / 1024 < 5;
    if (!isLt5M) {
      this.message.error('Imaginea trebuie să fie mai mică de 5MB!');
      return false;
    }

    // Add to list
    this.photoList = [...this.photoList, file];
    return false; // Prevent auto upload
  };

  handleRemovePhoto = (file: NzUploadFile): boolean => {
    this.photoList = this.photoList.filter(p => p.uid !== file.uid);
    return true;
  };

  onSubmit(): void {
    if (this.editForm.invalid) {
      Object.values(this.editForm.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });
      return;
    }

    this.modal.confirm({
      nzTitle: 'Retrimite problema',
      nzContent: 'Esti sigur ca vrei sa retrimiti aceasta problema pentru aprobare? Statusul va fi schimbat in "In verificare".',
      nzOkText: 'Da, retrimite',
      nzCancelText: 'Anuleaza',
      nzOnOk: () => this.saveChanges()
    });
  }

  private saveChanges(): void {
    if (!this.currentUserId) {
      this.message.error('Trebuie să fiți autentificat pentru a salva modificările.');
      return;
    }

    this.isSaving = true;

    // Separate existing photos (have url) from new photos (have originFileObj)
    const existingPhotoUrls = this.photoList
      .filter(p => p.url && !p.originFileObj)
      .map(p => p.url as string);

    const newPhotos = this.photoList.filter(p => p.originFileObj);

    if (newPhotos.length === 0) {
      // No new photos to upload, proceed directly
      this.submitUpdate(existingPhotoUrls);
    } else {
      // Upload new photos first
      this.isUploading = true;
      this.uploadNewPhotos(newPhotos).pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isUploading = false;
        })
      ).subscribe({
        next: (results) => {
          // Filter out null values (failed uploads)
          const successfulUrls = results.filter((url): url is string => url !== null);
          const failedCount = newPhotos.length - successfulUrls.length;

          if (failedCount > 0) {
            this.message.warning(`${failedCount} fotografi${failedCount === 1 ? 'e nu a' : 'i nu au'} putut fi încărcate.`);
          }

          // Proceed with whatever uploads succeeded
          const allPhotoUrls = [...existingPhotoUrls, ...successfulUrls];
          this.submitUpdate(allPhotoUrls);
        },
        error: (error) => {
          console.error('[EditIssue] Failed to upload photos:', error);
          this.isSaving = false;
          this.message.error('Eroare la încărcarea fotografiilor. Încercați din nou.');
        }
      });
    }
  }

  private uploadNewPhotos(photos: NzUploadFile[]) {
    const uploadTasks = photos.map(photo => {
      const file = photo.originFileObj as File;
      return this.compressAndUpload(file).pipe(
        // Handle individual failures - return null for failed uploads
        // This prevents orphaned files: successful uploads are collected
        // even if some fail, and we can proceed with partial results
        catchError(error => {
          console.error('[EditIssue] Individual photo upload failed:', error);
          return of(null);
        })
      );
    });

    // Use merge instead of forkJoin - each upload is independent
    // forkJoin would cancel all if one fails, but photos already uploaded
    // would become orphaned. merge lets each complete independently.
    return merge(...uploadTasks).pipe(
      toArray()
    );
  }

  private compressAndUpload(file: File) {
    return from(this.compressImage(file)).pipe(
      switchMap(compressedFile =>
        this.storageService.uploadPhotoWithRetry(this.currentUserId!, compressedFile)
      ),
      switchMap((result: UploadResult) => of(result.url))
    );
  }

  private async compressImage(file: File): Promise<File> {
    try {
      const options = file.size < 500 * 1024
        ? { ...this.compressionOptions, maxSizeMB: Infinity }
        : this.compressionOptions;

      return await imageCompression(file, options);
    } catch (error) {
      console.error('[EditIssue] Compression failed:', error);
      throw new Error('Nu s-a putut procesa imaginea.');
    }
  }

  private submitUpdate(photoUrls: string[]): void {
    const updateData = {
      title: this.editForm.value.title,
      description: this.editForm.value.description,
      photoUrls: photoUrls,
      resubmit: true
    };

    this.apiService.editUserIssue(this.issueId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.message.success('Problema a fost retrimisă pentru aprobare!');

          // Refresh user issues list
          this.store.dispatch(UserIssuesActions.refreshUserIssues());

          // Navigate back to my issues
          this.router.navigate(['/my-issues']);
        },
        error: (error) => {
          console.error('[EditIssue] Failed to save:', error);
          this.isSaving = false;
          this.message.error('Eroare la salvare. Încercați din nou.');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/my-issues']);
  }
}
