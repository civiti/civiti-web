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
  | 'Approved'
  | 'InProgress'
  | 'Resolved'
  | 'Rejected';

export type ResidenceType = 'urban' | 'rural';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type LeaderboardPeriod = 'all-time' | 'monthly' | 'weekly';

export type LeaderboardCategory = 'points' | 'emails' | 'issues';

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
  birthYear?: number;
}

export interface UpdateUserProfileRequest {
  displayName?: string;
  county?: string;
  city?: string;
  district?: string;
  residenceType?: ResidenceType;
  birthYear?: number;
}

export interface CreateIssueRequest {
  title: string;
  description: string;
  detailedDescription?: string;
  category: IssueCategory;
  urgency: UrgencyLevel;
  county: string;
  city: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  photoUrls?: string[];
}

export interface TrackEmailRequest {
  emailAddress: string;
  targetAuthority: string;
}

export interface ApproveIssueRequest {
  adminNotes?: string;
  templateEmail?: {
    subject: string;
    body: string;
    targetAuthorities: string[];
  };
}

export interface RejectIssueRequest {
  reason: string;
  adminNotes?: string;
}

export interface RequestChangesRequest {
  requestedChanges: string;
  adminNotes?: string;
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
  supabaseUserId: string;
  email: string;
  photoURL?: string;
  displayName: string;
  county: string;
  city: string;
  district?: string;
  residenceType: ResidenceType;
  birthYear?: number;
  points: number;
  level: number;
  createdAt: string;
  updatedAt: string;
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
  photoUrls: string[];
  emailsSent: number;
  status: IssueStatus;
  createdAt: string;
  submitterName?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IssueDetailResponse {
  id: string;
  city: string;
  county: string;
  district?: string;
  title: string;
  description: string;
  category: IssueCategory;
  address: string;
  latitude: number;
  longitude: number;
  neighborhood?: string;
  landmark?: string;
  urgency: UrgencyLevel;
  status: IssueStatus;
  emailsSent: number;
  currentSituation?: string;
  desiredOutcome?: string;
  communityImpact?: string;
  aiGeneratedDescription?: string;
  aiProposedSolution?: string;
  publicVisibility: boolean;
  createdAt: string;
  updatedAt: string;
  photos: IssuePhotoResponse[];
  user: UserBasicResponse;
  targetAuthorities?: string[]; // Array of authority email addresses
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

// Badge interfaces matching backend
export interface BadgeResponse {
  id: string;  // Guid in backend becomes string
  name: string;
  description: string;
  iconUrl?: string;  // Changed from imageUrl
  category: string;  // New property
  rarity: string;    // New property replacing tier
  requirementDescription?: string;  // Changed from requirement
  earnedAt?: string;  // DateTime? becomes string (ISO date)
  isEarned: boolean;  // New property
}

// Keep the old Badge interface for backward compatibility during migration
export interface Badge extends BadgeResponse {
  // Deprecated properties - to be removed
  imageUrl?: string;
  tier?: BadgeTier;
  pointValue?: number;
  requirement?: string;
  createdAt?: string;
}

// Achievement interfaces matching backend
export interface AchievementResponse {
  id: string;  // Guid in backend becomes string
  title: string;  // Changed from name
  description: string;
  maxProgress: number;  // Changed from target
  rewardPoints: number;  // Changed from pointReward
  rewardBadge?: BadgeResponse;  // New property
  achievementType: string;  // New property
}

export interface AchievementProgressResponse {
  id: string;  // Guid in backend becomes string
  title: string;  // Changed from name
  description: string;
  progress: number;
  maxProgress: number;  // Changed from target
  rewardPoints: number;  // Changed from pointReward
  completed: boolean;  // New property
  completedAt?: string;  // DateTime? becomes string (ISO date)
  percentageComplete: number;  // decimal becomes number
}

// Keep the old Achievement interface for backward compatibility during migration
export interface Achievement extends AchievementProgressResponse {
  // Deprecated properties - to be removed
  name?: string;
  target?: number;
  pointReward?: number;
}

export interface UserGamificationResponse {
  totalPoints: number;
  currentLevel: number;
  pointsToNextLevel: number;
  rank: number;
  recentBadges: BadgeResponse[];  // Updated to use BadgeResponse
  activeAchievements: AchievementProgressResponse[];  // Updated to use AchievementProgressResponse
}

export interface UserFullProfileResponse {
  profile: UserProfileResponse;
  gamification: UserGamificationResponse;
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
  description: string;
  category: IssueCategory;
  urgency: UrgencyLevel;
  location: string;
  submittedBy: string;
  submittedAt: string;
  photoCount: number;
  status: IssueStatus;
}

export interface ModerationHistoryItem {
  action: string;
  adminId: string;
  adminEmail: string;
  timestamp: string;
  notes?: string;
}

export interface AdminIssueDetailResponse {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  category: IssueCategory;
  urgency: UrgencyLevel;
  county: string;
  city: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  photoUrls: string[];
  status: IssueStatus;
  submitterId: string;
  submitterEmail: string;
  submitterName: string;
  submittedAt: string;
  adminNotes?: string;
  moderationHistory: ModerationHistoryItem[];
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
  issuesByPriority: { [key: string]: number };
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

  // Authentication
  createProfile: (data: CreateUserProfileRequest) => Promise<UserProfileResponse>;
  getProfile: () => Promise<UserProfileResponse>;
  updateProfile: (data: UpdateUserProfileRequest) => Promise<UserProfileResponse>;
  deleteProfile: () => Promise<void>;

  // Issues
  getIssues: (params?: IssueQueryParams) => Promise<PagedResult<IssueItem>>;
  getIssueById: (id: string) => Promise<IssueDetailResponse>;
  createIssue: (data: CreateIssueRequest) => Promise<CreateIssueResponse>;
  trackEmailSent: (id: string, data: TrackEmailRequest) => Promise<TrackEmailResponse>;

  // User
  getUserFullProfile: () => Promise<UserFullProfileResponse>;
  getUserIssues: (params?: IssueQueryParams) => Promise<PagedResult<IssueItem>>;

  // Gamification
  getBadges: () => Promise<Badge[]>;
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
  Submitted: 'Trimis',
  UnderReview: 'În Evaluare',
  Approved: 'Aprobat',
  InProgress: 'În Progres',
  Resolved: 'Rezolvat',
  Rejected: 'Respins'
};

// AI Analysis interface matching backend
export interface AIAnalysisResult {
  aiGeneratedDescription?: string;
  aiProposedSolution?: string;
  aiConfidence?: number;
}

export const API_ENDPOINTS = {
  // Base URLs
  LOCAL: 'http://localhost:8080',
  PRODUCTION: 'https://civica-api.railway.app',

  // Endpoints
  HEALTH: '/api/health',

  // Auth
  CREATE_PROFILE: '/api/auth/create-profile',
  PROFILE: '/api/auth/profile',

  // Issues
  ISSUES: '/api/issues',
  ISSUE_BY_ID: (id: string) => `/api/issues/${id}`,
  TRACK_EMAIL: (id: string) => `/api/issues/${id}/email-sent`,

  // User
  USER_PROFILE: '/api/user/profile',
  USER_ISSUES: '/api/user/issues',

  // Gamification
  BADGES: '/api/gamification/badges',
  LEADERBOARD: '/api/gamification/leaderboard',

  // Admin
  PENDING_ISSUES: '/api/admin/pending-issues',
  ADMIN_ISSUE: (id: string) => `/api/admin/issues/${id}`,
  APPROVE_ISSUE: (id: string) => `/api/admin/issues/${id}/approve`,
  REJECT_ISSUE: (id: string) => `/api/admin/issues/${id}/reject`,
  REQUEST_CHANGES: (id: string) => `/api/admin/issues/${id}/request-changes`,
  BULK_APPROVE: '/api/admin/issues/bulk-approve',
  ADMIN_STATS: '/api/admin/statistics'
} as const;