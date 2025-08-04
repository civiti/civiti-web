import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { AppState } from '../../../store/app.state';
import * as AuthActions from '../../../store/auth/auth.actions';
import { 
  selectAuthLoading, 
  selectAuthError, 
  selectIsAuthenticated 
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-registration-gateway',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzDividerModule,
    NzSpaceModule,
    NzTypographyModule,
    NzGridModule,
    NzAlertModule,
    NzSpinModule
  ],
  template: `
    <div class="registration-gateway-container">
      <div class="hero-section">
        <div class="hero-content">
          <img src="/assets/logo/civica-logo.svg" alt="Civica" class="logo" />
          <h1 class="hero-title">Join Your Community</h1>
          <p class="hero-subtitle">Report issues, track progress, make impact</p>
        </div>
      </div>

      <div class="registration-card-container">
        <nz-card [nzBordered]="false" class="registration-card">
          <nz-spin [nzSpinning]="(isLoading$ | async) || false">
            <!-- Error Alert -->
            <nz-alert
              *ngIf="error$ | async as error"
              [nzMessage]="error"
              nzType="error"
              nzShowIcon
              nzCloseable
              (nzOnClose)="clearError()"
              class="error-alert">
            </nz-alert>

            <!-- Registration Options -->
            <div class="registration-options">
              <nz-space nzDirection="vertical" nzSize="large" style="width: 100%;">
                
                <!-- Google OAuth Button -->
                <button 
                  nz-button 
                  nzType="primary" 
                  nzSize="large" 
                  nzBlock
                  class="google-oauth-btn"
                  (click)="loginWithGoogle()">
                  <span nz-icon nzType="google" nzTheme="outline"></span>
                  Continue with Google
                </button>

                <nz-divider nzText="or" nzOrientation="center"></nz-divider>

                <!-- Email Registration Button -->
                <button 
                  nz-button 
                  nzType="default" 
                  nzSize="large" 
                  nzBlock
                  class="email-signup-btn"
                  routerLink="/auth/signup">
                  <span nz-icon nzType="mail" nzTheme="outline"></span>
                  Sign up with Email
                </button>

              </nz-space>
            </div>

            <!-- Privacy Promise -->
            <div class="privacy-promise">
              <h4>Privacy Promise:</h4>
              <ul class="privacy-list">
                <li>
                  <span nz-icon nzType="check-circle" nzTheme="outline" class="check-icon"></span>
                  No spam, ever
                </li>
                <li>
                  <span nz-icon nzType="check-circle" nzTheme="outline" class="check-icon"></span>
                  Data stays in Romania
                </li>
                <li>
                  <span nz-icon nzType="check-circle" nzTheme="outline" class="check-icon"></span>
                  Full control over your information
                </li>
              </ul>
            </div>

            <!-- Login Link -->
            <div class="login-link">
              <p>Already have an account? 
                <a routerLink="/auth/login" class="login-link-text">Sign in</a>
              </p>
            </div>

          </nz-spin>
        </nz-card>
      </div>
    </div>
  `,
  styles: [`
    .registration-gateway-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #14213D 0%, #1a2b4f 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }

    .hero-section {
      text-align: center;
      margin-bottom: 3rem;
      color: white;
    }

    .hero-content {
      max-width: 400px;
    }

    .logo {
      height: 80px;
      margin-bottom: 2rem;
      filter: brightness(0) invert(1); /* Make logo white */
    }

    .hero-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: white;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      opacity: 0.9;
      margin-bottom: 0;
    }

    .registration-card-container {
      width: 100%;
      max-width: 400px;
    }

    .registration-card {
      box-shadow: 0 16px 48px rgba(20, 33, 61, 0.2);
      border-radius: 16px;
      background: white;
    }

    .error-alert {
      margin-bottom: 1.5rem;
    }

    .registration-options {
      margin-bottom: 2rem;
    }

    .google-oauth-btn {
      background: #FCA311 !important;
      border-color: #FCA311 !important;
      color: white !important;
      font-weight: 600;
      font-size: 1rem;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
    }

    .google-oauth-btn:hover {
      background: linear-gradient(135deg, #FCA311 0%, #e8930f 100%) !important;
      border-color: #e8930f !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(252, 163, 17, 0.3);
    }

    .email-signup-btn {
      border-color: #E5E5E5;
      color: #14213D;
      font-weight: 600;
      font-size: 1rem;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .email-signup-btn:hover {
      border-color: #14213D;
      color: #14213D;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(20, 33, 61, 0.1);
    }

    .privacy-promise {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .privacy-promise h4 {
      color: #14213D;
      font-weight: 600;
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .privacy-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .privacy-list li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      color: #14213D;
      font-size: 0.95rem;
    }

    .privacy-list li:last-child {
      margin-bottom: 0;
    }

    .check-icon {
      color: #28A745;
      font-size: 1.1rem;
    }

    .login-link {
      text-align: center;
      padding-top: 1rem;
      border-top: 1px solid #E5E5E5;
    }

    .login-link p {
      margin: 0;
      color: #666;
      font-size: 0.95rem;
    }

    .login-link-text {
      color: #FCA311;
      font-weight: 600;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .login-link-text:hover {
      color: #e8930f;
      text-decoration: underline;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .registration-gateway-container {
        padding: 1rem;
      }

      .hero-title {
        font-size: 2rem;
      }

      .hero-subtitle {
        font-size: 1.1rem;
      }

      .logo {
        height: 60px;
        margin-bottom: 1.5rem;
      }
    }

    /* Dark theme support */
    [data-theme='dark'] .registration-card {
      background: #262626;
      color: rgba(255, 255, 255, 0.85);
    }

    [data-theme='dark'] .privacy-promise {
      background: #1f1f1f;
      color: rgba(255, 255, 255, 0.85);
    }

    [data-theme='dark'] .privacy-promise h4 {
      color: rgba(255, 255, 255, 0.85);
    }

    [data-theme='dark'] .login-link {
      border-top-color: #434343;
    }

    [data-theme='dark'] .login-link p {
      color: rgba(255, 255, 255, 0.65);
    }
  `]
})
export class RegistrationGatewayComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    this.isLoading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    this.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/dashboard']);
        }
      });

    // Load any stored user data on component init
    this.store.dispatch(AuthActions.loadUserFromStorage());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loginWithGoogle(): void {
    console.log('[REGISTRATION GATEWAY] Initiating Google OAuth...');
    this.store.dispatch(AuthActions.loginWithGoogle());
  }

  clearError(): void {
    this.store.dispatch(AuthActions.clearAuthError());
  }
}