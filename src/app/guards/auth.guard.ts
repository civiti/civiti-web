import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, take } from 'rxjs/operators';
import { selectAuthGuardState } from '../store/auth/auth.selectors';

/**
 * Guard that requires user to be authenticated.
 * Waits for auth initialization before evaluating.
 * Uses compound selector to ensure atomic state reads.
 * Redirects to login page if not authenticated.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  // Use compound selector to get all state values atomically
  return store.select(selectAuthGuardState).pipe(
    filter(guardState => guardState.isInitialized),
    take(1),
    map(guardState => {
      if (guardState.isAuthenticated) {
        return true;
      }
      // Redirect to login with return URL
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    })
  );
};
