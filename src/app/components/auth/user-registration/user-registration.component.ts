import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { AppState } from '../../../store/app.state';
import * as AuthActions from '../../../store/auth/auth.actions';
import {
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  selectEmailConfirmationPending,
  selectPendingEmail
} from '../../../store/auth/auth.selectors';
import { 
  ROMANIAN_COUNTIES, 
  BUCHAREST_DISTRICTS, 
  RESIDENCE_TYPES,
  getCitiesForCounty,
  hasDistricts,
  County
} from '../../../data/romanian-locations';

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  location: {
    county: string;
    city: string;
    district?: string;
  };
  residenceType: 'Apartment' | 'House' | 'Business';
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
    NzStepsModule,
    NzModalModule
  ],
  templateUrl: './user-registration.component.html',
  styleUrls: ['./user-registration.component.scss']
})
export class UserRegistrationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @ViewChild('privacyPolicyTemplate') privacyPolicyTemplate!: TemplateRef<void>;
  @ViewChild('termsTemplate') termsTemplate!: TemplateRef<void>;

  registrationForm!: FormGroup;
  currentStep = 0;
  passwordVisible = false;

  // Location data
  counties = ROMANIAN_COUNTIES;
  cities: string[] = [];
  districts = BUCHAREST_DISTRICTS;
  residenceTypes = RESIDENCE_TYPES;
  showDistricts = false;
  

  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  isAuthenticated$!: Observable<boolean>;
  emailConfirmationPending$!: Observable<boolean>;
  pendingEmail$!: Observable<string | null>;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private router: Router,
    private route: ActivatedRoute,
    private modal: NzModalService
  ) {
    this.isLoading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
    this.emailConfirmationPending$ = this.store.select(selectEmailConfirmationPending);
    this.pendingEmail$ = this.store.select(selectPendingEmail);

    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    this.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.navigateAfterRegistration();
        }
      });

    // Watch for county changes to update cities
    this.registrationForm.get('county')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(countyCode => {
        this.onCountyChange(countyCode);
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
      county: ['', [Validators.required]],
      city: ['', [Validators.required]],
      district: [''],
      residenceType: ['Apartment', [Validators.required]],

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

  onCountyChange(countyCode: string): void {
    if (countyCode) {
      // Update cities based on selected county
      this.cities = getCitiesForCounty(countyCode);
      
      // Show districts only for București
      this.showDistricts = hasDistricts(countyCode);
      
      // Reset city and district selections
      this.registrationForm.patchValue({
        city: '',
        district: ''
      });
      
      // Update district validators
      const districtControl = this.registrationForm.get('district');
      if (this.showDistricts) {
        districtControl?.setValidators([Validators.required]);
      } else {
        districtControl?.clearValidators();
      }
      districtControl?.updateValueAndValidity();
    }
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
          this.registrationForm.get('residenceType')?.valid &&
          (!this.showDistricts || this.registrationForm.get('district')?.valid));

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
      const selectedCounty = this.counties.find(c => c.code === formValue.county);

      console.log('[USER REGISTRATION] Submitting registration:', {
        email: formValue.email,
        displayName: formValue.displayName,
        location: {
          county: selectedCounty?.name || formValue.county,
          city: formValue.city,
          district: formValue.district,
          residenceType: formValue.residenceType
        }
      });

      this.store.dispatch(AuthActions.registerWithEmail({
        email: formValue.email,
        password: formValue.password,
        displayName: formValue.displayName,
        county: selectedCounty?.name || formValue.county,
        city: formValue.city,
        district: formValue.district || undefined,
        residenceType: formValue.residenceType
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

  navigateToLogin(): void {
    this.store.dispatch(AuthActions.clearEmailConfirmationPending());
    this.router.navigate(['/auth/login']);
  }

  retryRegistration(): void {
    this.store.dispatch(AuthActions.clearEmailConfirmationPending());
  }

  private navigateAfterRegistration(): void {
    // Check for return URL in query params
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      // Default to dashboard for direct registration
      this.router.navigate(['/dashboard']);
    }
  }

  showPrivacyPolicy(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Politica de Confidențialitate',
      nzContent: this.privacyPolicyTemplate,
      nzWidth: 700,
      nzCentered: true,
      nzFooter: [
        {
          label: 'Am înțeles',
          type: 'primary',
          onClick: () => modalRef.close()
        }
      ],
      nzBodyStyle: {
        'max-height': '60vh',
        'overflow-y': 'auto'
      }
    });
  }

  showTermsAndConditions(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Termeni și Condiții',
      nzContent: this.termsTemplate,
      nzWidth: 700,
      nzCentered: true,
      nzFooter: [
        {
          label: 'Am înțeles',
          type: 'primary',
          onClick: () => modalRef.close()
        }
      ],
      nzBodyStyle: {
        'max-height': '60vh',
        'overflow-y': 'auto'
      }
    });
  }
}