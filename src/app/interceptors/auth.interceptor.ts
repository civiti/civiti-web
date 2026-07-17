/**
 * Auth Interceptor for Civica Application
 *
 * Handles:
 * - JWT token attachment to API requests
 * - Token refresh with request queuing (prevents race conditions)
 * - Auth-required vs auth-optional endpoint differentiation
 *
 * Security Notes:
 * - The bearer token is attached to EVERY API request when one is available.
 *   The backend — never this interceptor — decides what a caller may see.
 * - "Auth optional" means auth is NOT REQUIRED; it does NOT mean the token is
 *   withheld. Those endpoints read the JWT to personalise their response and
 *   fall back to the anonymous view when it is absent.
 * - Uses EXACT path matching so an auth-REQUIRED endpoint can never be mistaken
 *   for an auth-optional one and silently skip the token refresh it depends on.
 * - Only auth-required endpoints may trigger the refresh -> signOut cascade: a
 *   401 from an endpoint that never required auth must not destroy the session.
 */

import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { throwError, Observable, BehaviorSubject } from 'rxjs';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { environment } from '../../environments/environment';

/**
 * Outcome of the in-flight token refresh, broadcast to requests queued behind it.
 *
 * Modelled explicitly rather than as `string | null`, because `null` had to mean
 * both "still refreshing" and "refresh failed". Waiters filtered `null` out to
 * skip the former and so discarded the latter, leaving every queued request
 * hanging forever on a failed refresh.
 */
type RefreshOutcome =
  | { status: 'pending' }
  | { status: 'success'; token: string }
  | { status: 'failed' };

/** Settled outcomes — the states a queued request can actually act on. */
type SettledOutcome = Exclude<RefreshOutcome, { status: 'pending' }>;

// Token refresh state management
let isRefreshingToken = false;
const refreshOutcome$ = new BehaviorSubject<RefreshOutcome>({ status: 'pending' });

/** Session-expired error handed to callers whose refresh could not be completed. */
function sessionExpiredError(): HttpErrorResponse {
  return new HttpErrorResponse({
    error: 'Session expired. Please log in again.',
    status: 401,
    statusText: 'Unauthorized'
  });
}

/**
 * Define endpoints where authentication is OPTIONAL
 *
 * These serve anonymous callers, and personalise the response when a JWT happens
 * to be present (e.g. HasVoted, hiding authors the viewer has blocked).
 *
 * This list does NOT gate token attachment — the token is always sent when the
 * user has one (see authInterceptor below). It marks the endpoints exempt from
 * the 401 -> refresh -> signOut cascade, because a 401 from an endpoint that
 * never required auth is not evidence that the user's session is dead.
 *
 * SECURITY CRITICAL:
 * - Uses EXACT path matching so an auth-required endpoint is never mis-classified
 *   as auth-optional and denied the token refresh it depends on
 * - Each endpoint must specify allowed HTTP methods
 * - Regex patterns must be carefully crafted to avoid matching nested resources
 *
 * Examples of what this prevents:
 * - /api/user/issues won't match /api/issues
 * - /api/issues/123/vote won't match /api/issues/{id}
 * - POST /api/issues isn't treated as auth-optional (only GET is)
 *
 * Verified against the backend (Civiti.Api/Endpoints/IssueEndpoints.cs): none of
 * these carry [Authorize], and the API declares no FallbackPolicy, so a stale or
 * expired token degrades to an anonymous 200 here rather than a 401.
 */
const AUTH_OPTIONAL_ENDPOINTS = [
  { path: '/api/health', methods: ['GET'] },
  { path: '/api/issues', methods: ['GET'] }, // List all issues (JWT adds HasVoted + block filtering)
  { path: /^\/api\/issues\/[^\/]+$/, methods: ['GET'] }, // View single issue (same personalisation)
  { path: /^\/api\/issues\/[^\/]+\/email-sent$/, methods: ['POST'] }, // Email tracking (IP rate limited, no auth)
  { path: /^\/api\/issues\/[^\/]+\/poster$/, methods: ['GET'] }, // Printable PDF poster (no auth)
  // Note: POST /api/issues requires auth (creating issues)
  // Note: POST /api/issues/{id}/vote requires auth (voting)
];

/**
 * Check if authentication is optional for this request
 * Uses exact path matching so auth-required endpoints are never mis-classified
 */
