import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { ApiService } from '../../../services/api.service';
import * as AuthActions from '../../../store/auth/auth.actions';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CommonModule } from '@angular/common';
import { DEFAULT_CITY } from '../../../data/romanian-locations';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, NzSpinModule],
  template: `
    <div class="flex items-center justify-center flex-1 bg-gray-50">
      <div class="text-center">
        <nz-spin nzSize="large" nzTip="Se procesează autentificarea..."></nz-spin>
      </div>
    </div>
  `
})
export class OauthCallbackComponent implements OnInit {
  constructor(
    private router: Router,
    private store: Store,
    private supabaseAuth: SupabaseAuthService,
    private apiService: ApiService
  ) {}

  async ngOnInit() {
    try {
      // Get the current session - Supabase should have processed the OAuth callback by now
      const session = await this.supabaseAuth.getSession();

      if (!session?.access_token || !session?.user) {
        console.error('No session after OAuth callback');
        this.handleAuthFailure();
        return;
      }

      const user = session.user;
      const token = session.access_token;

      // Store token in localStorage BEFORE making API calls
      // This ensures the auth interceptor has access to the token
      localStorage.setItem('civica_access_token', token);
      if (session.refresh_token) {
        localStorage.setItem('civica_refresh_token', session.refresh_token);
      }

      // Fetch existing profile or create new one
      this.apiService.getUserProfile().subscribe({
        next: (profile) => {
          this.dispatchLoginSuccess(user, profile, token);
        },
        error: (error) => {
          // Profile doesn't exist (404) or other error - create one
          if (error.status === 404) {
            this.createProfileAndLogin(user, token);
          } else {
            console.error('Error fetching profile:', error);
            // For other errors, still try to create profile
            this.createProfileAndLogin(user, token);
          }
        }
      });
    } catch (error) {
      console.error('OAuth callback error:', error);
      this.handleAuthFailure();
    }
  }

  private createProfileAndLogin(user: any, token: string): void {
    const displayName = user.user_metadata?.['full_name'] ||
                       user.user_metadata?.['name'] ||
                       user.email?.split('@')[0] || 'User';

    this.apiService.createUserProfile({
      supabaseUserId: user.id,
      email: user.email || '',
      displayName,
      county: DEFAULT_CITY,
      city: DEFAULT_CITY,
      district: '', // User will select sector when creating issues
      residenceType: 'Apartment'
    }).subscribe({
      next: (profile) => {
        this.dispatchLoginSuccess(user, profile, token);
      },
      error: (error) => {
        console.error('Profile creation error:', error);
        // Even if profile creation fails, dispatch login with basic user data
        // Read role from Supabase app_metadata (set via Dashboard)
        this.store.dispatch(AuthActions.loginWithGoogleSuccess({
          user: {
            id: user.id,
            email: user.email || '',
            displayName: displayName,
            photoUrl: user.user_metadata?.['avatar_url'] || null,
            authProvider: 'google',
            emailVerified: true,
            createdAt: new Date(user.created_at),
            lastLoginAt: new Date(),
            role: user.app_metadata?.['role'] || 'user'
          },
          token,
          refreshToken: ''
        }));
      }
    });
  }

  private dispatchLoginSuccess(user: any, profile: any, token: string): void {
    // Role comes from Supabase app_metadata (single source of truth)
    // The JWT is signed and tamper-proof
    const role = user.app_metadata?.['role'] || 'user';

    this.store.dispatch(AuthActions.loginWithGoogleSuccess({
      user: {
        id: user.id,
        email: user.email || profile.email || '',
        displayName: profile.displayName || user.email || '',
        photoUrl: user.user_metadata?.['avatar_url'] || profile.photoUrl || null,
        authProvider: 'google',
        emailVerified: true,
        createdAt: new Date(user.created_at),
        lastLoginAt: new Date(),
        role
      },
      token,
      refreshToken: ''
    }));
  }

  private handleAuthFailure(): void {
    this.store.dispatch(AuthActions.loginWithGoogleFailure({
      error: 'Authentication failed. Please try again.'
    }));
    this.router.navigate(['/auth/login']);
  }
}