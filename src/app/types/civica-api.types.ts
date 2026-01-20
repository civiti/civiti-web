/**
 * Civica API TypeScript Interfaces
 * Generated from OpenAPI Specification
 * 
 * Base URL (Local): http://localhost:8080
 * Base URL (Production): https://civica-api.railway.app
 */

// ============================================
// Common Types
// ============================================

export type UserRole = 'user' | 'admin';

export type IssueCategory =
  | 'Infrastructure'
  | 'Environment'
  | 'Transportation'
  | 'PublicServices'
  | 'Safety'
  | 'Other';

export type UrgencyLevel = 'Unspecified' | 'Low' | 'Medium' | 'High' | 'Urgent';

export type IssueStatus =
  | 'Unspecified'
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'Active'
  | 'Resolved'
  | 'Rejected'
  | 'Cancelled';

/** User-facing status labels for display */
export type UserFacingStatus = 'Activ' | 'Rezolvat' | 'Respins';

/** Statuses that represent an "active" issue */
export const ACTIVE_ISSUE_STATUSES: IssueStatus[] = [
  'Submitted',
  'UnderReview',
  'Active'
];

/** Map internal status to user-facing display status */
export function getDisplayStatus(status: IssueStatus): UserFacingStatus | null {
  if (ACTIVE_ISSUE_STATUSES.includes(status)) return 'Activ';
  if (status === 'Resolved') return 'Rezolvat';
  if (status === 'Rejected') return 'Respins';
  return null; // Hidden statuses (Draft, Cancelled, Unspecified)
}

/** Check if an issue status is considered "active" */
export function isActiveStatus(status: IssueStatus): boolean {
  return ACTIVE_ISSUE_STATUSES.includes(status);
}

/**
 * Normalize status string to canonical PascalCase IssueStatus.
 * Handles case-insensitive matching from API responses.
 */
export function normalizeStatus(status: string | null | undefined): IssueStatus {
  if (!status) return 'Unspecified';

  const statusMap: Record<string, IssueStatus> = {
    'unspecified': 'Unspecified',
    'draft': 'Draft',
    'submitted': 'Submitted',
    'underreview': 'UnderReview',
    'active': 'Active',
    'resolved': 'Resolved',
    'rejected': 'Rejected',
    'cancelled': 'Cancelled',
  };

  return statusMap[status.toLowerCase()] || 'Unspecified';
}

/** Statuses that are publicly viewable (non-owners, non-admins can view) */
export const PUBLIC_VIEWABLE_STATUSES: IssueStatus[] = ['Active', 'Resolved'];

/**
 * Check if an issue status is publicly viewable.
 * Uses case-insensitive comparison for API response compatibility.
 */
export function isPubliclyViewableStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = normalizeStatus(status);
  return PUBLIC_VIEWABLE_STATUSES.includes(normalized);
}

export type ResidenceType = 'Apartment' | 'House' | 'Business';

export type LeaderboardPeriod = 'all-time' | 'monthly' | 'weekly';

export type LeaderboardCategory = 'points' | 'emails' | 'issues';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

// ============================================
// Authority Types
// ============================================

/**
 * Input model for linking an authority to an issue during creation
 */
export interface IssueAuthorityInput {
  /** ID of a predefined authority. If provided, customName and customEmail should be null. */
  authorityId?: string;
  /** Custom authority name. Required if authorityId is not provided. */
  customName?: string;
  /** Custom authority email. Required if authorityId is not provided. */
  customEmail?: string;
}

/**
 * Response model for authority linked to an issue
 */
export interface IssueAuthorityResponse {
  /** ID of the predefined authority (null if custom) */
  authorityId?: string;
  /** Authority name (from predefined or custom) */
  name: string;
  /** Authority email (from predefined or custom) */
  email: string;
  /** True if this is a predefined authority, false if custom */
  isPredefined: boolean;
}

/**
 * Response model for authority in list views
 */
export interface AuthorityListResponse {
  id: string;
  name: string;
  email: string;
  /** City where authority operates */
  city: string;
  /** District/Sector within city. Null for city-wide authorities. */
  district: string | null;
}

/**
 * Query parameters for filtering authorities
 */
export interface AuthorityQueryParams {
  /** Filter by city name (case-insensitive) */
  city?: string;
  /** Filter by district within city (case-insensitive) */
  district?: string;
  /** Search by authority name (case-insensitive, partial match) */
  search?: string;
}

/**
 * Full authority response with metadata
 */
export interface AuthorityResponse extends AuthorityListResponse {
  isActive: boolean;
  createdAt: string;
}

// ============================================
// Request Interfaces
// ============================================

