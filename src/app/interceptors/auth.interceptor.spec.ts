import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor, resetTokenRefreshState } from './auth.interceptor';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { environment } from '../../environments/environment';
import { Subject, of } from 'rxjs';

describe('AuthInterceptor Security Tests', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let authService: jasmine.SpyObj<SupabaseAuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('SupabaseAuthService', [
      'getAccessToken',
      'refreshToken',
      'signOut'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: SupabaseAuthService, useValue: authServiceSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(SupabaseAuthService) as jasmine.SpyObj<SupabaseAuthService>;
    
    // Mock environment.apiUrl
    (environment as any).apiUrl = 'https://api.civica.ro';
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('Auth-Optional Endpoint Access', () => {
    it('should allow GET /api/issues without authentication', () => {
      authService.getAccessToken.and.returnValue(null);

      httpClient.get('https://api.civica.ro/api/issues').subscribe();

      const req = httpTestingController.expectOne('https://api.civica.ro/api/issues');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush([]);
    });

    // Regression guard. These endpoints do not REQUIRE auth, but the backend
    // reads the JWT when present to populate hasVoted and to filter out issues
    // by blocked authors. Skipping the header here silently downgrades signed-in
    // users to an anonymous response — a 200, so nothing anywhere reports it.
    it('should ATTACH the token to GET /api/issues when the user is signed in', () => {
      authService.getAccessToken.and.returnValue('test-token');

      httpClient.get('https://api.civica.ro/api/issues').subscribe();

      const req = httpTestingController.expectOne('https://api.civica.ro/api/issues');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush([]);
    });

    it('should ATTACH the token to GET /api/issues/{id} when the user is signed in', () => {
      authService.getAccessToken.and.returnValue('test-token');

      httpClient.get('https://api.civica.ro/api/issues/123').subscribe();

      const req = httpTestingController.expectOne('https://api.civica.ro/api/issues/123');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    // A 401 from an endpoint where auth is optional must not end the session:
    // the response is servable anonymously, so signing the user out over it
    // would be a self-inflicted logout.
    it('should NOT sign the user out when an auth-optional endpoint returns 401', () => {
      authService.getAccessToken.and.returnValue('test-token');

      httpClient.get('https://api.civica.ro/api/issues').subscribe({
        next: () => fail('expected the 401 to surface as an error'),
        error: (error) => expect(error.status).toBe(401)
      });

      httpTestingController
        .expectOne('https://api.civica.ro/api/issues')
        .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authService.refreshToken).not.toHaveBeenCalled();
      expect(authService.signOut).not.toHaveBeenCalled();
    });

    it('should allow GET /api/issues/{id} without authentication', () => {
      authService.getAccessToken.and.returnValue(null);
      
      httpClient.get('https://api.civica.ro/api/issues/123').subscribe();
      
      const req = httpTestingController.expectOne('https://api.civica.ro/api/issues/123');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('should allow GET /api/health without authentication', () => {
      authService.getAccessToken.and.returnValue(null);
      
      httpClient.get('https://api.civica.ro/api/health').subscribe();
      
      const req = httpTestingController.expectOne('https://api.civica.ro/api/health');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({ status: 'ok' });
    });
  });

  describe('Protected Endpoint Security', () => {
    beforeEach(() => {
      authService.getAccessToken.and.returnValue('test-token');
    });

    it('should REQUIRE auth for POST /api/issues (creating issues)', () => {
      httpClient.post('https://api.civica.ro/api/issues', {}).subscribe();
      
      const req = httpTestingController.expectOne('https://api.civica.ro/api/issues');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('should REQUIRE auth for /api/user/issues (not confused with /api/issues)', () => {
      httpClient.get('https://api.civica.ro/api/user/issues').subscribe();
      
      const req = httpTestingController.expectOne('https://api.civica.ro/api/user/issues');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush([]);
    });

    it('should REQUIRE auth for /api/issues/123/email-sent (not confused with /api/issues/{id})', () => {
      httpClient.put('https://api.civica.ro/api/issues/123/email-sent', {}).subscribe();
      
      const req = httpTestingController.expectOne('https://api.civica.ro/api/issues/123/email-sent');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('should REQUIRE auth for /api/admin/issues (not confused with /api/issues)', () => {
      httpClient.get('https://api.civica.ro/api/admin/issues').subscribe();
      
      const req = httpTestingController.expectOne('https://api.civica.ro/api/admin/issues');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush([]);
    });

    it('should REQUIRE auth for /api/issues-summary (not confused with /api/issues)', () => {
      httpClient.get('https://api.civica.ro/api/issues-summary').subscribe();
      
      const req = httpTestingController.expectOne('https://api.civica.ro/api/issues-summary');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('should REQUIRE auth for DELETE /api/issues/123 (wrong method)', () => {
      httpClient.delete('https://api.civica.ro/api/issues/123').subscribe();
      
      const req = httpTestingController.expectOne('https://api.civica.ro/api/issues/123');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('should REQUIRE auth for /api/issues/123/comments (nested resource)', () => {
      httpClient.get('https://api.civica.ro/api/issues/123/comments').subscribe();
      
      const req = httpTestingController.expectOne('https://api.civica.ro/api/issues/123/comments');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with query parameters correctly', () => {
      authService.getAccessToken.and.returnValue(null);
      
      httpClient.get('https://api.civica.ro/api/issues?page=1&limit=10').subscribe();
      
      const req = httpTestingController.expectOne('https://api.civica.ro/api/issues?page=1&limit=10');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush([]);
    });

    it('should handle malformed URLs safely', () => {
      authService.getAccessToken.and.returnValue('test-token');

      // Relative URL that might cause parsing issues
      httpClient.get('/api/user/profile').subscribe();

      const req = httpTestingController.expectOne('/api/user/profile');
      // Should still add auth since it doesn't match public endpoints
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });
  });

  // The refresh queue keeps module-level state (isRefreshingToken and the
  // outcome subject), so each test resets it or it inherits the previous one's.
  describe('Token Refresh Queue', () => {
    const PROFILE = 'https://api.civica.ro/api/user/profile';
    const SETTINGS = 'https://api.civica.ro/api/user/settings';
    let refresh$: Subject<string>;

    beforeEach(() => {
      resetTokenRefreshState();
      refresh$ = new Subject<string>();
      authService.getAccessToken.and.returnValue('stale-token');
      authService.refreshToken.and.returnValue(refresh$);
      authService.signOut.and.returnValue(of(undefined));
    });

    /** Drives a request to a 401, so it either starts or joins the refresh. */
    function fire(url: string): { outcome: () => unknown } {
      let outcome: unknown = 'PENDING';
      httpClient.get(url).subscribe({
        next: () => (outcome = 'SUCCESS'),
        error: (error) => (outcome = error)
      });
      httpTestingController
        .expectOne(url)
        .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      return { outcome: () => outcome };
    }

    it('should retry a queued request once the refresh succeeds', () => {
      fire(PROFILE);   // starts the refresh
      const queued = fire(SETTINGS); // queues behind it

      expect(queued.outcome()).toBe('PENDING');

      refresh$.next('fresh-token');
      refresh$.complete();

      const retries = httpTestingController.match(
        (r) => r.headers.get('Authorization') === 'Bearer fresh-token'
      );
      expect(retries.length).toBe(2);
      retries.forEach((r) => r.flush({}));

      expect(queued.outcome()).toBe('SUCCESS');
    });

    // Regression guard. A failed refresh used to emit the same value that meant
    // "still refreshing", which waiters filtered out — so they never settled and
    // the request hung forever rather than surfacing an error.
    it('should ERROR a queued request when the refresh fails, never hang', () => {
      fire(PROFILE);
      const queued = fire(SETTINGS);

      expect(queued.outcome()).toBe('PENDING');

      refresh$.error(new Error('refresh rejected'));

      expect(queued.outcome()).not.toBe('PENDING');
      expect(queued.outcome()).toEqual(
        jasmine.objectContaining({ status: 401 })
      );
      expect(authService.signOut).toHaveBeenCalled();
    });

    // Same hang, reached the other way: a refresh that resolves without a token.
    it('should ERROR a queued request when the refresh returns no token', () => {
      fire(PROFILE);
      const queued = fire(SETTINGS);

      refresh$.next('');
      refresh$.complete();

      expect(queued.outcome()).not.toBe('PENDING');
      expect(queued.outcome()).toEqual(
        jasmine.objectContaining({ status: 401 })
      );
      // An empty token throws into the same catchError as a rejected refresh,
      // so the session is torn down here too.
      expect(authService.signOut).toHaveBeenCalled();
    });

    it('should release queued requests when the session is reset mid-refresh', () => {
      fire(PROFILE);
      const queued = fire(SETTINGS);

      resetTokenRefreshState();

      expect(queued.outcome()).not.toBe('PENDING');
    });
  });
});
