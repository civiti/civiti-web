import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take, withLatestFrom } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  selectCanAccessAdminPanel,
  selectIsAuthenticated,
  selectAuthUser,
  selectUserRole
} from '../store/auth/auth.selectors';

/**
 * Guard that requires user to have admin role.
 * Redirects to login if not authenticated, or shows error and redirects to dashboard if not admin.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  const message = inject(NzMessageService);

  return store.select(selectCanAccessAdminPanel).pipe(
    take(1),
    withLatestFrom(
      store.select(selectIsAuthenticated).pipe(take(1)),
      store.select(selectAuthUser).pipe(take(1)),
      store.select(selectUserRole).pipe(take(1))
    ),
    map(([canAccess, isAuthenticated, user, role]) => {
      // Debug logging - remove after verification
      console.log('[AdminGuard] Auth check:', {
        canAccess,
        isAuthenticated,
        role,
        user: user ? { id: user.id, email: user.email, role: user.role } : null
      });

      if (canAccess) {
        return true;
      }

      if (isAuthenticated) {
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
