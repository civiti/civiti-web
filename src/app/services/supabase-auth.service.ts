import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, AuthResponse, User } from '@supabase/supabase-js';
import { Observable, from, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { resetTokenRefreshState } from '../interceptors/auth.interceptor';

export interface SupabaseAuthUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  authProvider: 'google' | 'email';
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface SupabaseAuthResponse {
  user: SupabaseAuthUser;
  token: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthService {
  private supabase: SupabaseClient;
  private currentUser$ = new BehaviorSubject<SupabaseAuthUser | null>(null);

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      }
    );

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = this.mapSupabaseUserToAuthUser(session.user);
        this.currentUser$.next(user);
        
        // Store tokens
        if (session.access_token) {
          localStorage.setItem('civica_access_token', session.access_token);
        }
        if (session.refresh_token) {
          localStorage.setItem('civica_refresh_token', session.refresh_token);
        }
      } else if (event === 'SIGNED_OUT') {
        this.currentUser$.next(null);
        localStorage.removeItem('civica_access_token');
        localStorage.removeItem('civica_refresh_token');
      }
    });

    // Check for existing session on service initialization
    this.checkExistingSession();
  }

  private async checkExistingSession(): Promise<void> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (session?.user && !error) {
        const user = this.mapSupabaseUserToAuthUser(session.user);
        this.currentUser$.next(user);
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }
  }

  private mapSupabaseUserToAuthUser(user: User): SupabaseAuthUser {
    return {
      id: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || user.email || '',
      photoURL: user.user_metadata?.['avatar_url'] || user.user_metadata?.['picture'],
      authProvider: user.app_metadata?.provider === 'google' ? 'google' : 'email',
      emailVerified: user.email_confirmed_at != null,
      createdAt: new Date(user.created_at),
      lastLoginAt: new Date()
    };
  }

  // ============================================
  // Authentication Methods
  // ============================================

  signInWithGoogle(): Observable<SupabaseAuthResponse> {
    return from(
      this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      })
    ).pipe(
      map(() => {
        // OAuth redirect will handle the actual authentication
        // Return placeholder data as the real data will come through the auth state listener
        throw new Error('OAuth redirect initiated');
      }),
      catchError(error => {
        if (error.message === 'OAuth redirect initiated') {
          // This is expected for OAuth flows
          return throwError(() => ({ type: 'oauth_redirect', message: 'Redirecting to Google OAuth' }));
        }
        return throwError(() => error);
      })
    );
  }

  signInWithEmail(email: string, password: string): Observable<SupabaseAuthResponse> {
    return from(
      this.supabase.auth.signInWithPassword({
        email,
        password
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data.user || !data.session) {
          throw new Error('No user or session returned from authentication');
        }

        const user = this.mapSupabaseUserToAuthUser(data.user);
        
        return {
          user,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token || ''
        };
      }),
      catchError(error => {
        console.error('Email sign in error:', error);
        return throwError(() => new Error(this.getErrorMessage(error)));
      })
    );
  }

  signUpWithEmail(email: string, password: string, displayName: string): Observable<SupabaseAuthResponse> {
    return from(
      this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName
          }
        }
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data.user) {
          throw new Error('No user returned from registration');
        }

        const user = this.mapSupabaseUserToAuthUser(data.user);

        // For sign up, session might be null if email confirmation is required
        const token = data.session?.access_token || '';
        const refreshToken = data.session?.refresh_token || '';

        return {
          user,
          token,
          refreshToken
        };
      }),
      catchError(error => {
        console.error('Email sign up error:', error);
        return throwError(() => new Error(this.getErrorMessage(error)));
      })
    );
  }

  signOut(): Observable<void> {
    return from(this.supabase.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      tap(() => {
        this.currentUser$.next(null);
        localStorage.removeItem('civica_access_token');
        localStorage.removeItem('civica_refresh_token');
        // Reset token refresh state to clean up any pending requests
        resetTokenRefreshState();
      }),
      catchError(error => {
        console.error('Sign out error:', error);
        // Reset state even on error
        resetTokenRefreshState();
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Token Management
  // ============================================

  getAccessToken(): string | null {
    return localStorage.getItem('civica_access_token');
  }

  refreshToken(): Observable<string> {
    return from(this.supabase.auth.refreshSession()).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data.session) {
          throw new Error('No session returned from token refresh');
        }

        const token = data.session.access_token;
        localStorage.setItem('civica_access_token', token);
        
        if (data.session.refresh_token) {
          localStorage.setItem('civica_refresh_token', data.session.refresh_token);
        }

        return token;
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        // Clear stored tokens on refresh failure
        localStorage.removeItem('civica_access_token');
        localStorage.removeItem('civica_refresh_token');
        this.currentUser$.next(null);
        return throwError(() => error);
      })
    );
  }

  isAuthenticated(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => user !== null)
    );
  }

  getCurrentUser(): Observable<SupabaseAuthUser | null> {
    return this.currentUser$.asObservable();
  }

  /**
   * Get the current user from Supabase session
   * Used in OAuth callback to get authenticated user details
   */
  async getUser(): Promise<User | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return user;
  }

  // ============================================
  // Email Verification
  // ============================================

  sendEmailVerification(): Observable<void> {
    return from(this.supabase.auth.resend({
      type: 'signup',
      email: this.currentUser$.value?.email || ''
    })).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      catchError(error => {
        console.error('Send email verification error:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Password Reset
  // ============================================

  resetPassword(email: string): Observable<void> {
    return from(this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/reset-password'
    })).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      catchError(error => {
        console.error('Reset password error:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getErrorMessage(error: any): string {
    if (error?.message) {
      // Map common Supabase errors to user-friendly messages
      switch (error.message) {
        case 'Invalid login credentials':
          return 'Email sau parola incorectă. Încearcă din nou.';
        case 'Email not confirmed':
          return 'Email-ul nu a fost confirmat. Verifică căsuța poștală.';
        case 'User already registered':
          return 'Un cont cu acest email există deja. Încearcă să te autentifici.';
        case 'Password should be at least 6 characters':
          return 'Parola trebuie să aibă cel puțin 6 caractere.';
        default:
          return error.message;
      }
    }
    
    return 'A apărut o eroare neprevăzută. Încearcă din nou.';
  }
}