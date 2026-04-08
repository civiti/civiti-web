import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * No-op storage adapter used on the server so Supabase never touches
 * `localStorage` during SSR. Returning `null` from `getItem` makes Supabase
 * behave as if there is no persisted session, which is correct on the server.
 */
const noopServerStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {}
};

/**
 * Shared Supabase client service.
 *
 * Provides a single configured Supabase client instance for use across all services.
 * This ensures consistent auth configuration (persistSession, detectSessionInUrl, PKCE flow)
 * and prevents issues with multiple client instances having different auth states.
 *
 * On the server, the client is created with a no-op storage adapter and
 * `persistSession: false` so that SSR renders do not attempt to read or write
 * browser storage.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly client: SupabaseClient;

  constructor() {
    const isBrowser = isPlatformBrowser(this.platformId);
    this.client = createClient(
      environment.supabase.url,
      environment.supabase.publishableKey,
      {
        auth: {
          persistSession: isBrowser,
          detectSessionInUrl: isBrowser,
          // `autoRefreshToken: true` starts a setInterval in GoTrueClient's
          // constructor. On the server that keeps the Angular Zone perpetually
          // busy and prevents prerender/SSR from reaching stable state.
          autoRefreshToken: isBrowser,
          flowType: 'pkce',
          storage: isBrowser ? undefined : noopServerStorage
        }
      }
    );
  }

  /**
   * Get the shared Supabase client instance.
   * All services should use this client to ensure consistent auth state.
   */
  getClient(): SupabaseClient {
    return this.client;
  }
}
