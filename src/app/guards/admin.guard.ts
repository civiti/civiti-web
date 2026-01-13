import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, take } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { selectAdminGuardState } from '../store/auth/auth.selectors';

/**
 * Guard that requires user to have admin role.
 * Waits for auth initialization before evaluating.
 * Uses compound selector to ensure atomic state reads.
 * Redirects to login if not authenticated, or shows error and redirects to dashboard if not admin.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  const message = inject(NzMessageService);

  // Use compound selector to get all state values atomically
  return store.select(selectAdminGuardState).pipe(
    filter(guardState => guardState.isInitialized),
    take(1),
    map(guardState => {
      if (guardState.canAccessAdminPanel) {
        return true;
      }

      if (guardState.isAuthenticated) {
        // User is logged in but not an admin
        message.error('Nu ai permisiunea de a accesa această pagină');
        router.navigate(['/dashboard']);
      } else {
        // User is not logged in
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
      }

      return false;
    })
  );
};
