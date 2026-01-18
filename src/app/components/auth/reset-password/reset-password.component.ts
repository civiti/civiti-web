import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzResultModule } from 'ng-zorro-antd/result';

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
    NzCardModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzIconModule,
    NzAlertModule,
    NzSpinModule,
    NzResultModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async checkSession(): Promise<void> {
    try {
      // Supabase automatically handles the token from the URL hash
      // Wait a moment for Supabase to process the recovery token
      await new Promise(resolve => setTimeout(resolve, 500));

      const session = await this.supabaseAuthService.getSession();
      this.sessionValid = !!session;
    } catch (error) {
      console.error('Error checking session:', error);
      this.sessionValid = false;
    } finally {
      this.checkingSession = false;
    }
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
}
