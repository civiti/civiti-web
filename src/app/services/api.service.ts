import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  HealthResponse,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  UserProfileResponse,
  CreateIssueRequest,
  CreateIssueResponse,
  IssueListItem,
  IssueDetailResponse,
  TrackEmailRequest,
  TrackEmailResponse,
  UserFullProfileResponse,
  Badge,
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
  PagedResult,
  IssueQueryParams,
  LeaderboardQueryParams,
  PaginationParams
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
  // Authentication Endpoints
  // ============================================

  createUserProfile(data: CreateUserProfileRequest): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(`${this.baseUrl}/auth/create-profile`, data);
  }

  getUserProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.baseUrl}/auth/profile`);
  }

  updateUserProfile(data: UpdateUserProfileRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.baseUrl}/auth/profile`, data);
  }

  deleteUserProfile(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/auth/profile`);
  }

  // ============================================
  // Issues Endpoints
  // ============================================

  getIssues(params?: IssueQueryParams): Observable<PagedResult<IssueListItem>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof IssueQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PagedResult<IssueListItem>>(`${this.baseUrl}/issues`, { params: httpParams });
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
  // User Endpoints
  // ============================================

  getUserFullProfile(): Observable<UserFullProfileResponse> {
    return this.http.get<UserFullProfileResponse>(`${this.baseUrl}/user/profile`);
  }

  getUserIssues(params?: IssueQueryParams): Observable<PagedResult<IssueListItem>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof IssueQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PagedResult<IssueListItem>>(`${this.baseUrl}/user/issues`, { params: httpParams });
  }

  // ============================================
  // Gamification Endpoints
  // ============================================

  getBadges(): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${this.baseUrl}/gamification/badges`);
  }

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

    return this.http.get<LeaderboardResponse>(`${this.baseUrl}/gamification/leaderboard`, { params: httpParams });
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