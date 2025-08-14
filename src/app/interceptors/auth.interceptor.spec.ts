import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { environment } from '../../environments/environment';

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

  describe('Public Endpoint Access', () => {
    it('should allow GET /api/issues without authentication', () => {
      authService.getAccessToken.and.returnValue(null);
      
      httpClient.get('https://api.civica.ro/api/issues').subscribe();
      
      const req = httpTestingController.expectOne('https://api.civica.ro/api/issues');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush([]);
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
});