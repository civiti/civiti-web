/**
 * Auth Interceptor for Civica Application
 * 
 * Handles:
 * - JWT token attachment to API requests
 * - Token refresh with request queuing (prevents race conditions)
 * - Public vs protected endpoint differentiation
 * 
 * Security Notes:
 * - Uses EXACT path matching to prevent unauthorized access
 * - Only specific endpoints and methods are public
 * - All other requests require valid JWT authentication
 */

import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { throwError, Observable, BehaviorSubject } from 'rxjs';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { environment } from '../../environments/environment';

// Token refresh state management
let isRefreshingToken = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Define public endpoints that don't require authentication
 * 
 * SECURITY CRITICAL: 
 * - Uses EXACT path matching to prevent unauthorized access
 * - Each endpoint must specify allowed HTTP methods
 * - Regex patterns must be carefully crafted to avoid security holes
 * 
 * Examples of what this prevents:
 * - /api/user/issues won't match /api/issues
 * - /api/issues/123/email-sent won't match /api/issues/{id}
 * - POST /api/issues won't be treated as public (only GET is)
 */
const PUBLIC_ENDPOINTS = [
  { path: '/api/health', methods: ['GET'] },
  { path: '/api/issues', methods: ['GET'] }, // List all issues (public viewing)
  { path: /^\/api\/issues\/[^\/]+$/, methods: ['GET'] }, // View single issue (public viewing)
  // Note: POST /api/issues requires auth (creating issues)
  // Note: PUT /api/issues/{id}/email-sent requires auth (tracking emails)
];

/**
 * Check if the request is to a public endpoint that doesn't require authentication
 * Uses exact path matching to prevent security vulnerabilities
 */
function isPublicEndpoint(req: HttpRequest<any>): boolean {
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
  
  // Check against public endpoints
  return PUBLIC_ENDPOINTS.some(endpoint => {
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
  const authService = inject(SupabaseAuthService);
  
  // Only add auth header for API requests
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // Check if this is a public endpoint that doesn't require authentication
  if (isPublicEndpoint(req)) {
    return next(req);
  }

  // Get the access token
  const token = authService.getAccessToken();
  
  // Clone request and add auth header if token exists
  let authReq = req;
  if (token) {
    authReq = addTokenToRequest(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && token) {
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
    // First request to encounter 401 - start token refresh
    isRefreshingToken = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshingToken = false;
        
        // Extract the new token from the response
        const newToken = typeof response === 'string' 
          ? response 
          : response?.token || response?.access_token;
        
        if (!newToken) {
          throw new Error('No token received from refresh');
        }
        
        // Notify all waiting requests that refresh is complete
        refreshTokenSubject.next(newToken);
        
        // Retry the original request with the new token
        return next(addTokenToRequest(req, newToken));
      }),
      catchError((refreshError) => {
        isRefreshingToken = false;
        refreshTokenSubject.next(null);
        
        // If token refresh fails, log out the user
        console.error('Token refresh failed:', refreshError);
        
        // Trigger logout through the auth service
        authService.signOut().subscribe({
          next: () => console.log('User signed out due to token refresh failure'),
          error: (err) => console.error('Error during signout:', err)
        });
        
        return throwError(() => new HttpErrorResponse({
          error: 'Session expired. Please log in again.',
          status: 401,
          statusText: 'Unauthorized'
        }));
      })
    );
  } else {
    // Token refresh is already in progress
    // Wait for the refresh to complete, then retry the request
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        if (!token) {
          // Refresh failed, return error
          return throwError(() => new HttpErrorResponse({
            error: 'Session expired. Please log in again.',
            status: 401,
            statusText: 'Unauthorized'
          }));
        }
        
        // Retry the request with the new token
        return next(addTokenToRequest(req, token));
      })
    );
  }
}

/**
 * Reset the token refresh state
 * This should be called when the user logs out
 */
export function resetTokenRefreshState(): void {
  isRefreshingToken = false;
  refreshTokenSubject.next(null);
}