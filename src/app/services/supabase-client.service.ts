import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Shared Supabase client service.
 *
 * Provides a single configured Supabase client instance for use across all services.
 * This ensures consistent auth configuration (persistSession, detectSessionInUrl, PKCE flow)
 * and prevents issues with multiple client instances having different auth states.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabase.url,
      environment.supabase.publishableKey,
      {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
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
