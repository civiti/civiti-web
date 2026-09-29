import { Component, OnInit, DestroyRef, inject, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NG-ZORRO imports
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { AuthShellComponent } from '../auth-shell/auth-shell.component';

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
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    AuthShellComponent
  ],
  templateUrl: './registration-gateway.component.html',
  styleUrls: ['./registration-gateway.component.scss']
})
export class RegistrationGatewayComponent implements OnInit {
  private _destroyRef = inject(DestroyRef);

  privacyPolicyTemplate = viewChild.required<TemplateRef<void>>('privacyPolicyTemplate');

  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  isAuthenticated$!: Observable<boolean>;
  returnUrl: string | null = null;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private route: ActivatedRoute,
    private modal: NzModalService
  ) {
    this.isLoading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    this.isAuthenticated$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/dashboard']);
        }
      });

    // Load any stored user data on component init
    this.store.dispatch(AuthActions.loadUserFromStorage());
  }

  loginWithGoogle(): void {
    console.log('[REGISTRATION GATEWAY] Initiating Google OAuth...');
    this.store.dispatch(AuthActions.loginWithGoogle());
  }

  clearError(): void {
    this.store.dispatch(AuthActions.clearAuthError());
  }

  showPrivacyPolicy(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Politica de confidențialitate',
      nzContent: this.privacyPolicyTemplate(),
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