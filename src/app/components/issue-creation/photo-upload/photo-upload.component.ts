import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  afterNextRender,
  Injector,
  DestroyRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, from, merge, of } from 'rxjs';
import { takeUntil, switchMap, catchError, finalize, toArray } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
export class PhotoUploadComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _cdr = inject(ChangeDetectorRef);
  private readonly _injector = inject(Injector);
  private readonly _destroyRef = inject(DestroyRef);
  private _isDestroyed = false;
  private currentUserId: string | null = null;

  // Track ongoing uploads for cancellation (prevents orphaned files)
  private ongoingUploads = new Map<string, Subject<void>>();

  // GLightbox instance for photo gallery
  private _lightbox: any;
  private _galleryInitPromise: Promise<void> | null = null;
  private _galleryNeedsRefresh = false;

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
    private storageService: StorageService,
    private authService: SupabaseAuthService
  ) {}

  ngOnInit(): void {
    this.loadSelectedCategory();
    this.loadCurrentUser();
    this.loadExistingPhotos();
  }

  private loadCurrentUser(): void {
    // Use getCurrentUserOnceReady to wait for initial auth check to complete
    // This prevents race condition where BehaviorSubject emits null before session is loaded
    this.authService.getCurrentUserOnceReady()
      .pipe(takeUntilDestroyed(this._destroyRef))
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

  ngAfterViewInit(): void {
    // Initialize GLightbox after view is ready (only in browser)
    if (isPlatformBrowser(this._platformId)) {
      this._galleryInitPromise = this.initializeGallery();
    }
  }

  ngOnDestroy(): void {
    this._isDestroyed = true;

    // Cancel all ongoing uploads to prevent orphaned files
    this.ongoingUploads.forEach((cancel$, photoId) => {
      console.log('[PHOTO UPLOAD] Cancelling upload on destroy:', photoId);
      cancel$.next();
      cancel$.complete();
    });
    this.ongoingUploads.clear();

    // Clean up GLightbox instance
    if (this._lightbox) {
      this._lightbox.destroy();
      this._lightbox = null;  // Clear reference to prevent calls on destroyed instance
    }
  }

  /**
   * Initialize GLightbox for photo gallery
   */
  private async initializeGallery(): Promise<void> {
    if (!isPlatformBrowser(this._platformId)) {
      return;
    }

    try {
      // Dynamically import GLightbox to avoid SSR issues
      const GLightbox = (await import('glightbox')).default;

      // Guard against initialization after component destruction
      if (this._isDestroyed) {
        return;
      }

      this._lightbox = GLightbox({
        selector: '.photo-gallery-item',
        touchNavigation: true,
        loop: true,
        autoplayVideos: false,
        closeOnOutsideClick: true,
        openEffect: 'zoom',
        closeEffect: 'fade',
        cssEffects: {
          fade: { in: 'fadeIn', out: 'fadeOut' },
          zoom: { in: 'zoomIn', out: 'zoomOut' }
        }
      });
    } catch (error) {
      console.error('[PHOTO UPLOAD] Error loading GLightbox:', error);
    }
  }

  /**
   * Schedule gallery refresh after next render cycle.
   * Uses Angular's afterNextRender for proper integration with change detection.
   */
  scheduleGalleryRefresh(): void {
    if (!isPlatformBrowser(this._platformId)) {
      return;
    }

    // Prevent multiple scheduled refreshes
    if (this._galleryNeedsRefresh) {
      return;
    }

    this._galleryNeedsRefresh = true;

    // Use Angular's afterNextRender to wait for DOM to be updated
    afterNextRender(async () => {
      this._galleryNeedsRefresh = false;
      await this.executeGalleryRefresh();
    }, { injector: this._injector });
  }

  /**
   * Execute the actual gallery refresh.
   * Awaits initialization to prevent race condition with dynamic import.
   */
  private async executeGalleryRefresh(): Promise<void> {
    // Guard against execution after component destruction
    if (this._isDestroyed) {
      return;
    }

    // Wait for GLightbox to be initialized
    if (this._galleryInitPromise) {
      await this._galleryInitPromise;
    } else if (!this._lightbox) {
      // Edge case: called before ngAfterViewInit - initialize now
      this._galleryInitPromise = this.initializeGallery();
      await this._galleryInitPromise;
    }

    // Re-check after async operations in case component was destroyed while waiting
    if (this._isDestroyed) {
      return;
    }

    if (this._lightbox) {
      this._lightbox.reload();
    }
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

  /**
   * Save current photos to sessionStorage.
   * Called after upload success and photo removal to persist state.
   */
  private savePhotosToSession(): void {
    const photosData = this.uploadedPhotos
      .filter(photo => photo.storagePath) // Only save uploaded photos
      .map(photo => ({
        id: photo.id,
        url: photo.url,
        thumbnail: photo.thumbnail,
        storagePath: photo.storagePath,
        quality: photo.quality,
        timestamp: photo.timestamp,
        metadata: photo.metadata
      }));
    sessionStorage.setItem('civica_uploaded_photos', JSON.stringify(photosData));
  }

  /**
   * Load previously uploaded photos from sessionStorage.
   * This enables back navigation without losing uploaded photos.
   */
  private loadExistingPhotos(): void {
    const photosData = sessionStorage.getItem('civica_uploaded_photos');
    if (photosData) {
      try {
        const photos = JSON.parse(photosData) as PhotoData[];
        if (photos.length > 0) {
          // Restore photos that have valid storage paths (already uploaded)
          this.uploadedPhotos = photos.filter(photo => photo.storagePath);
          console.log('[PHOTO UPLOAD] Restored photos from session:', this.uploadedPhotos.length);

          // Schedule gallery refresh after Angular renders the restored photos
          this.scheduleGalleryRefresh();
        }
      } catch (e) {
        console.warn('[PHOTO UPLOAD] Failed to parse saved photos:', e);
        sessionStorage.removeItem('civica_uploaded_photos');
      }
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
        takeUntilDestroyed(this._destroyRef),
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

    // Track whether blob URL has been handled (to avoid double-revocation)
    let blobUrlHandled = false;

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
                .pipe(takeUntilDestroyed(this._destroyRef))
                .subscribe({
                  next: () => console.log('[PHOTO UPLOAD] Orphaned file cleaned up:', result.path),
                  error: (err) => console.error('[PHOTO UPLOAD] Failed to clean up orphaned file:', err)
                });
              blobUrlHandled = true;
              URL.revokeObjectURL(previewUrl);
              return of(null);
            }

            // Update photo data with real URL from storage
            // IMPORTANT: Update the URL first, force change detection, THEN revoke blob
            this.uploadedPhotos[idx] = {
              ...this.uploadedPhotos[idx],
              url: result.url,
              thumbnail: result.url,
              storagePath: result.path
            };

            // Force Angular to update the view with the new URL
            this._cdr.detectChanges();

            // Mark blob as handled and delay revocation to ensure the new image has started loading
            blobUrlHandled = true;
            setTimeout(() => URL.revokeObjectURL(previewUrl), 500);

            this.message.success('Fotografia a fost încărcată cu succes');
            console.log('[PHOTO UPLOAD] Photo uploaded to storage:', result);

            // Save to sessionStorage for back navigation support
            this.savePhotosToSession();

            // Schedule gallery refresh after Angular renders the new photo
            this.scheduleGalleryRefresh();

            return of(result);
          }),
          catchError(error => {
            console.error('[PHOTO UPLOAD] Upload failed:', error);
            // Remove the failed photo from the list
            const idx = this.uploadedPhotos.findIndex(p => p.id === photoId);
            if (idx !== -1) {
              blobUrlHandled = true;
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
          blobUrlHandled = true;
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

        // Only revoke blob URL if it wasn't already handled (cancellation case)
        // Success/error paths set blobUrlHandled=true and handle revocation with proper timing
        if (!blobUrlHandled) {
          console.log('[PHOTO UPLOAD] Revoking blob URL in finalize (cancelled):', photoId);
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


  /**
   * Handle image load error - helps debug broken images
   */
  onImageError(event: Event, photo: PhotoData): void {
    console.error('[PHOTO UPLOAD] Image failed to load:', {
      photoId: photo.id,
      url: photo.url,
      storagePath: photo.storagePath,
      isBlobUrl: photo.url.startsWith('blob:')
    });
  }

  /**
   * Handle successful image load
   */
  onImageLoad(event: Event, photo: PhotoData): void {
    console.log('[PHOTO UPLOAD] Image loaded successfully:', {
      photoId: photo.id,
      url: photo.url.substring(0, 50) + '...',
      isBlobUrl: photo.url.startsWith('blob:')
    });
  }

  /**
   * Handle direct clicks on gallery item anchors.
   * If GLightbox is ready, let it intercept; otherwise prevent navigation and open in new tab.
   */
  onGalleryItemClick(event: Event, photo: PhotoData): void {
    if (!this._lightbox) {
      // Prevent anchor navigation when GLightbox not ready
      event.preventDefault();
      window.open(photo.url, '_blank');
    }
    // If _lightbox exists, let the event propagate for GLightbox to handle
  }

  viewPhoto(photo: PhotoData, index: number): void {
    console.log('[PHOTO UPLOAD] View photo:', photo.id);

    // If GLightbox is initialized, trigger it via the anchor element
    if (this._lightbox) {
      const galleryItem = document.querySelector(`#photo-gallery-${index}`) as HTMLElement;
      if (galleryItem) {
        galleryItem.click();
        return;
      }
    }

    // Fallback: open in new tab if GLightbox not ready (prevents navigation away)
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

    // Save updated state to sessionStorage
    this.savePhotosToSession();

    // Schedule gallery refresh after Angular updates the DOM
    this.scheduleGalleryRefresh();

    // If photo was uploaded to storage, delete it (with automatic retry)
    if (photo.storagePath) {
      this.storageService.deletePhotoWithRetry(photo.storagePath)
        .pipe(takeUntilDestroyed(this._destroyRef))
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