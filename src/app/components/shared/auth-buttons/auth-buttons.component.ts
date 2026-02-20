import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { AppState } from '../../../store/app.state';
import * as AuthActions from '../../../store/auth/auth.actions';
import {
  selectIsAuthenticated,
  selectAuthUser,
  selectUserDisplayName,
  selectCanAccessAdminPanel,
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-auth-buttons',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzAvatarModule,
    NzDropDownModule,
    NzMenuModule,
  ],
  templateUrl: './auth-buttons.component.html',
  styleUrls: ['./auth-buttons.component.scss'],
})
export class AuthButtonsComponent {
  private _router = inject(Router);
  private _store = inject(Store<AppState>);

  showAdminLink = input(false);
  showIssuesLink = input(false);

  isAuthenticated$ = this._store.select(selectIsAuthenticated);
  user$ = this._store.select(selectAuthUser);
  displayName$ = this._store.select(selectUserDisplayName);
  canAccessAdmin$ = this._store.select(selectCanAccessAdminPanel);

  navigateToLogin(): void {
    this._router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this._router.url },
    });
  }

  navigateToRegister(): void {
    this._router.navigate(['/auth/register'], {
      queryParams: { returnUrl: this._router.url },
    });
  }

  navigateToDashboard(): void {
    this._router.navigate(['/dashboard']);
  }

  navigateToIssues(): void {
    this._router.navigate(['/issues']);
  }

  navigateToAdmin(): void {
    this._router.navigate(['/admin']);
  }

  logout(): void {
    this._store.dispatch(AuthActions.logout());
  }
}
