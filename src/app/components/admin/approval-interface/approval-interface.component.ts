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

import { 
  MockAdminService, 
  AdminIssue, 
  ApprovalDecision, 
  AdminStats 
} from '../../../services/mock-admin.service';

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
  template: `
    <div class="admin-container">
      
      <!-- Header -->
      <div class="admin-header">
        <div class="header-content">
          <div class="header-info">
            <h1>Admin Approval Dashboard</h1>
            <p>Review and approve community issue submissions</p>
          </div>
          <div class="header-actions">
            <button nz-button nzType="default" (click)="refreshData()">
              <span nz-icon nzType="reload"></span>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="stats-section" *ngIf="adminStats">
        <div nz-row [nzGutter]="[16, 16]">
          
          <div nz-col [nzSpan]="12" [nzMd]="6">
            <nz-card class="stat-card">
              <nz-statistic
                [nzValue]="adminStats.pendingReview"
                nzTitle="Pending Review"
                [nzPrefix]="statIcons.pending"
                [nzValueStyle]="{ color: '#FCA311' }">
              </nz-statistic>
            </nz-card>
          </div>

          <div nz-col [nzSpan]="12" [nzMd]="6">
            <nz-card class="stat-card">
              <nz-statistic
                [nzValue]="adminStats.approvedToday"
                nzTitle="Approved Today"
                [nzPrefix]="statIcons.approved"
                [nzValueStyle]="{ color: '#28A745' }">
              </nz-statistic>
            </nz-card>
          </div>

          <div nz-col [nzSpan]="12" [nzMd]="6">
            <nz-card class="stat-card">
              <nz-statistic
                [nzValue]="adminStats.approvalRate"
                nzSuffix="%"
                nzTitle="Approval Rate"
                [nzPrefix]="statIcons.rate"
                [nzValueStyle]="{ color: '#14213D' }">
              </nz-statistic>
            </nz-card>
          </div>

          <div nz-col [nzSpan]="12" [nzMd]="6">
            <nz-card class="stat-card">
              <nz-statistic
                [nzValue]="adminStats.averageReviewTime"
                nzSuffix="h"
                nzTitle="Avg Review Time"
                [nzPrefix]="statIcons.time"
                [nzValueStyle]="{ color: '#6c757d' }">
              </nz-statistic>
            </nz-card>
          </div>

        </div>
      </div>

      <!-- Issues Table -->
      <div class="issues-section">
        <nz-card nzTitle="Pending Issues" class="issues-card">
          
          <nz-table 
            #issuesTable 
            [nzData]="pendingIssues" 
            [nzLoading]="isLoading"
            [nzPageSize]="10"
            [nzShowPagination]="true"
            nzTableLayout="fixed">
            
            <thead>
              <tr>
                <th nzWidth="50px">#</th>
                <th nzWidth="200px">Issue</th>
                <th nzWidth="120px">Category</th>
                <th nzWidth="100px">Urgency</th>
                <th nzWidth="120px">Submitted</th>
                <th nzWidth="100px">Photos</th>
                <th nzWidth="150px">Actions</th>
              </tr>
            </thead>
            
            <tbody>
              <tr *ngFor="let issue of issuesTable.data; let i = index">
                
                <td>{{ i + 1 }}</td>
                
                <td>
                  <div class="issue-title">{{ issue.title }}</div>
                  <div class="issue-description">{{ issue.description | slice:0:80 }}...</div>
                </td>
                
                <td>
                  <nz-tag [nzColor]="getCategoryColor(issue.category.id)">
                    {{ issue.category.name }}
                  </nz-tag>
                </td>
                
                <td>
                  <nz-badge 
                    [nzStatus]="getUrgencyStatus(issue.urgency)" 
                    [nzText]="issue.urgency | titlecase">
                  </nz-badge>
                </td>
                
                <td>
                  <div class="submission-time">
                    {{ getTimeAgo(issue.submittedAt) }}
                  </div>
                </td>
                
                <td>
                  <nz-badge [nzCount]="issue.photos.length" nzShowZero>
                    <span nz-icon nzType="picture"></span>
                  </nz-badge>
                </td>
                
                <td>
                  <div class="action-buttons">
                    <button 
                      nz-button 
                      nzType="link" 
                      nzSize="small"
                      (click)="viewIssueDetails(issue)">
                      <span nz-icon nzType="eye"></span>
                      View
                    </button>
                    <button 
                      nz-button 
                      nzType="primary" 
                      nzSize="small"
                      (click)="openApprovalModal(issue)">
                      <span nz-icon nzType="check"></span>
                      Review
                    </button>
                  </div>
                </td>
                
              </tr>
            </tbody>
            
          </nz-table>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="!isLoading && pendingIssues.length === 0">
            <div class="empty-icon">
              <span nz-icon nzType="inbox"></span>
            </div>
            <h3>No Pending Issues</h3>
            <p>All community issue submissions have been reviewed.</p>
          </div>

        </nz-card>
      </div>

      <!-- Approval Modal -->
      <nz-modal
        [(nzVisible)]="isApprovalModalVisible"
        nzTitle="Review Issue Submission"
        [nzWidth]="800"
        [nzFooter]="null"
        (nzOnCancel)="closeApprovalModal()"
        nzClass="approval-modal">
        
        <div *nzModalContent>
          <nz-spin [nzSpinning]="isProcessing || false">
            <div class="modal-content">
            
            <!-- Issue Details -->
            <div class="issue-details" *ngIf="selectedIssue">
              
              <div class="issue-header">
                <h3>{{ selectedIssue.title }}</h3>
                <div class="issue-meta">
                  <nz-tag [nzColor]="getCategoryColor(selectedIssue.category.id)">
                    {{ selectedIssue.category.name }}
                  </nz-tag>
                  <nz-badge 
                    [nzStatus]="getUrgencyStatus(selectedIssue.urgency)" 
                    [nzText]="selectedIssue.urgency | titlecase">
                  </nz-badge>
                  <span class="submission-time">
                    Submitted {{ getTimeAgo(selectedIssue.submittedAt) }}
                  </span>
                </div>
              </div>

              <div class="issue-description">
                <h4>Description</h4>
                <p>{{ selectedIssue.description }}</p>
              </div>

              <div class="issue-location">
                <h4>Location</h4>
                <p>{{ selectedIssue.location.address }}</p>
              </div>

              <div class="issue-photos" *ngIf="selectedIssue.photos.length > 0">
                <h4>Photos ({{ selectedIssue.photos.length }})</h4>
                <div class="photos-grid">
                  <div 
                    *ngFor="let photo of selectedIssue.photos" 
                    class="photo-item"
                    (click)="viewPhoto(photo.url)">
                    <img [src]="photo.thumbnail || photo.url" [alt]="'Issue photo'" class="photo-thumbnail">
                    <div class="photo-quality" [ngClass]="'quality-' + photo.quality">
                      {{ photo.quality }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- AI Generated Text -->
              <div class="ai-text" *ngIf="selectedIssue.aiGeneratedText">
                <h4>AI Analysis</h4>
                <div class="ai-confidence">
                  Confidence: {{ (selectedIssue.aiGeneratedText.confidence * 100) | number:'1.0-0' }}%
                </div>
                <div class="ai-content">
                  <p><strong>Generated Description:</strong></p>
                  <p>{{ selectedIssue.aiGeneratedText.description }}</p>
                  <p><strong>Proposed Solution:</strong></p>
                  <p>{{ selectedIssue.aiGeneratedText.proposedSolution }}</p>
                </div>
              </div>

            </div>

            <!-- Approval Form -->
            <div class="approval-form">
              <form nz-form [formGroup]="approvalForm" (ngSubmit)="submitDecision()">
                
                <nz-form-item>
                  <nz-form-label [nzSpan]="24" nzRequired>Decision</nz-form-label>
                  <nz-form-control [nzSpan]="24">
                    <nz-radio-group formControlName="decision">
                      <label nz-radio nzValue="approve">
                        <span nz-icon nzType="check-circle" style="color: #28A745;"></span>
                        Approve
                      </label>
                      <label nz-radio nzValue="reject">
                        <span nz-icon nzType="close-circle" style="color: #DC3545;"></span>
                        Reject
                      </label>
                      <label nz-radio nzValue="request_changes">
                        <span nz-icon nzType="exclamation-circle" style="color: #FCA311;"></span>
                        Request Changes
                      </label>
                    </nz-radio-group>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item *ngIf="approvalForm.get('decision')?.value === 'approve'">
                  <nz-form-label [nzSpan]="24">Priority</nz-form-label>
                  <nz-form-control [nzSpan]="24">
                    <nz-select formControlName="priority" nzPlaceHolder="Set priority level">
                      <nz-option nzValue="low" nzLabel="Low Priority"></nz-option>
                      <nz-option nzValue="medium" nzLabel="Medium Priority"></nz-option>
                      <nz-option nzValue="high" nzLabel="High Priority"></nz-option>
                      <nz-option nzValue="critical" nzLabel="Critical Priority"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item *ngIf="approvalForm.get('decision')?.value === 'approve'">
                  <nz-form-label [nzSpan]="24">Assign Department</nz-form-label>
                  <nz-form-control [nzSpan]="24">
                    <nz-select formControlName="assignedDepartment" nzPlaceHolder="Select department">
                      <nz-option 
                        *ngFor="let dept of departments" 
                        [nzValue]="dept" 
                        [nzLabel]="dept">
                      </nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label [nzSpan]="24">Notes</nz-form-label>
                  <nz-form-control [nzSpan]="24">
                    <textarea
                      nz-input
                      formControlName="notes"
                      rows="4"
                      placeholder="Add notes or feedback...">
                    </textarea>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item class="form-actions">
                  <nz-form-control [nzSpan]="24">
                    <div class="action-buttons">
                      <button nz-button nzType="default" (click)="closeApprovalModal()">
                        Cancel
                      </button>
                      <button 
                        nz-button 
                        nzType="primary" 
                        type="submit"
                        [disabled]="!approvalForm.valid"
                        [nzLoading]="isProcessing">
                        Submit Decision
                      </button>
                    </div>
                  </nz-form-control>
                </nz-form-item>

              </form>
            </div>

            </div>
          </nz-spin>
        </div>
        
      </nz-modal>

    </div>
  `,
  styles: [`
    .admin-container {
      min-height: 100vh;
      background: #f5f5f5;
      padding: 1.5rem;
    }

    .admin-header {
      background: linear-gradient(135deg, #14213D 0%, #1a2b4f 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(20, 33, 61, 0.15);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-info h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: white;
    }

    .header-info p {
      margin: 0;
      opacity: 0.9;
      font-size: 1.1rem;
    }

    .header-actions button {
      color: white !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }

    .stats-section {
      margin-bottom: 2rem;
    }

    .stat-card {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(20, 33, 61, 0.1);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(20, 33, 61, 0.15);
    }

    .issues-section {
      margin-bottom: 2rem;
    }

    .issues-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(20, 33, 61, 0.1);
    }

    .issue-title {
      font-weight: 600;
      color: #14213D;
      margin-bottom: 0.25rem;
      font-size: 0.95rem;
    }

    .issue-description {
      color: #666;
      font-size: 0.85rem;
      line-height: 1.3;
    }

    .submission-time {
      font-size: 0.85rem;
      color: #666;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      color: #ccc;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: #14213D;
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #666;
      margin: 0;
    }

    /* Modal Styles */
    .approval-modal .modal-content {
      max-height: 70vh;
      overflow-y: auto;
    }

    .issue-details {
      margin-bottom: 2rem;
    }

    .issue-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .issue-header h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #14213D;
      margin: 0 0 1rem 0;
    }

    .issue-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .issue-description,
    .issue-location,
    .issue-photos,
    .ai-text {
      margin-bottom: 1.5rem;
    }

    .issue-description h4,
    .issue-location h4,
    .issue-photos h4,
    .ai-text h4 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #14213D;
      margin: 0 0 0.5rem 0;
    }

    .issue-description p,
    .issue-location p {
      color: #666;
      line-height: 1.5;
      margin: 0;
    }

    .photos-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .photo-item {
      position: relative;
      cursor: pointer;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }

    .photo-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .photo-thumbnail {
      width: 80px;
      height: 80px;
      object-fit: cover;
      display: block;
    }

    .photo-quality {
      position: absolute;
      top: 4px;
      right: 4px;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
    }

    .quality-high {
      background: #28A745;
    }

    .quality-medium {
      background: #FCA311;
    }

    .quality-low {
      background: #DC3545;
    }

    .ai-text {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
    }

    .ai-confidence {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 1rem;
    }

    .ai-content p {
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }

    .ai-content strong {
      color: #14213D;
    }

    .approval-form {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
    }

    .form-actions {
      margin-bottom: 0;
    }

    .form-actions .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .admin-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .header-info h1 {
        font-size: 1.5rem;
      }

      .action-buttons {
        flex-direction: row;
        justify-content: center;
      }

      .issue-meta {
        justify-content: center;
      }

      .photos-grid {
        justify-content: center;
      }

      .form-actions .action-buttons {
        flex-direction: column;
      }
    }

    /* Table responsive */
    .ant-table-wrapper {
      overflow-x: auto;
    }

    @media (max-width: 768px) {
      .ant-table-thead > tr > th,
      .ant-table-tbody > tr > td {
        padding: 8px 4px;
        font-size: 0.85rem;
      }
    }
  `]
})
export class ApprovalInterfaceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  pendingIssues: AdminIssue[] = [];
  adminStats: AdminStats | null = null;
  departments: string[] = [];
  isLoading = false;
  isProcessing = false;

  // Modal state
  isApprovalModalVisible = false;
  selectedIssue: AdminIssue | null = null;
  approvalForm!: FormGroup;

  statIcons = {
    pending: '<span nz-icon nzType="clock-circle"></span>',
    approved: '<span nz-icon nzType="check-circle"></span>',
    rate: '<span nz-icon nzType="percentage"></span>',
    time: '<span nz-icon nzType="field-time"></span>'
  };

  constructor(
    private adminService: MockAdminService,
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
    this.adminService.getPendingIssues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (issues) => {
          this.pendingIssues = issues;
          console.log('[ADMIN] Loaded pending issues:', issues.length);
        },
        error: (error) => {
          console.error('[ADMIN] Failed to load pending issues:', error);
          this.message.error('Failed to load pending issues');
        }
      });

    // Load admin stats
    this.adminService.getAdminStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.adminStats = stats;
          console.log('[ADMIN] Loaded admin stats:', stats);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('[ADMIN] Failed to load admin stats:', error);
          this.message.error('Failed to load statistics');
          this.isLoading = false;
        }
      });

    // Load departments
    this.adminService.getDepartments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments) => {
          this.departments = departments;
        },
        error: (error) => {
          console.error('[ADMIN] Failed to load departments:', error);
        }
      });
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

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  }

  viewIssueDetails(issue: AdminIssue): void {
    console.log('[ADMIN] View issue details:', issue.id);
    // TODO: Open detailed view modal or navigate to details page
    this.openApprovalModal(issue);
  }

  openApprovalModal(issue: AdminIssue): void {
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
    const decision: ApprovalDecision = {
      issueId: this.selectedIssue.id!,
      decision: formValue.decision,
      notes: formValue.notes,
      priority: formValue.priority,
      assignedDepartment: formValue.assignedDepartment,
      publicVisibility: formValue.decision === 'approve',
      adminId: 'admin-001' // Mock admin ID
    };

    console.log('[ADMIN] Submitting approval decision:', decision);
    this.isProcessing = true;

    this.adminService.processApprovalDecision(decision)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('[ADMIN] Decision processed successfully:', result);
          
          const actionText = decision.decision === 'approve' ? 'approved' : 
                           decision.decision === 'reject' ? 'rejected' : 'updated';
          
          this.message.success(`Issue ${actionText} successfully`);
          
          // Remove processed issue from pending list
          this.pendingIssues = this.pendingIssues.filter(issue => issue.id !== decision.issueId);
          
          // Update stats
          if (this.adminStats) {
            this.adminStats.pendingReview--;
            if (decision.decision === 'approve') {
              this.adminStats.approvedToday++;
            } else if (decision.decision === 'reject') {
              this.adminStats.rejectedToday++;
            }
          }

          this.closeApprovalModal();
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('[ADMIN] Failed to process decision:', error);
          this.message.error('Failed to process decision. Please try again.');
          this.isProcessing = false;
        }
      });
  }
}