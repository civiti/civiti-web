import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Import real API service and types
import { ApiService } from './api.service';
import { 
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
  PaginationParams,
  HealthResponse
} from '../types/civica-api.types';

// Mock services no longer needed as we're using real API

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  constructor(
    private apiService: ApiService
  ) {}

  // ============================================
  // Health Check
  // ============================================

  checkHealth(): Observable<HealthResponse> {
    return this.apiService.getHealth().pipe(
      catchError(error => {
        console.error('Health check failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // User Profile Management
  // ============================================

  createUserProfile(data: CreateUserProfileRequest): Observable<UserProfileResponse> {
    return this.apiService.createUserProfile(data).pipe(
      catchError(error => {
        console.error('Create profile failed:', error);
        return throwError(() => error);
      })
    );
  }

  getUserProfile(): Observable<UserProfileResponse> {
    return this.apiService.getUserProfile().pipe(
      catchError(error => {
        console.error('Get profile failed:', error);
        return throwError(() => error);
      })
    );
  }

  updateUserProfile(data: UpdateUserProfileRequest): Observable<UserProfileResponse> {
    return this.apiService.updateUserProfile(data).pipe(
      catchError(error => {
        console.error('Update profile failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Issues Management
  // ============================================

  getIssues(params?: IssueQueryParams): Observable<PagedResult<IssueListItem>> {
    return this.apiService.getIssues(params).pipe(
      catchError(error => {
        console.error('Get issues failed:', error);
        return throwError(() => error);
      })
    );
  }

  getIssueById(id: string): Observable<IssueDetailResponse> {
    return this.apiService.getIssueById(id).pipe(
      catchError(error => {
        console.error('Get issue detail failed:', error);
        return throwError(() => error);
      })
    );
  }

  createIssue(data: CreateIssueRequest): Observable<CreateIssueResponse> {
    return this.apiService.createIssue(data).pipe(
      catchError(error => {
        console.error('Create issue failed:', error);
        return throwError(() => error);
      })
    );
  }

  trackEmailSent(issueId: string, data: TrackEmailRequest): Observable<TrackEmailResponse> {
    return this.apiService.trackEmailSent(issueId, data).pipe(
      catchError(error => {
        console.error('Track email failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // User Dashboard
  // ============================================

  getUserFullProfile(): Observable<UserFullProfileResponse> {
    return this.apiService.getUserFullProfile().pipe(
      catchError(error => {
        console.error('Get user full profile failed:', error);
        return throwError(() => error);
      })
    );
  }

  getUserIssues(params?: IssueQueryParams): Observable<PagedResult<IssueListItem>> {
    return this.apiService.getUserIssues(params).pipe(
      catchError(error => {
        console.error('Get user issues failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Gamification
  // ============================================

  getBadges(): Observable<Badge[]> {
    return this.apiService.getBadges().pipe(
      catchError(error => {
        console.error('Get badges failed:', error);
        return throwError(() => error);
      })
    );
  }

  getLeaderboard(params?: LeaderboardQueryParams): Observable<LeaderboardResponse> {
    return this.apiService.getLeaderboard(params).pipe(
      catchError(error => {
        console.error('Get leaderboard failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Admin Functions
  // ============================================

  getPendingIssues(params?: PaginationParams): Observable<PagedResult<AdminIssueListItem>> {
    return this.apiService.getPendingIssues(params).pipe(
      catchError(error => {
        console.error('Get pending issues failed:', error);
        return throwError(() => error);
      })
    );
  }

  approveIssue(id: string, data: ApproveIssueRequest): Observable<IssueActionResponse> {
    return this.apiService.approveIssue(id, data).pipe(
      catchError(error => {
        console.error('Approve issue failed:', error);
        return throwError(() => error);
      })
    );
  }

  rejectIssue(id: string, data: RejectIssueRequest): Observable<IssueActionResponse> {
    return this.apiService.rejectIssue(id, data).pipe(
      catchError(error => {
        console.error('Reject issue failed:', error);
        return throwError(() => error);
      })
    );
  }

  getAdminStatistics(): Observable<AdminStatisticsResponse> {
    return this.apiService.getAdminStatistics().pipe(
      catchError(error => {
        console.error('Get admin statistics failed:', error);
        return throwError(() => error);
      })
    );
  }
}