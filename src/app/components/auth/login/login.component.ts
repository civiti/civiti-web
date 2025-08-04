import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

import { AppState } from '../../../store/app.state';
import * as AuthActions from '../../../store/auth/auth.actions';
import { 
  selectAuthLoading, 
  selectAuthError, 
  selectIsAuthenticated 
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzCheckboxModule,
    NzIconModule,
    NzAlertModule,
    NzSpinModule,
    NzDividerModule,
    NzTypographyModule
  ],
  template: `
    <div class="login-container">
      
      <!-- Header -->
      <div class="login-header">
        <button nz-button nzType="text" nzSize="large" routerLink="/auth/register" class="back-btn">
          <span nz-icon nzType="arrow-left"></span>
          Back
        </button>
        <img src="/assets/logo/civica-logo.svg" alt="Civica" class="logo" />
        <h1 class="page-title">Welcome Back</h1>
        <p class="page-subtitle">Sign in to continue making a difference in your community</p>
      </div>

      <!-- Login Form -->
      <div class="login-form-container">
        <nz-card [nzBordered]="false" class="login-form-card">
          
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

            <!-- Google OAuth Option -->
            <div class="oauth-section">
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
              
              <nz-divider nzText="or sign in with email" nzOrientation="center"></nz-divider>
            </div>

            <!-- Login Form -->
            <form nz-form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
              
              <nz-form-item>
                <nz-form-label [nzSpan]="24" nzFor="email" nzRequired>Email Address</nz-form-label>
                <nz-form-control [nzSpan]="24" nzErrorTip="Please enter a valid email address">
                  <input
                    nz-input
                    formControlName="email"
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    autocomplete="email"
                    class="login-input">
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label [nzSpan]="24" nzFor="password" nzRequired>Password</nz-form-label>
                <nz-form-control [nzSpan]="24" nzErrorTip="Please enter your password">
                  <nz-input-group [nzSuffix]="passwordSuffix">
                    <input
                      nz-input
                      formControlName="password"
                      id="password"
                      [type]="passwordVisible ? 'text' : 'password'"
                      placeholder="Enter your password"
                      autocomplete="current-password"
                      class="login-input">
                  </nz-input-group>
                  <ng-template #passwordSuffix>
                    <span 
                      nz-icon 
                      [nzType]="passwordVisible ? 'eye-invisible' : 'eye'" 
                      (click)="passwordVisible = !passwordVisible"
                      class="password-toggle">
                    </span>
                  </ng-template>
                </nz-form-control>
              </nz-form-item>

              <!-- Remember Me and Forgot Password -->
              <div class="form-options">
                <label nz-checkbox formControlName="rememberMe">
                  Remember me
                </label>
                <a href="#" class="forgot-password-link" (click)="$event.preventDefault(); showForgotPassword()">
                  Forgot password?
                </a>
              </div>

              <!-- Submit Button -->
              <nz-form-item class="submit-section">
                <nz-form-control [nzSpan]="24">
                  <button
                    nz-button
                    nzType="primary"
                    nzSize="large"
                    nzBlock
                    type="submit"
                    [disabled]="!loginForm.valid"
                    class="login-submit-btn">
                    <span nz-icon nzType="login"></span>
                    Sign In
                  </button>
                </nz-form-control>
              </nz-form-item>

            </form>

            <!-- Demo Account Info -->
            <div class="demo-info">
              <nz-alert
                nzMessage="Demo Account Available"
                [nzDescription]="demoDescription"
                nzType="info"
                nzShowIcon
                class="demo-alert">
              </nz-alert>
              
              <ng-template #demoDescription>
                <p>Use these credentials to explore the platform:</p>
                <ul>
                  <li><strong>Email:</strong> test&#64;civica.ro</li>
                  <li><strong>Password:</strong> password123</li>
                </ul>
                <button nz-button nzType="link" nzSize="small" (click)="fillDemoCredentials()">
                  Fill Demo Credentials
                </button>
              </ng-template>
            </div>

            <!-- Registration Link -->
            <div class="registration-link">
              <nz-divider nzText="or" nzOrientation="center"></nz-divider>
              <p>Don't have an account yet? 
                <a routerLink="/auth/register" class="registration-link-text">Create account</a>
              </p>
            </div>

          </nz-spin>
        </nz-card>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #14213D 0%, #1a2b4f 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;
      position: relative;
      max-width: 400px;
    }

    .back-btn {
      position: absolute;
      left: -1rem;
      top: 0;
      color: white;
      font-weight: 600;
    }

    .logo {
      height: 60px;
      margin-bottom: 1.5rem;
      filter: brightness(0) invert(1);
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.5rem;
    }

    .page-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 0;
      line-height: 1.4;
    }

    .login-form-container {
      width: 100%;
      max-width: 400px;
    }

    .login-form-card {
      box-shadow: 0 16px 48px rgba(20, 33, 61, 0.2);
      border-radius: 16px;
      background: white;
    }

    .error-alert {
      margin-bottom: 1.5rem;
    }

    .oauth-section {
      margin-bottom: 1.5rem;
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

    .login-form {
      margin-bottom: 1.5rem;
    }

    .login-input {
      height: 44px;
      font-size: 1rem;
    }

    .password-toggle {
      cursor: pointer;
      color: #666;
      transition: color 0.3s ease;
    }

    .password-toggle:hover {
      color: #14213D;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .forgot-password-link {
      color: #FCA311;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .forgot-password-link:hover {
      color: #e8930f;
      text-decoration: underline;
    }

    .submit-section {
      margin-bottom: 0;
    }

    .login-submit-btn {
      background: #FCA311 !important;
      border-color: #FCA311 !important;
      color: white !important;
      font-weight: 600;
      font-size: 1rem;
      height: 48px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
    }

    .login-submit-btn:hover {
      background: #e8930f !important;
      border-color: #e8930f !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(252, 163, 17, 0.3);
    }

    .login-submit-btn:disabled {
      background: #ccc !important;
      border-color: #ccc !important;
      transform: none;
      box-shadow: none;
    }

    .demo-info {
      margin: 1.5rem 0;
    }

    .demo-alert {
      border-radius: 8px;
    }

    .demo-alert ul {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }

    .demo-alert li {
      margin-bottom: 0.25rem;
    }

    .registration-link {
      text-align: center;
      margin-top: 1.5rem;
    }

    .registration-link p {
      margin: 0;
      color: #666;
      font-size: 0.95rem;
    }

    .registration-link-text {
      color: #FCA311;
      font-weight: 600;
      text-decoration: none;
    }

    .registration-link-text:hover {
      color: #e8930f;
      text-decoration: underline;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .login-container {
        padding: 1rem;
      }

      .page-title {
        font-size: 2rem;
      }

      .page-subtitle {
        font-size: 1rem;
      }

      .back-btn {
        position: relative;
        left: auto;
        margin-bottom: 1rem;
      }

      .login-header {
        text-align: left;
      }
    }

    /* Form validation styles */
    .ant-form-item-has-error .ant-input {
      border-color: #DC3545;
    }

    .ant-form-item-has-error .ant-input:focus {
      border-color: #DC3545;
      box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
    }

    /* Custom checkbox styles */
    .ant-checkbox-checked .ant-checkbox-inner {
      background-color: #FCA311;
      border-color: #FCA311;
    }

    .ant-checkbox-wrapper:hover .ant-checkbox-inner {
      border-color: #FCA311;
    }

    /* Input focus styles */
    .ant-input:focus {
      border-color: #FCA311;
      box-shadow: 0 0 0 2px rgba(252, 163, 17, 0.2);
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loginForm!: FormGroup;
  passwordVisible = false;

  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private router: Router
  ) {
    this.isLoading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
    
    this.initializeForm();
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      
      console.log('[LOGIN] Attempting email login for:', email);
      
      this.store.dispatch(AuthActions.loginWithEmail({ email, password }));
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  loginWithGoogle(): void {
    console.log('[LOGIN] Initiating Google OAuth...');
    this.store.dispatch(AuthActions.loginWithGoogle());
  }

  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      email: 'test@civica.ro',
      password: 'password123'
    });
  }

  showForgotPassword(): void {
    // TODO: Implement forgot password functionality
    console.log('[LOGIN] Forgot password clicked');
    // For now, just show an alert or navigate to forgot password page
    alert('Forgot password functionality will be implemented in the next phase.');
  }

  clearError(): void {
    this.store.dispatch(AuthActions.clearAuthError());
  }
}