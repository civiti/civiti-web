import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

// NG-ZORRO imports
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { AppState } from '../../../store/app.state';
import * as AuthActions from '../../../store/auth/auth.actions';
import { selectIsAuthenticated, selectAuthUser, selectUserDisplayName, selectCanAccessAdminPanel } from '../../../store/auth/auth.selectors';
import { AuthUser } from '../../../store/auth/auth.state';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    NzPageHeaderModule,
    NzButtonModule,
    NzIconModule,
    NzSpaceModule,
    NzAvatarModule,
    NzDropDownModule,
    NzMenuModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  private _router = inject(Router);
  private _store = inject(Store<AppState>);

  // Page-specific configuration
  title = input('Civiti');
  showBackButton = input(false);
  backUrl = input<string | null>(null);
  subtitle = input<string | null>(null);


  // Auth state observables
  isAuthenticated$: Observable<boolean>;
  user$: Observable<AuthUser | null>;
  displayName$: Observable<string>;
  canAccessAdmin$: Observable<boolean>;

  constructor() {
    this.isAuthenticated$ = this._store.select(selectIsAuthenticated);
    this.user$ = this._store.select(selectAuthUser);
    this.displayName$ = this._store.select(selectUserDisplayName);
    this.canAccessAdmin$ = this._store.select(selectCanAccessAdminPanel);
  }

  onBack(): void {
    if (this.backUrl()) {
      this._router.navigate([this.backUrl()!]);
    } else {
      window.history.back();
    }
  }

  navigateToLogin(): void {
    this._router.navigate(['/auth/login'], { queryParams: { returnUrl: this._router.url } });
  }

  navigateToRegister(): void {
    this._router.navigate(['/auth/register'], { queryParams: { returnUrl: this._router.url } });
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