export interface CreateUserProfileRequest {
  supabaseUserId: string;
  email: string;
  displayName: string;
  county: string;
  city: string;
  district?: string;
  residenceType: ResidenceType;
}

export interface UpdateUserProfileRequest {
  displayName?: string;
  county?: string;
  city?: string;
  district?: string;
  residenceType?: ResidenceType;
}

export interface CreateIssueRequest {
  title: string;
  description: string;
  category: IssueCategory;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  urgency?: UrgencyLevel;
  desiredOutcome?: string;
  communityImpact?: string;
  photoUrls?: string[];
  authorities?: IssueAuthorityInput[];
}

export interface TrackEmailRequest {
  emailAddress?: string;  // Optional - no longer collected from user
  targetAuthority: string;
}

export interface ApproveIssueRequest {
  adminNotes?: string;
}

export interface RejectIssueRequest {
  reason: string;
  adminNotes?: string;
}

export interface RequestChangesRequest {
  requestedChanges: string;
  adminNotes?: string;
}

// ============================================
// User Issue Management Types
// ============================================

/**
 * Request to update an issue's status (for owner actions)
 * PUT /api/user/issues/{id}/status
 * Returns 204 No Content on success
 */
export interface UpdateIssueStatusRequest {
  status: 'cancelled' | 'resolved'; // camelCase as expected by backend
}

/** Request to edit user's own issue */
export interface EditUserIssueRequest {
  title?: string;
  description?: string;
  photoUrls?: string[];
  resubmit?: boolean; // If true, changes status back to Submitted
}

export interface BulkApproveRequest {
  issueIds: string[];
  adminNotes?: string;
}

// ============================================
// Response Interfaces
// ============================================

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  database: string;
  supabase: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  county: string;
  city: string;
  district: string;
  residenceType?: string;
  points: number;
  level: number;
  createdAt: string;
  emailVerified: boolean;
  role: UserRole;

  // Notification preferences
  issueUpdatesEnabled: boolean;
  communityNewsEnabled: boolean;
  monthlyDigestEnabled: boolean;
  achievementsEnabled: boolean;

  // Gamification data
  gamification?: UserGamificationResponse;
}

export interface IssueItem {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  urgency: UrgencyLevel;
  county: string;
  city: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  mainPhotoUrl?: string;
  photoUrls: string[];
  emailsSent: number;
  status: IssueStatus;
  createdAt: string;
  submitterName?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IssueDetailResponse {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  address: string;
  latitude: number;
  longitude: number;
  district?: string;
  urgency: UrgencyLevel;
  status: IssueStatus;
  emailsSent: number;
  desiredOutcome?: string;
  communityImpact?: string;
  publicVisibility: boolean;
  createdAt: string;
  updatedAt: string;
  photos: IssuePhotoResponse[];
  authorities: IssueAuthorityResponse[];
  user: UserBasicResponse;
}

export interface IssuePhotoResponse {
  id: string;
  url: string;
  description?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface UserBasicResponse {
  id: string;
  name: string;
  photoUrl?: string;
}

export interface CreateIssueResponse {
  id: string;
  message: string;
  status: IssueStatus;
}

export interface TrackEmailResponse {
  success: boolean;
  message: string;
  pointsEarned: number;
  newTotalEmails: number;
}

export interface BadgeResponse {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: string;
  rarity: string | null;
  requirementDescription?: string;
  earnedAt?: string;
  isEarned: boolean;
}

export interface AchievementResponse {
  id: string;
  title: string;
  description: string;
  maxProgress: number;
  rewardPoints: number;
  rewardBadge?: BadgeResponse;
  achievementType: string;
}

export interface AchievementProgressResponse {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  rewardPoints: number;
  completed: boolean;
  completedAt?: string;
  percentageComplete: number;
}

export interface UserGamificationResponse {
  points: number;
  level: number;
  issuesReported: number;
  issuesResolved: number;
  communityVotes: number;
  currentLoginStreak: number;
  longestLoginStreak: number;
  recentBadges: BadgeResponse[];
  activeAchievements: AchievementProgressResponse[];
  currentLevelPoints: number;
  nextLevelPoints: number;
  pointsToNextLevel: number;
  pointsInCurrentLevel: number;
  levelProgressPercentage: number;
}


export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  points: number;
  level: number;
  emailsSent: number;
  issuesCreated: number;
  badgeCount: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
  totalEntries: number;
  generatedAt: string;
}

export interface AdminIssueListItem {
  id: string;
  title: string;
  category: IssueCategory;
  urgency: UrgencyLevel;
  status: IssueStatus;
  address: string;
  createdAt: string;
  photoCount: number;
  emailsSent: number;
  userName: string;
}

/**
 * Admin action history item
 */
export interface AdminActionResponse {
  id: string;
  action: string;
  adminId: string;
  adminEmail: string;
  adminName?: string;
  notes?: string;
  createdAt: string;
}

/**
 * Photo response for admin issue detail
 */
export interface AdminIssuePhotoResponse {
  id: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  isPrimary: boolean;
  fileSize?: number;
  createdAt: string;
}

export interface AdminIssueDetailResponse {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  urgency: UrgencyLevel;
  status: IssueStatus;

