import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SupabaseAuthService, SupabaseAuthResponse } from './supabase-auth.service';

import { UserRole } from '../types/civica-api.types';

// Define auth types for compatibility
export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  authProvider: 'email' | 'google';
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private supabaseAuthService: SupabaseAuthService
  ) {}

  // ============================================
  // Authentication Methods
  // ============================================

  loginWithGoogle(): Observable<AuthResponse> {
    return this.supabaseAuthService.signInWithGoogle().pipe(
      map(this.mapSupabaseToAuthResponse),
      catchError(error => {
        // Handle OAuth redirect case
        if (error.type === 'oauth_redirect') {
          throw error;
        }
        throw new Error(error.message || 'Google login failed');
      })
    );
  }

  loginWithEmail(email: string, password: string): Observable<AuthResponse> {
    return this.supabaseAuthService.signInWithEmail(email, password).pipe(
      map(this.mapSupabaseToAuthResponse),
      catchError(error => {
        throw new Error(error.message || 'Email login failed');
      })
    );
  }

  registerWithEmail(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.supabaseAuthService.signUpWithEmail(email, password, displayName).pipe(
      map(this.mapSupabaseToAuthResponse),
      catchError(error => {
        throw new Error(error.message || 'Registration failed');
      })
    );
  }

  refreshToken(): Observable<TokenResponse> {
    return this.supabaseAuthService.refreshToken().pipe(
      map(token => ({
        token,
        refreshToken: '' // Supabase manages refresh tokens internally
      })),
      catchError(error => {
        throw new Error(error.message || 'Token refresh failed');
      })
    );
  }

  getCurrentUser(): Observable<AuthResponse | null> {
    return this.supabaseAuthService.getCurrentUser().pipe(
      map(user => {
        if (!user) return null;
        
        const token = this.supabaseAuthService.getAccessToken();
        if (!token) return null;

        return {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            photoUrl: user.photoUrl ?? null,
            authProvider: user.authProvider,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            role: user.role // Role from Supabase app_metadata
          },
          token,
          refreshToken: ''
        };
      })
    );
  }

  isTokenValid(): Observable<boolean> {
    return this.supabaseAuthService.isAuthenticated();
  }

  logout(): Observable<void> {
    return this.supabaseAuthService.signOut().pipe(
      catchError(error => {
        throw new Error(error.message || 'Logout failed');
      })
    );
  }

  // ============================================
  // Email Verification
  // ============================================

  sendEmailVerification(): Observable<void> {
    return this.supabaseAuthService.sendEmailVerification().pipe(
      catchError(error => {
        throw new Error(error.message || 'Failed to send verification email');
      })
    );
  }

  verifyEmail(token: string): Observable<void> {
    // Email verification is handled automatically by Supabase
    // This method is mainly for compatibility
    return new Observable(observer => {
      observer.next();
      observer.complete();
    });
  }

  // ============================================
  // Password Reset
  // ============================================

  resetPassword(email: string): Observable<void> {
    return this.supabaseAuthService.resetPassword(email).pipe(
      catchError(error => {
        throw new Error(error.message || 'Password reset failed');
      })
    );
  }

  // ============================================
  // Helper Methods
  // ============================================

  private mapSupabaseToAuthResponse(supabaseResponse: SupabaseAuthResponse): AuthResponse {
    return {
      user: {
        id: supabaseResponse.user.id,
        email: supabaseResponse.user.email,
        displayName: supabaseResponse.user.displayName,
        photoUrl: supabaseResponse.user.photoUrl ?? null,
        authProvider: supabaseResponse.user.authProvider,
        emailVerified: supabaseResponse.user.emailVerified,
        createdAt: supabaseResponse.user.createdAt,
        lastLoginAt: supabaseResponse.user.lastLoginAt,
        role: supabaseResponse.user.role // Role from Supabase app_metadata
      },
      token: supabaseResponse.token,
      refreshToken: supabaseResponse.refreshToken
    };
  }

  getAccessToken(): string | null {
    return this.supabaseAuthService.getAccessToken();
  }
}