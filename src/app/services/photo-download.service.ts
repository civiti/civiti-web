import { Injectable } from '@angular/core';
import { Observable, Subject, from, of } from 'rxjs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface PhotoDownloadProgress {
  downloadId: string;
  phase: 'fetching' | 'zipping' | 'complete' | 'error';
  current: number;
  total: number;
  percentage: number;
  message: string;
}

export interface PhotoDownloadResult {
  downloadId: string;
  success: boolean;
  downloadedCount: number;
  failedCount: number;
  message: string;
}

interface PhotoInfo {
  url: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoDownloadService {
  private _progress$ = new Subject<PhotoDownloadProgress>();
  private _downloadCounter = 0;

  get progress$(): Observable<PhotoDownloadProgress> {
    return this._progress$.asObservable();
  }

  /**
   * Generates a unique download ID for tracking progress
   */
  generateDownloadId(): string {
    return `download-${++this._downloadCounter}-${Date.now()}`;
  }

  downloadPhotosAsZip(
    photos: PhotoInfo[],
    issueId: string,
    downloadId: string,
    issueTitle?: string
  ): Observable<PhotoDownloadResult> {
    if (!photos || photos.length === 0) {
      return of({
        downloadId,
        success: false,
        downloadedCount: 0,
        failedCount: 0,
        message: 'Nu există fotografii de descărcat.'
      });
    }

    return from(this._createAndDownloadZip(photos, issueId, downloadId, issueTitle));
  }

  private async _createAndDownloadZip(
    photos: PhotoInfo[],
    issueId: string,
    downloadId: string,
    issueTitle?: string
  ): Promise<PhotoDownloadResult> {
    const zip = new JSZip();
    const total = photos.length;
    let downloadedCount = 0;
    let failedCount = 0;

    // Fetch all photos
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];

      this._progress$.next({
        downloadId,
        phase: 'fetching',
        current: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 80),
        message: `Se descarcă fotografia ${i + 1} din ${total}...`
      });

      try {
        const response = await fetch(photo.url, { mode: 'cors' });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const blob = await response.blob();
        const extension = this._getExtensionFromUrl(photo.url) || this._getExtensionFromMime(blob.type) || 'jpg';
        const fileName = `foto-${String(i + 1).padStart(2, '0')}.${extension}`;

        zip.file(fileName, blob);
        downloadedCount++;
      } catch (error) {
        console.error(`Failed to fetch photo ${i + 1}:`, error);
        failedCount++;
      }
    }

    // Check if any photos were downloaded
    if (downloadedCount === 0) {
      this._progress$.next({
        downloadId,
        phase: 'error',
        current: 0,
        total,
        percentage: 0,
        message: 'Nu s-a putut descărca nicio fotografie.'
      });

      return {
        downloadId,
        success: false,
        downloadedCount: 0,
        failedCount,
        message: 'Nu s-a putut descărca nicio fotografie. Verifică conexiunea la internet.'
      };
    }

    // Create ZIP
    this._progress$.next({
      downloadId,
      phase: 'zipping',
      current: downloadedCount,
      total,
      percentage: 90,
      message: 'Se creează arhiva ZIP...'
    });

    try {
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Generate filename
      const shortId = issueId.substring(0, 8);
      const zipFileName = `problema-${shortId}-fotografii.zip`;

      // Trigger download
      saveAs(zipBlob, zipFileName);

      this._progress$.next({
        downloadId,
        phase: 'complete',
        current: downloadedCount,
        total,
        percentage: 100,
        message: 'Descărcare completă!'
      });

      return {
        downloadId,
        success: true,
        downloadedCount,
        failedCount,
        message: failedCount > 0
          ? `S-au descărcat ${downloadedCount} fotografii. ${failedCount} nu au putut fi descărcate.`
          : `S-au descărcat toate cele ${downloadedCount} fotografii cu succes!`
      };
    } catch (error) {
      console.error('Failed to create ZIP:', error);

      this._progress$.next({
        downloadId,
        phase: 'error',
        current: downloadedCount,
        total,
        percentage: 0,
        message: 'Eroare la crearea arhivei ZIP.'
      });

      return {
        downloadId,
        success: false,
        downloadedCount,
        failedCount: total - downloadedCount,
        message: 'Eroare la crearea arhivei ZIP.'
      };
    }
  }

  private _getExtensionFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      if (match) {
        const ext = match[1].toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
          return ext === 'jpeg' ? 'jpg' : ext;
        }
      }
    } catch {
      // Invalid URL
    }
    return null;
  }

  private _getExtensionFromMime(mimeType: string): string | null {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp'
    };
    return mimeMap[mimeType] || null;
  }
}
