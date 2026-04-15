import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_PREFIX = 'civica_dismissed_';

/**
 * Tracks UI dismissals (e.g. post-submit nudges, banners) that should stay
 * hidden after the user closes them.
 *
 * Backed by localStorage so the dismissal sticks across sessions on the same
 * device, but kept as signals so components can react without manual refresh.
 */
@Injectable({ providedIn: 'root' })
export class DismissalService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly flags = new Map<string, ReturnType<typeof signal<boolean>>>();

  isDismissed(key: string) {
    return this.getFlag(key).asReadonly();
  }

  dismiss(key: string): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, '1');
      } catch {
        // Storage unavailable (private browsing, quota, etc.) — fall back to
        // in-memory dismissal via the signal. User won't see it again this
        // session; next visit will re-show.
      }
    }
    this.getFlag(key).set(true);
  }

  private getFlag(key: string) {
    let flag = this.flags.get(key);
    if (!flag) {
      flag = signal(this.readInitial(key));
      this.flags.set(key, flag);
    }
    return flag;
  }

  private readInitial(key: string): boolean {
    if (!this.isBrowser) {
      return false;
    }
    try {
      return localStorage.getItem(STORAGE_PREFIX + key) === '1';
    } catch {
      return false;
    }
  }
}
