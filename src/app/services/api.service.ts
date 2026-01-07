import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  HealthResponse,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  UserProfileResponse,
  UserGamificationResponse,
  CreateIssueRequest,
  CreateIssueResponse,
  IssueItem,
  IssueDetailResponse,
  TrackEmailRequest,
  TrackEmailResponse,
  LeaderboardResponse,
  AdminIssueListItem,
  AdminIssueDetailResponse,
  ApproveIssueRequest,
  RejectIssueRequest,
  RequestChangesRequest,
  BulkApproveRequest,
  BulkApproveResponse,
  IssueActionResponse,
  AdminStatisticsResponse,
  AuthorityListResponse,
  AuthorityQueryParams,
  AuthorityResponse,
  PagedResult,
  IssueQueryParams,
  LeaderboardQueryParams,
  PaginationParams,
  EditUserIssueRequest
} from '../types/civica-api.types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ============================================
  // Health Check
  // ============================================
  
  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`);
  }

  // ============================================
  // User Profile Endpoints (unified /api/user/profile)
  // ============================================

  /**
   * Get user profile with gamification data
   * GET /api/user/profile
   */
  getUserProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.baseUrl}/user/profile`);
  }

  /**
   * Create user profile after OAuth/registration
   * POST /api/user/profile
   */
  createUserProfile(data: CreateUserProfileRequest): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(`${this.baseUrl}/user/profile`, data);
  }

  /**
   * Update user profile
   * PUT /api/user/profile
   */
  updateUserProfile(data: UpdateUserProfileRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.baseUrl}/user/profile`, data);
  }

  /**
   * Soft delete user account
   * DELETE /api/user/account
   */
  deleteUserAccount(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user/account`);
  }

  /**
   * Get gamification data only
   * GET /api/user/gamification
   */
  getGamification(): Observable<UserGamificationResponse> {
    return this.http.get<UserGamificationResponse>(`${this.baseUrl}/user/gamification`);
  }

  // ============================================
  // Issues Endpoints
  // ============================================

  getIssues(params?: IssueQueryParams): Observable<PagedResult<IssueItem>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof IssueQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PagedResult<IssueItem>>(`${this.baseUrl}/issues`, { params: httpParams });
  }

  getIssueById(id: string): Observable<IssueDetailResponse> {
    return this.http.get<IssueDetailResponse>(`${this.baseUrl}/issues/${id}`);
  }

  createIssue(data: CreateIssueRequest): Observable<CreateIssueResponse> {
    return this.http.post<CreateIssueResponse>(`${this.baseUrl}/issues`, data);
  }

  trackEmailSent(issueId: string, data: TrackEmailRequest): Observable<TrackEmailResponse> {
    return this.http.post<TrackEmailResponse>(`${this.baseUrl}/issues/${issueId}/email-sent`, data);
  }

  // ============================================
  // Authority Endpoints
  // ============================================

  /**
   * Get authorities with optional location filtering
   * @param params Optional query parameters for filtering by city, district, or search
   */
  getAuthorities(params?: AuthorityQueryParams): Observable<AuthorityListResponse[]> {
    let httpParams = new HttpParams();

    if (params?.city) {
      httpParams = httpParams.set('city', params.city);
    }
    if (params?.district) {
      httpParams = httpParams.set('district', params.district);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<AuthorityListResponse[]>(`${this.baseUrl}/authorities`, { params: httpParams });
  }

  /**
   * Get authority details by ID
   */
  getAuthorityById(id: string): Observable<AuthorityResponse> {
    return this.http.get<AuthorityResponse>(`${this.baseUrl}/authorities/${id}`);
  }

  // ============================================
  // User Issues Endpoint
  // ============================================

  /**
   * Get user's own issues
   * GET /api/user/issues
   */
  getUserIssues(params?: IssueQueryParams): Observable<PagedResult<IssueItem>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof IssueQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PagedResult<IssueItem>>(`${this.baseUrl}/user/issues`, { params: httpParams });
  }

  /**
   * Update issue status (cancel or resolve)
   * PUT /api/user/issues/:id/status
   * @param status - 'cancelled' | 'resolved' (camelCase)
   */
  updateIssueStatus(issueId: string, status: 'cancelled' | 'resolved'): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/user/issues/${issueId}/status`, { status });
  }

  /**
   * Edit user's own issue (for rejected issues or drafts)
   * PUT /api/user/issues/:id
   */
  editUserIssue(issueId: string, data: EditUserIssueRequest): Observable<IssueDetailResponse> {
    return this.http.put<IssueDetailResponse>(`${this.baseUrl}/user/issues/${issueId}`, data);
  }

  // ============================================
  // Leaderboard Endpoint
  // ============================================

  /**
   * Get public leaderboard
   * GET /api/user/leaderboard
   */
  getLeaderboard(params?: LeaderboardQueryParams): Observable<LeaderboardResponse> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof LeaderboardQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<LeaderboardResponse>(`${this.baseUrl}/user/leaderboard`, { params: httpParams });
  }

  // ============================================
  // Admin Endpoints
  // ============================================

  getPendingIssues(params?: PaginationParams): Observable<PagedResult<AdminIssueListItem>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof PaginationParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PagedResult<AdminIssueListItem>>(`${this.baseUrl}/admin/pending-issues`, { params: httpParams });
  }

  getAdminIssueDetail(id: string): Observable<AdminIssueDetailResponse> {
    return this.http.get<AdminIssueDetailResponse>(`${this.baseUrl}/admin/issues/${id}`);
  }

  approveIssue(id: string, data: ApproveIssueRequest): Observable<IssueActionResponse> {
    return this.http.put<IssueActionResponse>(`${this.baseUrl}/admin/issues/${id}/approve`, data);
  }

  rejectIssue(id: string, data: RejectIssueRequest): Observable<IssueActionResponse> {
    return this.http.put<IssueActionResponse>(`${this.baseUrl}/admin/issues/${id}/reject`, data);
  }

  requestChanges(id: string, data: RequestChangesRequest): Observable<IssueActionResponse> {
    return this.http.put<IssueActionResponse>(`${this.baseUrl}/admin/issues/${id}/request-changes`, data);
  }

  bulkApproveIssues(data: BulkApproveRequest): Observable<BulkApproveResponse> {
    return this.http.post<BulkApproveResponse>(`${this.baseUrl}/admin/issues/bulk-approve`, data);
  }

  getAdminStatistics(): Observable<AdminStatisticsResponse> {
    return this.http.get<AdminStatisticsResponse>(`${this.baseUrl}/admin/statistics`);
  }
}