  // Location details
  address: string;
  latitude: number;
  longitude: number;
  district?: string;

  // Extended details
  desiredOutcome?: string;
  communityImpact?: string;

  // Admin details
  adminNotes?: string;
  rejectionReason?: string;
  publicVisibility: boolean;

  // Review info
  reviewedAt?: string;
  reviewedBy?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // User info
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userTotalIssues: number;
  userResolvedIssues: number;
  userPoints: number;

  // Related data
  photos: AdminIssuePhotoResponse[];
  authorities: IssueAuthorityResponse[];
  adminActions: AdminActionResponse[];
  emailsSent: number;
}

export interface IssueActionResponse {
  success: boolean;
  message: string;
  issueId: string;
  approvedAt?: string;
  rejectedAt?: string;
  requestedAt?: string;
}

export interface BulkApproveResult {
  issueId: string;
  success: boolean;
  message: string;
}

export interface BulkApproveResponse {
  successCount: number;
  failedCount: number;
  results: BulkApproveResult[];
}

export interface CategoryStats {
  category: string;
  count: number;
}

export interface ModerationStats {
  averageApprovalTime: string;
  approvalRate: number;
  pendingOlderThan24h: number;
}

export interface AdminStatisticsResponse {
  totalSubmissions: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  inProgress: number;
  resolved: number;
  submissionsToday: number;
  submissionsThisWeek: number;
  submissionsThisMonth: number;
  reviewedToday: number;
  reviewedThisWeek: number;
  reviewedThisMonth: number;
  averageReviewTimeHours: number;
  issuesByCategory: { [key: string]: number };
  issuesByUrgency: { [key: string]: number };
  totalUsers: number;
  activeUsersThisMonth: number;
  totalEmailsSent: number;
  approvalRate: number;
  resolutionRate: number;
  backlogCount: number;
  period: string;
  generatedAt: string;
}

export interface ErrorResponse {
  error: string;
  details?: any;
  requestId?: string;
  retryAfter?: number;
}

// ============================================
// Admin Activity Log Types
// ============================================

/**
 * Activity log action types (issue moderation actions only)
 * Values match backend: approve, reject, requestchanges (lowercase)
 */
export type AdminActionType =
  | 'approve'
  | 'reject'
  | 'requestchanges';

/**
 * Admin activity log entry
 * Matches GET /api/admin/actions response
 */
export interface AdminActivityLogEntry {
  id: string;
  issueId: string;
  issueTitle: string;
  adminUserId: string;
  adminName: string;
  adminEmail: string;
  actionType: AdminActionType;
  notes: string | null;
  previousStatus: string;
  newStatus: string;
  createdAt: string;
}

/**
 * Query parameters for activity log
 * Matches backend: GET /api/admin/actions
 */
export interface ActivityLogQueryParams {
  page?: number;
  pageSize?: number;
  issueId?: string;
  adminUserId?: string;
  actionType?: AdminActionType;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

// ============================================
// Query Parameter Interfaces
// ============================================

export interface IssueQueryParams {
  page?: number;
  pageSize?: number;
  category?: IssueCategory;
  urgency?: UrgencyLevel;
  county?: string;
  city?: string;
  district?: string;
  address?: string;
  status?: IssueStatus;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface LeaderboardQueryParams {
  period?: LeaderboardPeriod;
  category?: LeaderboardCategory;
  page?: number;
  pageSize?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

// ============================================
// API Service Interface
// ============================================

export interface CivicaApiEndpoints {
  // Health
  health: () => Promise<HealthResponse>;

  // User Profile (unified endpoint)
  getProfile: () => Promise<UserProfileResponse>;
  createProfile: (data: CreateUserProfileRequest) => Promise<UserProfileResponse>;
  updateProfile: (data: UpdateUserProfileRequest) => Promise<UserProfileResponse>;
  deleteAccount: () => Promise<void>;

  // User Issues
  getUserIssues: (params?: IssueQueryParams) => Promise<PagedResult<IssueItem>>;

  // Issues (public)
  getIssues: (params?: IssueQueryParams) => Promise<PagedResult<IssueItem>>;
  getIssueById: (id: string) => Promise<IssueDetailResponse>;
  createIssue: (data: CreateIssueRequest) => Promise<CreateIssueResponse>;
  trackEmailSent: (id: string, data: TrackEmailRequest) => Promise<TrackEmailResponse>;

  // Gamification
  getGamification: () => Promise<UserGamificationResponse>;
  getLeaderboard: (params?: LeaderboardQueryParams) => Promise<LeaderboardResponse>;

  // Admin
  getPendingIssues: (params?: PaginationParams) => Promise<PagedResult<AdminIssueListItem>>;
  getAdminIssueDetail: (id: string) => Promise<AdminIssueDetailResponse>;
  approveIssue: (id: string, data: ApproveIssueRequest) => Promise<IssueActionResponse>;
  rejectIssue: (id: string, data: RejectIssueRequest) => Promise<IssueActionResponse>;
  requestChanges: (id: string, data: RequestChangesRequest) => Promise<IssueActionResponse>;
  bulkApprove: (data: BulkApproveRequest) => Promise<BulkApproveResponse>;
  getAdminStatistics: () => Promise<AdminStatisticsResponse>;
}

// ============================================
// Helper Types for Angular Forms
// ============================================

export interface IssueFormData extends Omit<CreateIssueRequest, 'photoUrls'> {
  photos?: File[];
}

export interface FilterOptions {
  categories: Array<{ value: IssueCategory; label: string }>;
  urgencyLevels: Array<{ value: UrgencyLevel; label: string }>;
  statuses: Array<{ value: IssueStatus; label: string }>;
  counties: string[];
  cities: string[];
}

// ============================================
// Constants
// ============================================

export const ISSUE_CATEGORIES: Record<IssueCategory, string> = {
  Infrastructure: 'Infrastructură',
  Environment: 'Mediu',
  Transportation: 'Transport',
  PublicServices: 'Servicii Publice',
  Safety: 'Siguranță',
  Other: 'Altele'
};

export const URGENCY_LEVELS: Record<UrgencyLevel, string> = {
  Unspecified: 'Nespecificat',
  Low: 'Scăzută',
  Medium: 'Medie',
  High: 'Ridicată',
  Urgent: 'Urgentă'
};

export const ISSUE_STATUSES: Record<IssueStatus, string> = {
  Unspecified: 'Nespecificat',
  Draft: 'Ciornă',
  Submitted: 'Trimisă',
  UnderReview: 'În Evaluare',
  Active: 'Activă',
  Resolved: 'Rezolvată',
  Rejected: 'Respinsă',
  Cancelled: 'Anulată'
};

/** User-facing status labels in Romanian */
export const USER_FACING_STATUS_LABELS: Record<UserFacingStatus, string> = {
  Activ: 'Activ',
  Rezolvat: 'Rezolvat',
  Respins: 'Respins'
};

export const API_ENDPOINTS = {
  // Base URLs
  LOCAL: 'http://localhost:8080',
  PRODUCTION: 'https://civica-api.railway.app',

  // Endpoints
  HEALTH: '/api/health',

  // Auth
  AUTH_STATUS: '/api/auth/status',

  // User
  USER_PROFILE: '/api/user/profile',       // GET, POST, PUT
  USER_ISSUES: '/api/user/issues',
  USER_GAMIFICATION: '/api/user/gamification',
  USER_LEADERBOARD: '/api/user/leaderboard',
  USER_ACCOUNT: '/api/user/account',

  // Issues
  ISSUES: '/api/issues',
  ISSUE_BY_ID: (id: string) => `/api/issues/${id}`,
  TRACK_EMAIL: (id: string) => `/api/issues/${id}/email-sent`,

  // User Issue Management
  USER_ISSUE_BY_ID: (id: string) => `/api/user/issues/${id}`,
  USER_ISSUE_STATUS: (id: string) => `/api/user/issues/${id}/status`,

  // Admin
  PENDING_ISSUES: '/api/admin/pending-issues',
  ADMIN_ISSUE: (id: string) => `/api/admin/issues/${id}`,
  APPROVE_ISSUE: (id: string) => `/api/admin/issues/${id}/approve`,
  REJECT_ISSUE: (id: string) => `/api/admin/issues/${id}/reject`,
  REQUEST_CHANGES: (id: string) => `/api/admin/issues/${id}/request-changes`,
  BULK_APPROVE: '/api/admin/issues/bulk-approve',
  ADMIN_STATS: '/api/admin/statistics',
  ADMIN_ACTIONS: '/api/admin/actions'
} as const;