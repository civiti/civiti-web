import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

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
    NzSpinModule,
    NzModalModule
  ],
  templateUrl: './registration-gateway.component.html',
  styleUrls: ['./registration-gateway.component.scss']
})
export class RegistrationGatewayComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @ViewChild('privacyPolicyTemplate') privacyPolicyTemplate!: TemplateRef<void>;

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
}