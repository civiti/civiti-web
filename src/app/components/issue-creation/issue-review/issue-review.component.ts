import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AppState } from '../../../store/app.state';
import { selectAuthUser } from '../../../store/auth/auth.selectors';
import * as UserActions from '../../../store/user/user.actions';
import { 
  MockIssueCreationService, 
  IssueCreationData
} from '../../../services/mock-issue-creation.service';

@Component({
  selector: 'app-issue-review',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzTypographyModule,
    NzTagModule,
    NzResultModule,
    NzGridModule,
    NzBadgeModule
  ],
  template: `
    <div class="issue-review-container">
      
      <!-- Header -->
      <div class="page-header">
        <button nz-button nzType="text" nzSize="large" routerLink="/create-issue/details" class="back-btn">
          <span nz-icon nzType="arrow-left"></span>
          Back
        </button>
        <h1 class="page-title">Review & Submit</h1>
        <p class="page-subtitle">Review your issue report before submitting to authorities</p>
      </div>

      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <div class="progress-step completed">
          <div class="step-number">✓</div>
          <div class="step-label">Issue Type</div>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step completed">
          <div class="step-number">✓</div>
          <div class="step-label">Photos</div>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step completed">
          <div class="step-number">✓</div>
          <div class="step-label">Details</div>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step active">
          <div class="step-number">4</div>
          <div class="step-label">Review</div>
        </div>
      </div>

      <!-- Submission Success State -->
      <div class="success-section" *ngIf="isSubmitted">
        <nz-result
          nzStatus="success"
          nzTitle="Issue Submitted Successfully!"
          nzSubTitle="Your community issue report has been submitted for review. You'll receive updates as it progresses through the approval process.">
          
          <div nz-result-extra>
            <div class="success-stats">
              <div class="stat-item">
                <div class="stat-icon">🏆</div>
                <div class="stat-info">
                  <div class="stat-title">Achievement Unlocked!</div>
                  <div class="stat-description">Civic Starter Badge</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">⭐</div>
                <div class="stat-info">
                  <div class="stat-title">Points Earned</div>
                  <div class="stat-description">+50 Community Points</div>
                </div>
              </div>
            </div>

            <div class="success-actions">
              <button nz-button nzType="primary" nzSize="large" routerLink="/dashboard">
                <span nz-icon nzType="home"></span>
                Go to Dashboard
              </button>
              <button nz-button nzType="default" nzSize="large" (click)="createAnotherIssue()">
                <span nz-icon nzType="plus"></span>
                Report Another Issue
              </button>
            </div>
            
            <div class="next-steps">
              <h4>What happens next?</h4>
              <ul>
                <li>✓ Your issue will be reviewed by local administrators</li>
                <li>✓ You'll receive notifications about status updates</li>
                <li>✓ Community members can vote to support your issue</li>
                <li>✓ Authorities have 5 business days to respond</li>
              </ul>
            </div>
          </div>
          
        </nz-result>
      </div>

      <!-- Review Content (shown before submission) -->
      <nz-spin [nzSpinning]="isSubmitting">
        <div class="review-content" *ngIf="!isSubmitted && issueData">
        
        <!-- Issue Overview -->
        <nz-card nzTitle="Issue Overview" class="review-card">
          <div class="issue-overview">
            
            <div class="overview-header">
              <div class="category-display">
                <span class="category-icon">{{ issueData.category.icon }}</span>
                <div class="category-info">
                  <h3>{{ issueData.category.name }}</h3>
                  <p>{{ issueData.category.description }}</p>
                </div>
              </div>
              
              <div class="urgency-display">
                <nz-badge [nzStatus]="getUrgencyStatus(issueData.urgency)" [nzText]="issueData.urgency | titlecase"></nz-badge>
              </div>
            </div>

            <div class="brief-description">
              <h4>Your Description</h4>
              <p>{{ issueData.briefDescription }}</p>
            </div>

          </div>
        </nz-card>

        <!-- AI Generated Report -->
        <nz-card nzTitle="AI Generated Report" class="review-card" *ngIf="issueData.aiAnalysis">
          <div class="ai-report">
            
            <div class="ai-confidence">
              <nz-tag [nzColor]="getConfidenceColor(issueData.aiAnalysis.confidence)">
                {{ (issueData.aiAnalysis.confidence * 100) | number:'1.0-0' }}% AI Confidence
              </nz-tag>
            </div>

            <div class="ai-sections">
              <div class="ai-section">
                <h4>Professional Description</h4>
                <div class="ai-content">{{ issueData.aiAnalysis.description }}</div>
              </div>

              <div class="ai-section">
                <h4>Proposed Solution</h4>
                <div class="ai-content">{{ issueData.aiAnalysis.proposedSolution }}</div>
              </div>
            </div>

          </div>
        </nz-card>

        <!-- Photos Review -->
        <nz-card nzTitle="Photos" class="review-card">
          <div class="photos-review">
            <div class="photos-count">
              <nz-badge [nzCount]="issueData.photos.length" nzShowZero>
                <span nz-icon nzType="picture"></span>
              </nz-badge>
              <span>{{ issueData.photos.length }} photos attached</span>
            </div>
            
            <div class="photos-grid">
              <div nz-row [nzGutter]="[16, 16]">
                <div 
                  nz-col 
                  [nzSpan]="12" 
                  [nzSm]="8" 
                  [nzMd]="6"
                  *ngFor="let photo of issueData.photos; let i = index"
                  class="photo-col">
                  
                  <div class="photo-preview" (click)="viewPhoto(photo.url)">
                    <img [src]="photo.thumbnail || photo.url" [alt]="'Photo ' + (i + 1)" class="photo-image">
                    <div class="photo-quality" [ngClass]="'quality-' + photo.quality">
                      {{ photo.quality }}
                    </div>
                    <div class="photo-overlay">
                      <span nz-icon nzType="eye"></span>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </nz-card>

        <!-- Location & Additional Details -->
        <nz-card nzTitle="Location & Details" class="review-card">
          <div class="location-details">
            
            <div class="detail-row">
              <div class="detail-label">
                <span nz-icon nzType="environment"></span>
                Location
              </div>
              <div class="detail-value">{{ issueData.location.address }}</div>
            </div>

            <div class="detail-row">
              <div class="detail-label">
                <span nz-icon nzType="clock-circle"></span>
                When Noticed
              </div>
              <div class="detail-value">{{ getWhenLabel(issueData.whenOccurred) }}</div>
            </div>

            <div class="detail-row">
              <div class="detail-label">
                <span nz-icon nzType="flag"></span>
                Urgency Level
              </div>
              <div class="detail-value">
                <nz-badge [nzStatus]="getUrgencyStatus(issueData.urgency)" [nzText]="issueData.urgency | titlecase"></nz-badge>
              </div>
            </div>

          </div>
        </nz-card>

        <!-- Navigation -->
        <div class="navigation-section">
          <div class="nav-buttons">
            <button 
              nz-button 
              nzType="default" 
              nzSize="large"
              routerLink="/create-issue/details"
              class="nav-btn">
              <span nz-icon nzType="arrow-left"></span>
              Previous
            </button>
            
            <div class="nav-spacer"></div>
            
            <button 
              nz-button 
              nzType="primary" 
              nzSize="large"
              [disabled]="isSubmitting"
              (click)="submitIssue()"
              class="nav-btn submit-btn">
              <span nz-icon nzType="upload" *ngIf="!isSubmitting"></span>
              <span nz-icon nzType="loading" *ngIf="isSubmitting"></span>
              {{ isSubmitting ? 'Submitting...' : 'Submit Issue' }}
            </button>
          </div>
          
          <div class="submission-note">
            <p>By submitting this issue, you agree that the information provided is accurate and you consent to sharing this report with local authorities for resolution.</p>
          </div>
        </div>

        </div>
      </nz-spin>
    </div>
  `,
  styles: [`
    .issue-review-container {
      min-height: 100vh;
      background: #f5f5f5;
      padding: 1.5rem;
    }

    .page-header {
      text-align: center;
      margin-bottom: 2rem;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }

    .back-btn {
      position: absolute;
      left: 1rem;
      top: 1rem;
      color: #14213D;
      font-weight: 600;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #14213D;
      margin-bottom: 0.5rem;
    }

    .page-subtitle {
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 0;
      line-height: 1.4;
    }

    .progress-indicator {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #E5E5E5;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.1rem;
      transition: all 0.3s ease;
    }

    .progress-step.active .step-number {
      background: #FCA311;
      color: white;
    }

    .progress-step.completed .step-number {
      background: #28A745;
      color: white;
    }

    .step-label {
      font-size: 0.9rem;
      color: #666;
      font-weight: 500;
    }

    .progress-step.active .step-label,
    .progress-step.completed .step-label {
      color: #14213D;
      font-weight: 600;
    }

    .progress-line {
      flex: 1;
      height: 2px;
      background: #E5E5E5;
      margin: 0 1rem;
    }

    .success-section {
      max-width: 800px;
      margin: 0 auto;
    }

    .success-stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #f8f9fa;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      border: 2px solid #FCA311;
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-title {
      font-weight: 600;
      color: #14213D;
      margin-bottom: 0.25rem;
    }

    .stat-description {
      color: #666;
      font-size: 0.9rem;
    }

    .success-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .next-steps {
      background: #f0f8ff;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e6f3ff;
    }

    .next-steps h4 {
      color: #14213D;
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }

    .next-steps ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .next-steps li {
      margin-bottom: 0.5rem;
      color: #333;
      font-size: 0.95rem;
    }

    .review-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .review-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(20, 33, 61, 0.1);
      margin-bottom: 2rem;
    }

    .issue-overview {
      margin-bottom: 1rem;
    }

    .overview-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .category-display {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .category-icon {
      font-size: 3rem;
    }

    .category-info h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #14213D;
      margin: 0 0 0.25rem 0;
    }

    .category-info p {
      color: #666;
      margin: 0;
    }

    .brief-description {
      margin-bottom: 0;
    }

    .brief-description h4 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #14213D;
      margin: 0 0 0.75rem 0;
    }

    .brief-description p {
      color: #333;
      line-height: 1.6;
      margin: 0;
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #FCA311;
    }

    .ai-report {
      margin-bottom: 1rem;
    }

    .ai-confidence {
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .ai-sections {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .ai-section h4 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #14213D;
      margin: 0 0 0.75rem 0;
    }

    .ai-content {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      line-height: 1.6;
      color: #333;
      border-left: 4px solid #28A745;
    }

    .photos-review {
      margin-bottom: 1rem;
    }

    .photos-count {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      font-weight: 600;
      color: #14213D;
    }

    .photos-grid {
      margin-bottom: 0;
    }

    .photo-preview {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .photo-preview:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .photo-image {
      width: 100%;
      height: 120px;
      object-fit: cover;
      display: block;
    }

    .photo-quality {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
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

    .photo-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      color: white;
      font-size: 1.5rem;
    }

    .photo-preview:hover .photo-overlay {
      opacity: 1;
    }

    .location-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .detail-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #14213D;
      min-width: 140px;
    }

    .detail-value {
      flex: 1;
      color: #333;
    }

    .navigation-section {
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
    }

    .nav-buttons {
      display: flex;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .nav-spacer {
      flex: 1;
    }

    .nav-btn {
      font-weight: 600;
      height: 40px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .submit-btn {
      background: #28A745 !important;
      border-color: #28A745 !important;
      color: white !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 1.1rem;
      height: 48px;
      padding: 0 2rem;
    }

    .submit-btn:hover:not(:disabled) {
      background: #218838 !important;
      border-color: #218838 !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(40, 167, 69, 0.3);
    }

    .submit-btn:disabled {
      background: #ccc !important;
      border-color: #ccc !important;
      transform: none;
      box-shadow: none;
    }

    .submission-note {
      text-align: center;
    }

    .submission-note p {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
      margin: 0;
      max-width: 600px;
      margin: 0 auto;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .issue-review-container {
        padding: 1rem;
      }

      .page-title {
        font-size: 2rem;
      }

      .back-btn {
        position: relative;
        left: auto;
        top: auto;
        margin-bottom: 1rem;
      }

      .page-header {
        text-align: left;
      }

      .overview-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .category-display {
        width: 100%;
      }

      .success-stats {
        flex-direction: column;
        gap: 1rem;
      }

      .success-actions {
        flex-direction: column;
      }

      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .detail-label {
        min-width: auto;
      }

      .photo-image {
        height: 100px;
      }
    }
  `]
})
export class IssueReviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  issueData: any = null;
  isSubmitting = false;
  isSubmitted = false;

  constructor(
    private router: Router,
    private message: NzMessageService,
    private store: Store<AppState>,
    private issueCreationService: MockIssueCreationService
  ) {}

  ngOnInit(): void {
    this.loadCompleteIssueData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCompleteIssueData(): void {
    const issueDataString = sessionStorage.getItem('civica_complete_issue_data');
    if (issueDataString) {
      this.issueData = JSON.parse(issueDataString);
      console.log('[ISSUE REVIEW] Loaded complete issue data:', this.issueData);
    } else {
      console.warn('[ISSUE REVIEW] No complete issue data found, redirecting...');
      this.router.navigate(['/create-issue']);
    }
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

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'orange';
    return 'red';
  }

  getWhenLabel(when: string): string {
    const labels: { [key: string]: string } = {
      'now': 'Right now',
      'today': 'Earlier today',
      'yesterday': 'Yesterday',
      'this-week': 'This week',
      'longer': 'More than a week ago'
    };
    return labels[when] || when;
  }

  viewPhoto(photoUrl: string): void {
    console.log('[ISSUE REVIEW] View photo:', photoUrl);
    window.open(photoUrl, '_blank');
  }

  submitIssue(): void {
    if (!this.issueData) {
      this.message.error('No issue data to submit');
      return;
    }

    console.log('[ISSUE REVIEW] Submitting issue...');
    this.isSubmitting = true;

    // Prepare issue data for submission
    const issueToSubmit: IssueCreationData = {
      title: this.generateIssueTitle(),
      description: this.issueData.aiAnalysis?.description || this.issueData.briefDescription,
      category: this.issueData.category,
      photos: this.issueData.photos,
      location: this.issueData.location,
      urgency: this.issueData.urgency,
      status: 'draft',
      aiGeneratedText: this.issueData.aiAnalysis,
      additionalDetails: {
        whenOccurred: this.getWhenLabel(this.issueData.whenOccurred),
        affectedPeople: 0, // Mock value
        previousReports: false // Mock value
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-001' // Mock user ID
    };

    this.issueCreationService.submitIssue(issueToSubmit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('[ISSUE REVIEW] Issue submitted successfully:', result);
          
          this.isSubmitting = false;
          this.isSubmitted = true;
          
          // Award points and badge to user
          this.store.dispatch(UserActions.updatePoints({ 
            points: 50, 
            reason: 'Issue reported successfully' 
          }));
          
          this.store.dispatch(UserActions.awardBadge({ 
            badgeId: 'civic-starter', 
            reason: 'First issue reported' 
          }));

          // Clear session data
          this.clearSessionData();
          
          this.message.success('Issue submitted successfully!');
        },
        error: (error) => {
          console.error('[ISSUE REVIEW] Failed to submit issue:', error);
          this.message.error('Failed to submit issue. Please try again.');
          this.isSubmitting = false;
        }
      });
  }

  private generateIssueTitle(): string {
    const category = this.issueData.category.name;
    const location = this.issueData.location.address.split(',')[0]; // Get street name
    return `${category} issue on ${location}`;
  }

  private clearSessionData(): void {
    sessionStorage.removeItem('civica_selected_category');
    sessionStorage.removeItem('civica_uploaded_photos');
    sessionStorage.removeItem('civica_current_location');
    sessionStorage.removeItem('civica_complete_issue_data');
  }

  createAnotherIssue(): void {
    console.log('[ISSUE REVIEW] Create another issue');
    this.clearSessionData();
    this.router.navigate(['/create-issue']);
  }
}