import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

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
  selectPasswordResetEmailSent,
  selectPasswordResetPendingEmail,
  selectPasswordResetLoading
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;

  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  emailSent$!: Observable<boolean>;
  pendingEmail$!: Observable<string | null>;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>
  ) {
    this.isLoading$ = this.store.select(selectPasswordResetLoading);
    this.error$ = this.store.select(selectAuthError);
    this.emailSent$ = this.store.select(selectPasswordResetEmailSent);
    this.pendingEmail$ = this.store.select(selectPasswordResetPendingEmail);

    this.initializeForm();
  }

  ngOnInit(): void {
    // Clear any previous password reset state when entering the page
    this.store.dispatch(AuthActions.clearPasswordResetState());
  }

  private initializeForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      const { email } = this.forgotPasswordForm.value;
      this.store.dispatch(AuthActions.forgotPassword({ email }));
    } else {
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  clearError(): void {
    this.store.dispatch(AuthActions.clearAuthError());
  }

  resetForm(): void {
    this.store.dispatch(AuthActions.clearPasswordResetState());
    this.forgotPasswordForm.reset();
  }
}
