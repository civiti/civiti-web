import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { NzIconModule } from 'ng-zorro-antd/icon';

import { AuthButtonsComponent } from '../auth-buttons/auth-buttons.component';
import * as AuthActions from '../../../store/auth/auth.actions';
import {
  selectCanAccessAdminPanel,
  selectIsAuthenticated,
} from '../../../store/auth/auth.selectors';

/**
 * The global app bar.
 *
 * One bar for every page (the landing page included): brand, the three
 * top-level destinations, the "Raportează" call to action and the account
 * control. Below 960px the destinations and account links fold into a
 * disclosure panel. When a route sets `showBackButton`, a slim context row
 * under the bar carries the back affordance and the route's title.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NzIconModule, AuthButtonsComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly _router = inject(Router);
  private readonly _store = inject(Store);

  title = input('Civiti');
  showBackButton = input(false);
  backUrl = input<string | null>(null);
  subtitle = input<string | null>(null);

  readonly menuOpen = signal(false);
  readonly isAuthenticated = toSignal(this._store.select(selectIsAuthenticated), { initialValue: false });
  readonly canAccessAdmin = toSignal(this._store.select(selectCanAccessAdminPanel), { initialValue: false });

  constructor() {
    // Any navigation (including one started from inside the panel) closes it.
    this._router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.menuOpen.set(false));
  }

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onBack(): void {
    const url = this.backUrl();
    if (url) {
      this._router.navigate([url]);
    } else {
      window.history.back();
    }
  }

  login(): void {
    this._router.navigate(['/auth/login'], { queryParams: { returnUrl: this._router.url } });
  }

  register(): void {
    this._router.navigate(['/auth/register'], { queryParams: { returnUrl: this._router.url } });
  }

  logout(): void {
    this.closeMenu();
    this._store.dispatch(AuthActions.logout());
  }
}
