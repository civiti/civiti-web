import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { defer, Observable, throwError, timer } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';
import { SupabaseClientService } from './supabase-client.service';

/**
 * Result of a successful photo upload
 */
export interface UploadResult {
  /** Storage path for the uploaded file */
  path: string;
  /** Public URL to access the file */
  url: string;
  /** Original filename */
  filename: string;
  /** File size in bytes */
  size: number;
}

/**
 * Progress information during upload
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Service for managing photo uploads to Supabase Storage.
 *
 * Photos are stored in the 'issue-photos' bucket with the path structure:
 * {userId}/{timestamp}-{filename}
 *
 * This enables user-scoped RLS policies and prevents filename collisions.
 */
/** Retry configuration options */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in ms between retries (default: 8000) */
  maxDelayMs?: number;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private supabase: SupabaseClient;
  private readonly BUCKET = 'issue-photos';

  /** Default retry configuration */
  private readonly DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 8000
  };

  constructor(private supabaseClientService: SupabaseClientService) {
    this.supabase = this.supabaseClientService.getClient();
  }

  /**
   * Upload a photo to Supabase Storage
   * @param userId - The authenticated user's ID
   * @param file - The file to upload
   * @returns Observable with upload result containing path and URL
   */
  uploadPhoto(userId: string, file: File): Observable<UploadResult> {
    // Generate path OUTSIDE defer so retries use the same path (prevents orphaned files)
    const timestamp = Date.now();
    const sanitizedFilename = this.sanitizeFilename(file.name);
    const filePath = `${userId}/${timestamp}-${sanitizedFilename}`;

    // Use defer to create the Promise lazily on each subscription
    // This ensures retries actually create new upload attempts
    return defer(() =>
      this.supabase.storage
        .from(this.BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true  // Allow overwrite on retry (prevents orphans if upload succeeded but response failed)
        })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }

        const { data: urlData } = this.supabase.storage
          .from(this.BUCKET)
          .getPublicUrl(data.path);

        return {
          path: data.path,
          url: urlData.publicUrl,
          filename: file.name,
          size: file.size
        };
      }),
      catchError(error => {
        console.error('[StorageService] Upload error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload a photo with automatic retry on failure.
   * Uses exponential backoff to avoid overwhelming the server.
   *
   * @param userId - The authenticated user's ID
   * @param file - The file to upload
   * @param retryConfig - Optional retry configuration
   * @returns Observable with upload result containing path and URL
   */
  uploadPhotoWithRetry(
    userId: string,
    file: File,
    retryConfig?: RetryConfig
  ): Observable<UploadResult> {
    const config = { ...this.DEFAULT_RETRY_CONFIG, ...retryConfig };

    return this.uploadPhoto(userId, file).pipe(
      retry({
        count: config.maxRetries,
        delay: (error, retryCount) => {
          // Exponential backoff: 1s, 2s, 4s, 8s (capped at maxDelayMs)
          const delayMs = Math.min(
            config.initialDelayMs * Math.pow(2, retryCount - 1),
            config.maxDelayMs
          );

          console.log(
            `[StorageService] Upload failed, retry ${retryCount}/${config.maxRetries} in ${delayMs}ms...`,
            error.message || error
          );

          return timer(delayMs);
        }
      }),
      catchError(error => {
        console.error(
          `[StorageService] Upload failed after ${config.maxRetries} retries:`,
          error
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a photo from storage
   * @param path - The storage path of the file to delete
   */
  deletePhoto(path: string): Observable<void> {
    // Use defer to create the Promise lazily on each subscription
    // This ensures retries actually create new delete attempts
    return defer(() =>
      this.supabase.storage
        .from(this.BUCKET)
        .remove([path])
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw new Error(`Delete failed: ${error.message}`);
        }
      }),
      catchError(error => {
        console.error('[StorageService] Delete error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a photo with automatic retry on failure.
   * @param path - The storage path of the file to delete
   * @param retryConfig - Optional retry configuration
   */
  deletePhotoWithRetry(path: string, retryConfig?: RetryConfig): Observable<void> {
    const config = { ...this.DEFAULT_RETRY_CONFIG, ...retryConfig };

    return this.deletePhoto(path).pipe(
      retry({
        count: config.maxRetries,
        delay: (error, retryCount) => {
          const delayMs = Math.min(
            config.initialDelayMs * Math.pow(2, retryCount - 1),
            config.maxDelayMs
          );
          console.log(
            `[StorageService] Delete failed, retry ${retryCount}/${config.maxRetries} in ${delayMs}ms...`
          );
          return timer(delayMs);
        }
      }),
      catchError(error => {
        console.error(`[StorageService] Delete failed after ${config.maxRetries} retries:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete multiple photos at once
   * @param paths - Array of storage paths to delete
   */
  deletePhotos(paths: string[]): Observable<void> {
    if (paths.length === 0) {
      return defer(() => Promise.resolve());
    }

    // Use defer for lazy Promise creation (consistent with other methods)
    return defer(() =>
      this.supabase.storage
        .from(this.BUCKET)
        .remove(paths)
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw new Error(`Bulk delete failed: ${error.message}`);
        }
      }),
      catchError(error => {
        console.error('[StorageService] Bulk delete error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a signed URL for private file access
   * @param path - The storage path
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  getSignedUrl(path: string, expiresIn = 3600): Observable<string> {
    return defer(() =>
      this.supabase.storage
        .from(this.BUCKET)
        .createSignedUrl(path, expiresIn)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(`Failed to create signed URL: ${error.message}`);
        }
        return data.signedUrl;
      }),
      catchError(error => {
        console.error('[StorageService] Signed URL error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get the public URL for a file
   * @param path - The storage path
   */
  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(this.BUCKET)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * List all photos for a user
   * @param userId - The user's ID
   */
  listUserPhotos(userId: string): Observable<string[]> {
    return defer(() =>
      this.supabase.storage
        .from(this.BUCKET)
        .list(userId)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(`List failed: ${error.message}`);
        }
        return data.map(file => `${userId}/${file.name}`);
      }),
      catchError(error => {
        console.error('[StorageService] List error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Sanitize filename to prevent path traversal and encoding issues
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }
}