function isAuthOptionalEndpoint(req: HttpRequest<any>): boolean {
  // Parse the URL to get the pathname
  let pathname: string;
  try {
    const url = new URL(req.url);
    pathname = url.pathname;
  } catch {
    // If URL parsing fails, treat as relative URL
    pathname = req.url.replace(environment.apiUrl, '');
  }

  // Remove any query parameters for comparison
  const cleanPath = pathname.split('?')[0];

  // Check against auth-optional endpoints
  return AUTH_OPTIONAL_ENDPOINTS.some(endpoint => {
    // Check if method matches
    if (!endpoint.methods.includes(req.method)) {
      return false;
    }

    // Check path - handle both string and regex patterns
    if (endpoint.path instanceof RegExp) {
      return endpoint.path.test(cleanPath);
    } else {
      // Exact string match
      return cleanPath === endpoint.path;
    }
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // During SSR there is no authenticated user and no browser storage, so
  // never attempt to read a token or handle 401 refreshes on the server.
  // Server-rendered routes only hit auth-optional endpoints, which simply
  // return the anonymous view of the data.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return next(req);
  }

  const authService = inject(SupabaseAuthService);

  // Only add auth header for API requests
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // Auth-optional endpoints still get the token — they use it to personalise the
  // response. Withholding it silently downgraded signed-in users to the
  // anonymous view (hasVoted came back null, block filters never applied).
  // The classification only decides whether a 401 may nuke the session.
  const authOptional = isAuthOptionalEndpoint(req);

  // Get the access token (null for anonymous visitors, who keep working as-is)
  const token = authService.getAccessToken();

  // Clone request and add auth header if token exists
  let authReq = req;
  if (token) {
    authReq = addTokenToRequest(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors — but only for endpoints that genuinely
      // require auth. An auth-optional endpoint answering 401 is never a reason
      // to refresh-then-sign-out: it serves anonymous callers, so the worst case
      // is an un-personalised response, not a dead session.
      if (error.status === 401 && token && !authOptional) {
        return handle401Error(req, next, authService);
      }

      // Handle other errors
      return throwError(() => error);
    })
  );
};

function addTokenToRequest(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
}

function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: SupabaseAuthService
): Observable<HttpEvent<any>> {

  if (!isRefreshingToken) {
    // First request to encounter 401 - start token refresh.
    // Both statements are synchronous, so any request that later observes
    // isRefreshingToken === true is guaranteed to see 'pending' rather than the
    // settled outcome of an earlier refresh.
    isRefreshingToken = true;
    refreshOutcome$.next({ status: 'pending' });

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshingToken = false;

        // Extract the new token from the response
        const newToken = typeof response === 'string'
          ? response
          : response?.token || response?.access_token;

        if (!newToken) {
          // Thrown, not returned: catchError below owns releasing the waiters
          // and signing out, so a refresh that "succeeds" with no token takes
          // exactly the same path as one that errors.
          throw new Error('No token received from refresh');
        }

        // Notify all waiting requests that refresh is complete
        refreshOutcome$.next({ status: 'success', token: newToken });

        // Retry the original request with the new token
        return next(addTokenToRequest(req, newToken));
      }),
      catchError((refreshError) => {
        isRefreshingToken = false;

        // Release the queued requests. This must be a distinct signal from
        // 'pending': emitting the old placeholder left them waiting on a
        // refresh that had already failed and would never emit again.
        refreshOutcome$.next({ status: 'failed' });

        // If token refresh fails, log out the user
        console.error('Token refresh failed:', refreshError);

        // Trigger logout through the auth service
        authService.signOut().subscribe({
          next: () => console.log('User signed out due to token refresh failure'),
          error: (err) => console.error('Error during signout:', err)
        });

        return throwError(() => sessionExpiredError());
      })
    );
  } else {
    // Token refresh is already in progress
    // Wait for the refresh to settle, then retry the request or fail with it
    return refreshOutcome$.pipe(
      filter((outcome): outcome is SettledOutcome => outcome.status !== 'pending'),
      take(1),
      switchMap(outcome => {
        if (outcome.status === 'failed') {
          return throwError(() => sessionExpiredError());
        }

        // Retry the request with the new token
        return next(addTokenToRequest(req, outcome.token));
      })
    );
  }
}

/**
 * Reset the token refresh state
 * This should be called when the user logs out
 *
 * Settles as 'failed' rather than 'pending': the session is gone, so anything
 * queued behind the refresh can no longer succeed and must be released with an
 * error. Emitting 'pending' here would leave those requests hanging — the very
 * bug this state machine exists to prevent. The next 401 starts a fresh cycle
 * by emitting 'pending' again, so the terminal state is not sticky.
 */
export function resetTokenRefreshState(): void {
  isRefreshingToken = false;
  refreshOutcome$.next({ status: 'failed' });
}
