import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { ApiService } from '../../../services/api.service';
import * as AuthActions from '../../../store/auth/auth.actions';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, NzSpinModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-50">
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
      // Get the current user from Supabase
      const user = await this.supabaseAuth.getUser();
      
      if (user) {
        // Get access token
        const token = this.supabaseAuth.getAccessToken();
        
        if (token) {
          // Try to get user profile from backend
          this.apiService.getUserProfile().subscribe({
            next: (profile) => {
              // User has a profile, dispatch success
              this.store.dispatch(AuthActions.loginWithGoogleSuccess({
                user: {
                  ...profile, // Spread profile first
                  id: user.id, // Then override with Supabase user data
                  email: user.email || profile.email || '',
                  displayName: profile.displayName || user.email || '',
                  photoURL: user.user_metadata?.['avatar_url'] || profile.photoURL,
                  authProvider: 'google',
                  emailVerified: true,
                  createdAt: new Date(user.created_at),
                  lastLoginAt: new Date()
                },
                token,
                refreshToken: ''
              }));
            },
            error: () => {
              // No profile exists, create one
              const displayName = user.user_metadata?.['full_name'] || 
                                user.user_metadata?.['name'] || 
                                user.email?.split('@')[0] || 'User';
              
              this.apiService.createUserProfile({
                supabaseUserId: user.id,
                email: user.email || '',
                displayName,
                county: 'București',
                city: 'București',
                district: 'Sector 5',
                residenceType: 'urban'
              }).subscribe({
                next: (profile) => {
                  this.store.dispatch(AuthActions.loginWithGoogleSuccess({
                    user: {
                      ...profile, // Spread profile first
                      id: user.id, // Then override with Supabase user data
                      email: user.email || profile.email,
                      displayName: profile.displayName,
                      photoURL: user.user_metadata?.['avatar_url'] || profile.photoURL,
                      authProvider: 'google',
                      emailVerified: true,
                      createdAt: new Date(user.created_at),
                      lastLoginAt: new Date()
                    },
                    token,
                    refreshToken: ''
                  }));
                },
                error: (error) => {
                  console.error('Profile creation error:', error);
                  // Even if profile creation fails, we have valid auth
                  this.store.dispatch(AuthActions.loginWithGoogleSuccess({
                    user: {
                      id: user.id,
                      email: user.email || '',
                      displayName: displayName,
                      photoURL: user.user_metadata?.['avatar_url'],
                      authProvider: 'google',
                      emailVerified: true,
                      createdAt: new Date(user.created_at),
                      lastLoginAt: new Date()
                    },
                    token,
                    refreshToken: ''
                  }));
                }
              });
            }
          });
        }
      } else {
        // No user found, redirect to login
        this.router.navigate(['/auth/login']);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      this.store.dispatch(AuthActions.loginWithGoogleFailure({ 
        error: 'Authentication failed. Please try again.' 
      }));
      this.router.navigate(['/auth/login']);
    }
  }
}