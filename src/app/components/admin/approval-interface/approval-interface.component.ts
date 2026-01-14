import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

import { ApiService } from '../../../services/api.service';
import {
  AdminIssueListItem,
  AdminStatisticsResponse,
  ApproveIssueRequest,
  RejectIssueRequest,
  BulkApproveRequest,
  IssueCategory,
  UrgencyLevel,
  IssueStatus
} from '../../../types/civica-api.types';

@Component({
  selector: 'app-approval-interface',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
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
    NzTypographyModule,
    NzCheckboxModule
  ],
  templateUrl: './approval-interface.component.html',
  styleUrls: ['./approval-interface.component.scss']
})
export class ApprovalInterfaceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  pendingIssues: AdminIssueListItem[] = [];
  adminStats: AdminStatisticsResponse | null = null;
  isLoading = false;
  isProcessing = false;

  // Selection state for bulk actions
  selectedIssueIds = new Set<string>();
  allSelected = false;

  // Single issue approval modal state
  isApprovalModalVisible = false;
  selectedIssue: AdminIssueListItem | null = null;
  approvalForm!: FormGroup;

  // Bulk approval modal state
  isBulkApprovalModalVisible = false;
  bulkApprovalNotes = '';

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
          this.message.error('Nu s-au putut încărca problemele în așteptare');
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
          this.message.error('Nu s-au putut încărca statisticile');
          this.isLoading = false;
        }
      });
  }

  refreshData(): void {
    console.log('[ADMIN] Refreshing data...');
    this.loadData();
    this.message.info('Datele au fost reîmprospătate');
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
    this.router.navigate(['/issue', issue.id]);
  }

  openApprovalModal(issue: AdminIssueListItem): void {
    console.log('[ADMIN] Open approval modal for issue:', issue.id);
    this.selectedIssue = issue;
    this.isApprovalModalVisible = true;

    // Reset form
    this.approvalForm.reset({
      decision: '',
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
      this.message.warning('Completează toate câmpurile obligatorii');
      return;
    }

    const formValue = this.approvalForm.value;
    const issueId = this.selectedIssue.id;

    console.log('[ADMIN] Submitting approval decision for issue:', issueId);
    this.isProcessing = true;

    if (formValue.decision === 'approve') {
      const approvalData: ApproveIssueRequest = {
        adminNotes: formValue.notes || undefined
      };

      this.apiService.approveIssue(issueId, approvalData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            console.log('[ADMIN] Issue approved successfully:', result);
            this.message.success('Problema a fost aprobată cu succes');
            this.handleDecisionSuccess('approve');
          },
          error: (error) => {
            console.error('[ADMIN] Failed to approve issue:', error);
            this.message.error('Aprobarea a eșuat. Încearcă din nou.');
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
            this.message.success('Problema a fost respinsă');
            this.handleDecisionSuccess('reject');
          },
          error: (error) => {
            console.error('[ADMIN] Failed to reject issue:', error);
            this.message.error('Respingerea a eșuat. Încearcă din nou.');
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

  // ============================================
  // Bulk Selection Methods
  // ============================================

  toggleSelectAll(checked: boolean): void {
    this.allSelected = checked;
    if (checked) {
      this.pendingIssues.forEach(issue => this.selectedIssueIds.add(issue.id));
    } else {
      this.selectedIssueIds.clear();
    }
  }

  toggleIssueSelection(issueId: string, checked: boolean): void {
    if (checked) {
      this.selectedIssueIds.add(issueId);
    } else {
      this.selectedIssueIds.delete(issueId);
    }
    // Update allSelected state
    this.allSelected = this.pendingIssues.length > 0 &&
                       this.selectedIssueIds.size === this.pendingIssues.length;
  }

  isIssueSelected(issueId: string): boolean {
    return this.selectedIssueIds.has(issueId);
  }

  get selectedCount(): number {
    return this.selectedIssueIds.size;
  }

  // ============================================
  // Bulk Approval Methods
  // ============================================

  openBulkApprovalModal(): void {
    if (this.selectedIssueIds.size === 0) {
      this.message.warning('Selectează cel puțin o problemă pentru aprobare în masă');
      return;
    }
    this.bulkApprovalNotes = '';
    this.isBulkApprovalModalVisible = true;
  }

  closeBulkApprovalModal(): void {
    this.isBulkApprovalModalVisible = false;
    this.bulkApprovalNotes = '';
  }

  submitBulkApproval(): void {
    if (this.selectedIssueIds.size === 0) {
      return;
    }

    this.isProcessing = true;
    const request: BulkApproveRequest = {
      issueIds: Array.from(this.selectedIssueIds),
      adminNotes: this.bulkApprovalNotes || undefined
    };

    console.log('[ADMIN] Submitting bulk approval for', request.issueIds.length, 'issues');

    this.apiService.bulkApproveIssues(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[ADMIN] Bulk approval completed:', response);
          this.message.success(`${response.successCount} probleme aprobate cu succes`);

          if (response.failedCount > 0) {
            this.message.warning(`${response.failedCount} probleme nu au putut fi aprobate`);
          }

          // Remove approved issues from the list
          const approvedIds = new Set(response.results
            .filter(r => r.success)
            .map(r => r.issueId));

          this.pendingIssues = this.pendingIssues.filter(issue => !approvedIds.has(issue.id));

          // Update stats
          if (this.adminStats) {
            this.adminStats.pendingReview -= response.successCount;
            this.adminStats.reviewedToday += response.successCount;
            this.adminStats.approved += response.successCount;
          }

          // Clear selection
          this.selectedIssueIds.clear();
          this.allSelected = false;

          this.closeBulkApprovalModal();
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('[ADMIN] Bulk approval failed:', error);
          this.message.error('Aprobarea în masă a eșuat. Încearcă din nou.');
          this.isProcessing = false;
        }
      });
  }
}