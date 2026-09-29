import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NG-ZORRO imports
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { AuthShellComponent } from '../auth-shell/auth-shell.component';

import { AppState } from '../../../store/app.state';
import * as AuthActions from '../../../store/auth/auth.actions';
import {
  selectAuthError,
  selectPasswordResetLoading
} from '../../../store/auth/auth.selectors';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzIconModule,
    NzSpinModule,
    AuthShellComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  private _destroyRef = inject(DestroyRef);

  resetPasswordForm!: FormGroup;
  passwordVisible = false;
  confirmPasswordVisible = false;

  // View states
  checkingSession = true;
  sessionValid = false;

  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private supabaseAuthService: SupabaseAuthService
  ) {
    this.isLoading$ = this.store.select(selectPasswordResetLoading);
    this.error$ = this.store.select(selectAuthError);

    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if user has a valid session (from the reset link)
    this.checkSession();
  }

  private checkSession(): void {
    // Wait for Supabase to process the recovery token from the URL hash
    // Using the observable ensures we wait for auth initialization to complete
    this.supabaseAuthService.getSessionOnceReady()
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (session) => {
          this.sessionValid = !!session;
          this.checkingSession = false;
        },
        error: (error) => {
          console.error('Error checking session:', error);
          this.sessionValid = false;
          this.checkingSession = false;
        }
      });
  }

  private initializeForm(): void {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    // Only validate when both fields have values
    if (password?.value && confirmPassword?.value) {
      return password.value !== confirmPassword.value ? { passwordMismatch: true } : null;
    }

    return null;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      const { password } = this.resetPasswordForm.value;
      this.store.dispatch(AuthActions.resetPassword({ password }));
    } else {
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        this.resetPasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  clearError(): void {
    this.store.dispatch(AuthActions.clearAuthError());
  }

  get confirmPasswordValidateStatus(): AbstractControl | 'error' {
    const control = this.resetPasswordForm.get('confirmPassword');
    // Show error state when form has passwordMismatch error and field is touched
    if (control?.touched && this.resetPasswordForm.hasError('passwordMismatch')) {
      return 'error';
    }
    // Otherwise let ng-zorro use the control's own validation status
    return control!;
  }
}
