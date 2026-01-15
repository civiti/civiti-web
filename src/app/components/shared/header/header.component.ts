import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() title = 'Civiti';
  @Input() showBackButton = false;
  @Input() backUrl: string | null = null;

  // Event emitter for custom back navigation
  @Output() back = new EventEmitter<void>();

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
    if (this.back.observed) {
      // If parent component is listening, emit the event
      this.back.emit();
    } else if (this.backUrl) {
      // Navigate to specified URL
      this._router.navigate([this.backUrl]);
    } else {
      // Default: go back in history
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
