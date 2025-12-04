import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, from, merge, of } from 'rxjs';
import { takeUntil, switchMap, catchError, finalize, toArray } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzProgressModule } from 'ng-zorro-antd/progress';

import imageCompression from 'browser-image-compression';

import { ApiService } from '../../../services/api.service';
import { StorageService, UploadResult } from '../../../services/storage.service';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { IssueCategory } from '../../../types/civica-api.types';

// Interface for category data from session storage
interface IssueCategoryInfo {
  id: IssueCategory;
  name: string;
  description: string;
  icon: string;
  examples: string[];
}

// Keep local PhotoData interface for component
interface PhotoData {
  id: string;
  url: string;
  thumbnail: string;
  storagePath: string;  // Supabase storage path for deletion
  quality: 'low' | 'medium' | 'high';
  timestamp: Date;
  metadata: {
    size: number;
    dimensions: { width: number; height: number };
    format: string;
  };
}

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzUploadModule,
    NzSpinModule,
    NzTypographyModule,
    NzAlertModule,
    NzGridModule,
    NzProgressModule
  ],
  templateUrl: './photo-upload.component.html',
  styleUrls: ['./photo-upload.component.scss']
})
export class PhotoUploadComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private currentUserId: string | null = null;

  // Track ongoing uploads for cancellation (prevents orphaned files)
  private ongoingUploads = new Map<string, Subject<void>>();

  // Compression settings for optimal storage/quality balance
  private readonly compressionOptions = {
    maxSizeMB: 1,              // Target max 1MB per image
    maxWidthOrHeight: 1920,    // Maintain good detail for civic issues
    useWebWorker: true,        // Non-blocking compression
    preserveExif: false,       // Strip GPS/device data (privacy)
    initialQuality: 0.85,      // 85% quality - visually identical
  };

  selectedCategory: IssueCategoryInfo | null = null;
  uploadedPhotos: PhotoData[] = [];
  isUploading = false;
  uploadProgress = 0;

  // Track number of files being compressed (counter instead of boolean for parallel uploads)
  private compressingCount = 0;
  get isCompressing(): boolean {
    return this.compressingCount > 0;
  }

  constructor(
    private router: Router,
    private message: NzMessageService,
    private apiService: ApiService,
    private storageService: StorageService,
    private authService: SupabaseAuthService
  ) {}

  ngOnInit(): void {
    this.loadSelectedCategory();
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    // Use getCurrentUserOnceReady to wait for initial auth check to complete
    // This prevents race condition where BehaviorSubject emits null before session is loaded
    this.authService.getCurrentUserOnceReady()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUserId = user.id;
          console.log('[PHOTO UPLOAD] User authenticated:', user.id);
        } else {
          console.warn('[PHOTO UPLOAD] No authenticated user, redirecting to login...');
          this.router.navigate(['/auth/login']);
        }
      });
  }

  ngOnDestroy(): void {
    // Cancel all ongoing uploads to prevent orphaned files
    this.ongoingUploads.forEach((cancel$, photoId) => {
      console.log('[PHOTO UPLOAD] Cancelling upload on destroy:', photoId);
      cancel$.next();
      cancel$.complete();
    });
    this.ongoingUploads.clear();

    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSelectedCategory(): void {
    const categoryData = sessionStorage.getItem('civica_selected_category');
    if (categoryData) {
      this.selectedCategory = JSON.parse(categoryData) as IssueCategoryInfo;
    } else {
      // No category selected, redirect back
      console.warn('[PHOTO UPLOAD] No category selected, redirecting...');
      this.router.navigate(['/create-issue']);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (this.uploadedPhotos.length + files.length > 5) {
      this.message.warning('Maxim 5 fotografii permise. Vă rugăm să ștergeți câteva fotografii mai întâi.');
      target.value = '';  // Reset to allow re-selection
      return;
    }

    // Copy files before resetting input (FileList becomes empty after reset)
    const filesToProcess = Array.from(files);

    // Reset file input to allow re-selecting the same files after deletion/failure
    target.value = '';

    this.isUploading = true;
    const uploadObservables = filesToProcess.map(file => this.processFile(file));

    // Use merge instead of forkJoin - each upload is independent
    // forkJoin cancels all if one completes without emitting (via takeUntil)
    // merge lets each upload complete independently, preventing orphaned files
    merge(...uploadObservables)
      .pipe(
        takeUntil(this.destroy$),
        toArray(),  // Wait for all to complete
        finalize(() => {
          this.isUploading = false;
        })
      )
      .subscribe();
  }

  /**
   * Process a single file: validate, compress, and upload.
   * Returns an Observable that completes when the file is processed.
   */
  private processFile(file: File) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.message.error(`${file.name} nu este un fișier imagine valid.`);
      return of(null);
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      this.message.error(`${file.name} este prea mare. Dimensiunea maximă este de 10MB.`);
      return of(null);
    }

    // Ensure user is authenticated
    if (!this.currentUserId) {
      this.message.error('Trebuie să fiți autentificat pentru a încărca fotografii.');
      return of(null);
    }

    // Create a local preview URL while processing
    const previewUrl = URL.createObjectURL(file);
    const photoId = this.generatePhotoId();

    // Create cancellation Subject for this upload
    const cancel$ = new Subject<void>();
    this.ongoingUploads.set(photoId, cancel$);

    // Add placeholder while compressing/uploading
    const photoData: PhotoData = {
      id: photoId,
      url: previewUrl,
      thumbnail: previewUrl,
      storagePath: '',  // Will be set after upload
      quality: this.analyzePhotoQuality(file),
      timestamp: new Date(),
      metadata: {
        size: file.size,
        dimensions: { width: 800, height: 600 },
        format: file.type
      }
    };
    this.uploadedPhotos.push(photoData);

    // Compress then upload using RxJS operators
    return from(this.compressImage(file)).pipe(
      takeUntil(cancel$),
      switchMap(compressedFile => {
        // Update metadata with compressed size
        const photoIndex = this.uploadedPhotos.findIndex(p => p.id === photoId);
        if (photoIndex !== -1) {
          this.uploadedPhotos[photoIndex].metadata.size = compressedFile.size;
        }

        // Upload compressed file to Supabase Storage (with automatic retry)
        return this.storageService.uploadPhotoWithRetry(this.currentUserId!, compressedFile).pipe(
          takeUntil(cancel$),
          switchMap((result: UploadResult) => {
            // Check if photo was removed while uploading
            const idx = this.uploadedPhotos.findIndex(p => p.id === photoId);
            if (idx === -1) {
              // Photo was removed during upload - delete orphaned file from storage
              console.log('[PHOTO UPLOAD] Photo removed during upload, cleaning up storage:', result.path);
              this.storageService.deletePhotoWithRetry(result.path)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => console.log('[PHOTO UPLOAD] Orphaned file cleaned up:', result.path),
                  error: (err) => console.error('[PHOTO UPLOAD] Failed to clean up orphaned file:', err)
                });
              URL.revokeObjectURL(previewUrl);
              return of(null);
            }

            // Update photo data with real URL from storage
            URL.revokeObjectURL(previewUrl);
            this.uploadedPhotos[idx] = {
              ...this.uploadedPhotos[idx],
              url: result.url,
              thumbnail: result.url,
              storagePath: result.path
            };

            this.message.success(`Fotografia a fost încărcată cu succes (calitate ${this.getQualityLabel(photoData.quality)})`);
            console.log('[PHOTO UPLOAD] Photo uploaded to storage:', result);
            return of(result);
          }),
          catchError(error => {
            console.error('[PHOTO UPLOAD] Upload failed:', error);
            // Remove the failed photo from the list
            const idx = this.uploadedPhotos.findIndex(p => p.id === photoId);
            if (idx !== -1) {
              URL.revokeObjectURL(previewUrl);
              this.uploadedPhotos.splice(idx, 1);
            }
            this.message.error(`Încărcarea fotografiei a eșuat: ${error.message || 'Eroare necunoscută'}`);
            return of(null);
          })
        );
      }),
      catchError(error => {
        console.error('[PHOTO UPLOAD] Compression failed:', error);
        const idx = this.uploadedPhotos.findIndex(p => p.id === photoId);
        if (idx !== -1) {
          URL.revokeObjectURL(previewUrl);
          this.uploadedPhotos.splice(idx, 1);
        }
        this.message.error(`Compresia imaginii a eșuat: ${error.message || 'Eroare necunoscută'}`);
        return of(null);
      }),
      finalize(() => {
        // Clean up the cancellation Subject
        this.ongoingUploads.delete(photoId);
        cancel$.complete();

        // Revoke blob URL if still present (handles cancellation case)
        // On success/error, blob is already revoked, but on cancel via takeUntil it's not
        if (previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
      })
    );
  }

  private generatePhotoId(): string {
    return 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  }

  private analyzePhotoQuality(file: File): 'low' | 'medium' | 'high' {
    // Quality analysis based on file size
    if (file.size > 2000000) return 'high'; // > 2MB
    if (file.size > 500000) return 'medium'; // > 500KB
    return 'low';
  }

  /**
   * Process image before upload: strips EXIF data (including GPS) for privacy,
   * and compresses larger files to reduce storage costs and upload time.
   */
  private async compressImage(file: File): Promise<File> {
    this.compressingCount++;
    try {
      // For small files, only strip EXIF without aggressive compression
      const options = file.size < 500 * 1024
        ? { ...this.compressionOptions, maxSizeMB: Infinity }  // Strip EXIF only
        : this.compressionOptions;  // Full compression + EXIF strip

      const processedFile = await imageCompression(file, options);

      const originalSizeKB = Math.round(file.size / 1024);
      const processedSizeKB = Math.round(processedFile.size / 1024);
      const reduction = Math.round((1 - processedFile.size / file.size) * 100);

      if (file.size < 500 * 1024) {
        console.log(`[PHOTO UPLOAD] EXIF stripped from small file: ${file.name} (${originalSizeKB}KB)`);
      } else {
        console.log(`[PHOTO UPLOAD] Compressed: ${originalSizeKB}KB → ${processedSizeKB}KB (${reduction}% reduction)`);
      }

      return processedFile;
    } catch (error) {
      // PRIVACY: Do NOT fall back to original file - it may contain GPS/location data
      // Fail the upload to protect user privacy
      console.error('[PHOTO UPLOAD] Image processing failed:', error);
      throw new Error(`Nu s-a putut procesa imaginea "${file.name}". Vă rugăm să încercați cu altă fotografie.`);
    } finally {
      this.compressingCount--;
    }
  }

  getQualityLabel(quality: string): string {
    const labels: { [key: string]: string } = {
      'high': 'Înaltă',
      'medium': 'Bună',
      'low': 'De bază'
    };
    return labels[quality] || 'Unknown';
  }

  viewPhoto(photo: PhotoData): void {
    console.log('[PHOTO UPLOAD] View photo:', photo.id);
    // TODO: Open photo in lightbox/modal
    window.open(photo.url, '_blank');
  }

  removePhoto(index: number): void {
    // Bounds check to prevent crash on rapid double-click or stale calls
    if (index < 0 || index >= this.uploadedPhotos.length) {
      console.warn('[PHOTO UPLOAD] Invalid index for removePhoto:', index);
      return;
    }

    const photo = this.uploadedPhotos[index];
    console.log('[PHOTO UPLOAD] Remove photo:', photo.id);

    // Cancel ongoing upload if one exists (prevents orphaned files)
    const cancel$ = this.ongoingUploads.get(photo.id);
    if (cancel$) {
      console.log('[PHOTO UPLOAD] Cancelling ongoing upload for:', photo.id);
      cancel$.next();
      cancel$.complete();
      this.ongoingUploads.delete(photo.id);
    }

    // Remove from local array for immediate UI feedback
    this.uploadedPhotos.splice(index, 1);

    // If photo was uploaded to storage, delete it (with automatic retry)
    if (photo.storagePath) {
      this.storageService.deletePhotoWithRetry(photo.storagePath)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('[PHOTO UPLOAD] Photo deleted from storage:', photo.storagePath);
            this.message.info('Fotografia a fost ștearsă');
          },
          error: (error) => {
            console.error('[PHOTO UPLOAD] Failed to delete from storage:', error);
            // Photo already removed from UI, just log the error
            this.message.warning('Fotografia a fost eliminată local, dar ștergerea din stocare a eșuat');
          }
        });
    } else {
      // Photo was only a preview (upload failed, cancelled, or still in progress)
      if (photo.url.startsWith('blob:')) {
        URL.revokeObjectURL(photo.url);
      }
      this.message.info('Fotografia a fost ștearsă');
    }
  }

  continueToDetails(): void {
    if (this.uploadedPhotos.length === 0) {
      this.message.warning('Vă rugăm să încărcați cel puțin o fotografie pentru a continua');
      return;
    }

    // Ensure all photos have been uploaded (have storage paths)
    const pendingUploads = this.uploadedPhotos.filter(p => !p.storagePath);
    if (pendingUploads.length > 0) {
      this.message.warning('Vă rugăm să așteptați finalizarea încărcării tuturor fotografiilor');
      return;
    }

    console.log('[PHOTO UPLOAD] Continuing to details with photos:', this.uploadedPhotos.length);

    // Store photos in session storage (now with real URLs and storage paths)
    const photosData = this.uploadedPhotos.map(photo => ({
      id: photo.id,
      url: photo.url,
      thumbnail: photo.thumbnail,
      storagePath: photo.storagePath,
      quality: photo.quality,
      timestamp: photo.timestamp,
      metadata: photo.metadata
    }));

    sessionStorage.setItem('civica_uploaded_photos', JSON.stringify(photosData));

    this.router.navigate(['/create-issue/details']);
  }
}