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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzStepsModule } from 'ng-zorro-antd/steps';

import { AppState } from '../../../store/app.state';
import * as AuthActions from '../../../store/auth/auth.actions';
import { 
  selectAuthLoading, 
  selectAuthError, 
  selectIsAuthenticated 
} from '../../../store/auth/auth.selectors';

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  location: {
    county: string;
    city: string;
    district: string;
  };
  residenceType?: 'apartment' | 'house' | 'business';
  communicationPrefs: {
    issueUpdates: boolean;
    communityNews: boolean;
    monthlyDigest: boolean;
    achievements: boolean;
  };
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

@Component({
  selector: 'app-user-registration',
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
    NzSelectModule,
    NzIconModule,
    NzAlertModule,
    NzSpinModule,
    NzDividerModule,
    NzTypographyModule,
    NzStepsModule
  ],
  template: `
    <div class="registration-container">
      
      <!-- Header -->
      <div class="registration-header">
        <button nz-button nzType="text" nzSize="large" routerLink="/auth/register" class="back-btn">
          <span nz-icon nzType="arrow-left"></span>
          Back
        </button>
        <h1 class="page-title">Create Your Account</h1>
        <p class="page-subtitle">Join your community and start making a difference</p>
      </div>

      <!-- Registration Form -->
      <div class="registration-form-container">
        <nz-card [nzBordered]="false" class="registration-form-card">
          
          <!-- Progress Steps -->
          <nz-steps [nzCurrent]="currentStep" nzSize="small" class="registration-steps">
            <nz-step nzTitle="Account" nzDescription="Basic info"></nz-step>
            <nz-step nzTitle="Location" nzDescription="Where you live"></nz-step>
            <nz-step nzTitle="Preferences" nzDescription="Communication"></nz-step>
          </nz-steps>

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

            <form nz-form [formGroup]="registrationForm" (ngSubmit)="onSubmit()">
              
              <!-- Step 1: Account Information -->
              <div *ngIf="currentStep === 0" class="form-step">
                <h3 class="step-title">Account Information</h3>
                
                <nz-form-item>
                  <nz-form-label [nzSpan]="24" nzFor="displayName" nzRequired>Full Name</nz-form-label>
                  <nz-form-control [nzSpan]="24" nzErrorTip="Please enter your full name">
                    <input
                      nz-input
                      formControlName="displayName"
                      id="displayName"
                      placeholder="Enter your full name"
                      autocomplete="name">
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label [nzSpan]="24" nzFor="email" nzRequired>Email Address</nz-form-label>
                  <nz-form-control [nzSpan]="24" nzErrorTip="Please enter a valid email address">
                    <input
                      nz-input
                      formControlName="email"
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      autocomplete="email">
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label [nzSpan]="24" nzFor="password" nzRequired>Password</nz-form-label>
                  <nz-form-control [nzSpan]="24" nzErrorTip="Password must be at least 6 characters">
                    <nz-input-group [nzSuffix]="passwordSuffix">
                      <input
                        nz-input
                        formControlName="password"
                        id="password"
                        [type]="passwordVisible ? 'text' : 'password'"
                        placeholder="Create a password"
                        autocomplete="new-password">
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

                <nz-form-item>
                  <nz-form-label [nzSpan]="24" nzFor="confirmPassword" nzRequired>Confirm Password</nz-form-label>
                  <nz-form-control [nzSpan]="24" [nzErrorTip]="confirmPasswordErrorTip">
                    <input
                      nz-input
                      formControlName="confirmPassword"
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      autocomplete="new-password">
                    <ng-template #confirmPasswordErrorTip>
                      <span *ngIf="registrationForm.get('confirmPassword')?.hasError('required')">
                        Please confirm your password
                      </span>
                      <span *ngIf="registrationForm.get('confirmPassword')?.hasError('passwordMismatch')">
                        Passwords do not match
                      </span>
                    </ng-template>
                  </nz-form-control>
                </nz-form-item>
              </div>

              <!-- Step 2: Location Information -->
              <div *ngIf="currentStep === 1" class="form-step">
                <h3 class="step-title">Location Information</h3>
                <p class="step-description">Help us connect you with issues in your area</p>
                
                <nz-form-item>
                  <nz-form-label [nzSpan]="24" nzFor="county" nzRequired>County</nz-form-label>
                  <nz-form-control [nzSpan]="24">
                    <nz-select formControlName="county" id="county" nzPlaceHolder="Select your county">
                      <nz-option nzValue="bucuresti" nzLabel="București"></nz-option>
                      <nz-option nzValue="ilfov" nzLabel="Ilfov"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label [nzSpan]="24" nzFor="city" nzRequired>City</nz-form-label>
                  <nz-form-control [nzSpan]="24">
                    <nz-select formControlName="city" id="city" nzPlaceHolder="Select your city">
                      <nz-option nzValue="bucuresti" nzLabel="București"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label [nzSpan]="24" nzFor="district" nzRequired>District/Sector</nz-form-label>
                  <nz-form-control [nzSpan]="24">
                    <nz-select formControlName="district" id="district" nzPlaceHolder="Select your district">
                      <nz-option nzValue="sector1" nzLabel="Sector 1"></nz-option>
                      <nz-option nzValue="sector2" nzLabel="Sector 2"></nz-option>
                      <nz-option nzValue="sector3" nzLabel="Sector 3"></nz-option>
                      <nz-option nzValue="sector4" nzLabel="Sector 4"></nz-option>
                      <nz-option nzValue="sector5" nzLabel="Sector 5"></nz-option>
                      <nz-option nzValue="sector6" nzLabel="Sector 6"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label [nzSpan]="24" nzFor="residenceType">Residence Type (Optional)</nz-form-label>
                  <nz-form-control [nzSpan]="24">
                    <nz-select formControlName="residenceType" id="residenceType" nzPlaceHolder="Select residence type" nzAllowClear>
                      <nz-option nzValue="apartment" nzLabel="Apartment"></nz-option>
                      <nz-option nzValue="house" nzLabel="House"></nz-option>
                      <nz-option nzValue="business" nzLabel="Business"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>

              <!-- Step 3: Communication Preferences -->
              <div *ngIf="currentStep === 2" class="form-step">
                <h3 class="step-title">Communication Preferences</h3>
                <p class="step-description">Choose how you'd like to stay informed</p>
                
                <div class="preferences-group">
                  <label nz-checkbox formControlName="issueUpdates" class="preference-item">
                    <div class="preference-content">
                      <div class="preference-title">Issue Updates</div>
                      <div class="preference-description">Get notified when your reported issues are updated</div>
                    </div>
                  </label>

                  <label nz-checkbox formControlName="communityNews" class="preference-item">
                    <div class="preference-content">
                      <div class="preference-title">Community News</div>
                      <div class="preference-description">Stay informed about community developments and improvements</div>
                    </div>
                  </label>

                  <label nz-checkbox formControlName="monthlyDigest" class="preference-item">
                    <div class="preference-content">
                      <div class="preference-title">Monthly Digest</div>
                      <div class="preference-description">Receive a monthly summary of community activity</div>
                    </div>
                  </label>

                  <label nz-checkbox formControlName="achievements" class="preference-item">
                    <div class="preference-content">
                      <div class="preference-title">Achievement Notifications</div>
                      <div class="preference-description">Get notified when you earn badges and reach milestones</div>
                    </div>
                  </label>
                </div>

                <!-- Terms and Privacy -->
                <div class="terms-section">
                  <nz-form-item>
                    <nz-form-control [nzSpan]="24">
                      <label nz-checkbox formControlName="agreeToTerms" class="terms-checkbox">
                        I agree to the <a href="/terms" target="_blank">Terms of Service</a>
                      </label>
                    </nz-form-control>
                  </nz-form-item>

                  <nz-form-item>
                    <nz-form-control [nzSpan]="24">
                      <label nz-checkbox formControlName="agreeToPrivacy" class="terms-checkbox">
                        I agree to the <a href="/privacy" target="_blank">Privacy Policy</a>
                      </label>
                    </nz-form-control>
                  </nz-form-item>
                </div>
              </div>

              <!-- Navigation Buttons -->
              <div class="form-navigation">
                <button
                  *ngIf="currentStep > 0"
                  nz-button
                  nzType="default"
                  nzSize="large"
                  type="button"
                  (click)="previousStep()"
                  class="nav-btn">
                  <span nz-icon nzType="arrow-left"></span>
                  Previous
                </button>
                
                <div class="nav-spacer"></div>
                
                <button
                  *ngIf="currentStep < 2"
                  nz-button
                  nzType="primary"
                  nzSize="large"
                  type="button"
                  (click)="nextStep()"
                  [disabled]="!isCurrentStepValid()"
                  class="nav-btn">
                  Next
                  <span nz-icon nzType="arrow-right"></span>
                </button>

                <button
                  *ngIf="currentStep === 2"
                  nz-button
                  nzType="primary"
                  nzSize="large"
                  type="submit"
                  [disabled]="!registrationForm.valid"
                  class="nav-btn submit-btn">
                  <span nz-icon nzType="user-add"></span>
                  Create Account
                </button>
              </div>

            </form>

            <!-- Login Link -->
            <div class="login-link">
              <nz-divider nzText="or" nzOrientation="center"></nz-divider>
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
    .registration-container {
      min-height: 100vh;
      background: #f5f5f5;
      padding: 2rem 1rem;
    }

    .registration-header {
      text-align: center;
      margin-bottom: 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .back-btn {
      position: absolute;
      left: 1rem;
      top: 1rem;
      color: #14213D;
      font-weight: 600;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #14213D;
      margin-bottom: 0.5rem;
    }

    .page-subtitle {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 0;
    }

    .registration-form-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .registration-form-card {
      box-shadow: 0 8px 24px rgba(20, 33, 61, 0.1);
      border-radius: 16px;
    }

    .registration-steps {
      margin-bottom: 2rem;
    }

    .error-alert {
      margin-bottom: 1.5rem;
    }

    .form-step {
      margin-bottom: 2rem;
    }

    .step-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #14213D;
      margin-bottom: 0.5rem;
    }

    .step-description {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .password-toggle {
      cursor: pointer;
      color: #666;
      transition: color 0.3s ease;
    }

    .password-toggle:hover {
      color: #14213D;
    }

    .preferences-group {
      margin-bottom: 2rem;
    }

    .preference-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 0;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
    }

    .preference-item:last-child {
      border-bottom: none;
    }

    .preference-content {
      flex: 1;
    }

    .preference-title {
      font-weight: 600;
      color: #14213D;
      margin-bottom: 0.25rem;
    }

    .preference-description {
      font-size: 0.9rem;
      color: #666;
      line-height: 1.4;
    }

    .terms-section {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
    }

    .terms-checkbox {
      font-size: 0.9rem;
      color: #666;
    }

    .terms-checkbox a {
      color: #FCA311;
      text-decoration: none;
      font-weight: 600;
    }

    .terms-checkbox a:hover {
      text-decoration: underline;
    }

    .form-navigation {
      display: flex;
      align-items: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #f0f0f0;
    }

    .nav-spacer {
      flex: 1;
    }

    .nav-btn {
      font-weight: 600;
      height: 40px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .submit-btn {
      background: #FCA311 !important;
      border-color: #FCA311 !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .submit-btn:hover {
      background: #e8930f !important;
      border-color: #e8930f !important;
    }

    .login-link {
      text-align: center;
      margin-top: 2rem;
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
    }

    .login-link-text:hover {
      color: #e8930f;
      text-decoration: underline;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .registration-container {
        padding: 1rem;
      }

      .page-title {
        font-size: 2rem;
      }

      .back-btn {
        position: relative;
        left: auto;
        top: auto;
        margin-bottom: 1rem;
      }

      .registration-header {
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

    /* Custom select and checkbox styles */
    .ant-select-focused .ant-select-selector {
      border-color: #FCA311 !important;
      box-shadow: 0 0 0 2px rgba(252, 163, 17, 0.2) !important;
    }

    .ant-checkbox-checked .ant-checkbox-inner {
      background-color: #FCA311;
      border-color: #FCA311;
    }

    .ant-checkbox-wrapper:hover .ant-checkbox-inner {
      border-color: #FCA311;
    }
  `]
})
export class UserRegistrationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  registrationForm!: FormGroup;
  currentStep = 0;
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
    this.registrationForm = this.fb.group({
      // Step 1: Account
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      
      // Step 2: Location
      county: ['bucuresti', [Validators.required]],
      city: ['bucuresti', [Validators.required]],
      district: ['sector5', [Validators.required]],
      residenceType: [null],
      
      // Step 3: Preferences
      issueUpdates: [true],
      communityNews: [true],
      monthlyDigest: [false],
      achievements: [true],
      agreeToTerms: [false, [Validators.requiredTrue]],
      agreeToPrivacy: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 0:
        return !!(this.registrationForm.get('displayName')?.valid &&
                  this.registrationForm.get('email')?.valid &&
                  this.registrationForm.get('password')?.valid &&
                  this.registrationForm.get('confirmPassword')?.valid &&
                  !this.registrationForm.hasError('passwordMismatch'));
               
      case 1:
        return !!(this.registrationForm.get('county')?.valid &&
                  this.registrationForm.get('city')?.valid &&
                  this.registrationForm.get('district')?.valid);
               
      case 2:
        return !!(this.registrationForm.get('agreeToTerms')?.valid &&
                  this.registrationForm.get('agreeToPrivacy')?.valid);
               
      default:
        return false;
    }
  }

  nextStep(): void {
    if (this.isCurrentStepValid() && this.currentStep < 2) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      const formValue = this.registrationForm.value;
      
      console.log('[USER REGISTRATION] Submitting registration:', {
        email: formValue.email,
        displayName: formValue.displayName
      });

      this.store.dispatch(AuthActions.registerWithEmail({
        email: formValue.email,
        password: formValue.password,
        displayName: formValue.displayName
      }));
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registrationForm.controls).forEach(key => {
        this.registrationForm.get(key)?.markAsTouched();
      });
    }
  }

  clearError(): void {
    this.store.dispatch(AuthActions.clearAuthError());
  }
}