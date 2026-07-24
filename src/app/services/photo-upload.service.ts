import { Injectable } from '@angular/core';
import imageCompression from 'browser-image-compression';
import { MAX_PHOTO_MB } from '../components/issue-creation/issue-field.constants';

/**
 * Shared image-preparation pipeline for issue photos, used by both the create wizard
 * (photo-upload) and the edit-issue editor. Centralizes the privacy-critical compression
 * so the EXIF hard-fail can never be bypassed by one caller. The actual upload lives in
 * StorageService; blob-preview and list bookkeeping stay in each parent (render-timing bound).
 */
@Injectable({ providedIn: 'root' })
export class PhotoUploadService {
  // Compression settings for optimal storage/quality balance (identical across both flows).
  private readonly compressionOptions = {
    maxSizeMB: 1,              // Target max 1MB per image
    maxWidthOrHeight: 1920,    // Maintain good detail for civic issues
    useWebWorker: true,        // Non-blocking compression
    preserveExif: false,       // Strip GPS/device data (privacy)
    initialQuality: 0.85,      // 85% quality - visually identical
  };

  /**
   * Validate a candidate image: must be an image and within the size ceiling. Pure, no toasts —
   * the caller decides how to surface the reason.
   */
  validate(file: File, maxPhotoMb: number = MAX_PHOTO_MB): { ok: true } | { ok: false; reason: string } {
    if (!file.type.startsWith('image/')) {
      return { ok: false, reason: `${file.name} nu este un fișier imagine valid.` };
    }
    if (file.size > maxPhotoMb * 1024 * 1024) {
      return { ok: false, reason: `${file.name} este prea mare. Dimensiunea maximă este de ${maxPhotoMb}MB.` };
    }
    return { ok: true };
  }

  /**
   * Compress and strip EXIF. Files under 500KB only get EXIF stripped (maxSizeMB: Infinity),
   * larger files are also compressed.
   *
   * PRIVACY HARD-FAIL: throws on failure — it NEVER returns the original file, which may still
   * carry GPS/location EXIF. Callers must drop the photo on error, not fall back to the original.
   */
  async compress(file: File): Promise<File> {
    try {
      const options = file.size < 500 * 1024
        ? { ...this.compressionOptions, maxSizeMB: Infinity }  // strip EXIF only
        : this.compressionOptions;                            // full compression + EXIF strip
      return await imageCompression(file, options);
    } catch (error) {
      console.error('[PhotoUpload] Image processing failed:', error);
      throw new Error(`Nu s-a putut procesa imaginea "${file.name}". Vă rugăm să încercați cu altă fotografie.`);
    }
  }

  /** Quality bucket by file size — used as a list decoration in the create flow. */
  analyzeQuality(file: File): 'low' | 'medium' | 'high' {
    if (file.size > 2_000_000) return 'high';   // > 2MB
    if (file.size > 500_000) return 'medium';   // > 500KB
    return 'low';
  }

  /** Return a copy sorted so the primary item is first (used to order photoUrls on submit). */
  sortPrimaryFirst<T extends { isPrimary: boolean }>(items: readonly T[]): T[] {
    return [...items].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  }
}
