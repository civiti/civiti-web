import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NG-ZORRO imports
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { AuthShellComponent } from '../auth-shell/auth-shell.component';

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
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzCheckboxModule,
    NzIconModule,
    NzSpinModule,
    AuthShellComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private _destroyRef = inject(DestroyRef);

  loginForm!: FormGroup;
  passwordVisible = false;

  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  isAuthenticated$!: Observable<boolean>;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.isLoading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
    
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    this.isAuthenticated$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.navigateAfterLogin();
        }
      });
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

  clearError(): void {
    this.store.dispatch(AuthActions.clearAuthError());
  }

  private navigateAfterLogin(): void {
    // Check for return URL in query params
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      // Default to dashboard for direct login
      this.router.navigate(['/dashboard']);
    }
  }
}