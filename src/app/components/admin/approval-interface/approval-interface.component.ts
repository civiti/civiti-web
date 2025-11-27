import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ApiService } from '../../../services/api.service';
import {
  AdminIssueListItem,
  AdminStatisticsResponse,
  ApproveIssueRequest,
  RejectIssueRequest,
  IssueCategory,
  UrgencyLevel,
  IssueStatus
} from '../../../types/civica-api.types';

// Define local interfaces for component use
interface AdminIssue {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: IssueCategory;
  address: string;
  latitude: number;
  longitude: number;
  locationAccuracy: number;
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
  aiConfidence?: number;
  adminNotes?: string;
  rejectionReason?: string;
  priority: Priority;
  assignedDepartment?: string;
  estimatedResolutionTime?: string;
  publicVisibility: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  photos: IssuePhoto[];
}

interface IssuePhoto {
  id: string;
  url: string;
  thumbnail?: string;
  uploadedAt: string;
}

enum Priority {
  Unspecified = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4
}



@Component({
  selector: 'app-approval-interface',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzTagModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzRadioModule,
    NzSpinModule,
    NzStatisticModule,
    NzGridModule,
    NzBadgeModule,
    NzTypographyModule
  ],
  templateUrl: './approval-interface.component.html',
  styleUrls: ['./approval-interface.component.scss']
})
export class ApprovalInterfaceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  pendingIssues: AdminIssueListItem[] = [];
  adminStats: AdminStatisticsResponse | null = null;
  departments: string[] = [];
  isLoading = false;
  isProcessing = false;

  // Modal state
  isApprovalModalVisible = false;
  selectedIssue: AdminIssueListItem | null = null;
  approvalForm!: FormGroup;

  constructor(
    private apiService: ApiService,
    private message: NzMessageService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calculateApprovalRate(): number {
    if (!this.adminStats) return 0;
    return Math.round(this.adminStats.approvalRate);
  }

  private initializeForm(): void {
    this.approvalForm = this.fb.group({
      decision: ['', [Validators.required]],
      priority: ['medium'],
      assignedDepartment: [''],
      notes: ['']
    });
  }

  private loadData(): void {
    this.isLoading = true;

    // Load pending issues
    this.apiService.getPendingIssues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Convert API response to component format
          this.pendingIssues = response.items;
          console.log('[ADMIN] Loaded pending issues:', this.pendingIssues.length);
        },
        error: (error) => {
          console.error('[ADMIN] Failed to load pending issues:', error);
          this.message.error('Failed to load pending issues');
        }
      });

    // Load admin statistics
    this.apiService.getAdminStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: AdminStatisticsResponse) => {
          this.adminStats = stats;
          console.log('[ADMIN] Loaded admin stats:', this.adminStats);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('[ADMIN] Failed to load admin stats:', error);
          this.message.error('Failed to load statistics');
          this.isLoading = false;
        }
      });

    // Load departments - for now use hardcoded list
    this.departments = [
      'Primăria',
      'Poliția Locală',
      'Serviciul Public de Salubritate',
      'Direcția de Transport Public',
      'Serviciul de Utilități Publice'
    ];
  }

  refreshData(): void {
    console.log('[ADMIN] Refreshing data...');
    this.loadData();
    this.message.info('Data refreshed');
  }

  getCategoryColor(categoryId: string): string {
    const colors: { [key: string]: string } = {
      'infrastructure': 'orange',
      'environment': 'green',
      'transportation': 'blue',
      'public-services': 'purple',
      'safety': 'red',
      'other': 'default'
    };
    return colors[categoryId] || 'default';
  }

  getUrgencyStatus(urgency: string): 'default' | 'processing' | 'success' | 'error' | 'warning' {
    const statuses: { [key: string]: 'default' | 'processing' | 'success' | 'error' | 'warning' } = {
      'low': 'default',
      'medium': 'processing',
      'high': 'warning',
      'urgent': 'error'
    };
    return statuses[urgency] || 'default';
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  }

  viewIssueDetails(issue: AdminIssueListItem): void {
    console.log('[ADMIN] View issue details:', issue.id);
    // TODO: Open detailed view modal or navigate to details page
    this.openApprovalModal(issue);
  }

  openApprovalModal(issue: AdminIssueListItem): void {
    console.log('[ADMIN] Open approval modal for issue:', issue.id);
    this.selectedIssue = issue;
    this.isApprovalModalVisible = true;

    // Reset form
    this.approvalForm.reset({
      decision: '',
      priority: 'medium',
      assignedDepartment: '',
      notes: ''
    });
  }

  closeApprovalModal(): void {
    this.isApprovalModalVisible = false;
    this.selectedIssue = null;
    this.approvalForm.reset();
  }

  viewPhoto(photoUrl: string): void {
    console.log('[ADMIN] View photo:', photoUrl);
    // Open photo in new tab/window
    window.open(photoUrl, '_blank');
  }

  submitDecision(): void {
    if (!this.approvalForm.valid || !this.selectedIssue) {
      this.message.warning('Please fill in all required fields');
      return;
    }

    const formValue = this.approvalForm.value;
    const issueId = this.selectedIssue.id;

    console.log('[ADMIN] Submitting approval decision for issue:', issueId);
    this.isProcessing = true;

    if (formValue.decision === 'approve') {
      const approvalData: ApproveIssueRequest = {
        adminNotes: formValue.notes,
        templateEmail: {
          subject: `Problemă aprobată: ${this.selectedIssue.title}`,
          body: 'Problema dumneavoastră a fost aprobată și se află în proces de rezolvare.',
          targetAuthorities: [formValue.assignedDepartment || 'Primăria']
        }
      };

      this.apiService.approveIssue(issueId, approvalData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            console.log('[ADMIN] Issue approved successfully:', result);
            this.message.success('Issue approved successfully');
            this.handleDecisionSuccess('approve');
          },
          error: (error) => {
            console.error('[ADMIN] Failed to approve issue:', error);
            this.message.error('Failed to approve issue. Please try again.');
            this.isProcessing = false;
          }
        });
    } else if (formValue.decision === 'reject') {
      const rejectionData: RejectIssueRequest = {
        reason: formValue.notes || 'Nu îndeplinește criteriile de aprobare',
        adminNotes: formValue.notes
      };

      this.apiService.rejectIssue(issueId, rejectionData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            console.log('[ADMIN] Issue rejected successfully:', result);
            this.message.success('Issue rejected successfully');
            this.handleDecisionSuccess('reject');
          },
          error: (error) => {
            console.error('[ADMIN] Failed to reject issue:', error);
            this.message.error('Failed to reject issue. Please try again.');
            this.isProcessing = false;
          }
        });
    }
  }

  private handleDecisionSuccess(decision: 'approve' | 'reject'): void {
    // Remove processed issue from pending list
    this.pendingIssues = this.pendingIssues.filter(issue => issue.id !== this.selectedIssue?.id);

    // Update stats
    if (this.adminStats) {
      this.adminStats.pendingReview--;
      if (decision === 'approve') {
        this.adminStats.reviewedToday++;
        this.adminStats.approved++;
      } else if (decision === 'reject') {
        this.adminStats.reviewedToday++;
        this.adminStats.rejected++;
      }
    }

    this.closeApprovalModal();
    this.isProcessing = false;
  }
}