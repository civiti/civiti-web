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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';

import { 
  MockIssueCreationService, 
  IssueCategory, 
  PhotoData, 
  AIAnalysisResult 
} from '../../../services/mock-issue-creation.service';

@Component({
  selector: 'app-issue-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzTypographyModule,
    NzAlertModule,
    NzTagModule
  ],
  template: `
    <div class="issue-details-container">
      
      <!-- Header -->
      <div class="page-header">
        <button nz-button nzType="text" nzSize="large" routerLink="/create-issue/photo" class="back-btn">
          <span nz-icon nzType="arrow-left"></span>
          Back
        </button>
        <h1 class="page-title">Issue Details</h1>
        <p class="page-subtitle">Provide additional information and let AI help create a comprehensive report</p>
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
        <div class="progress-step active">
          <div class="step-number">3</div>
          <div class="step-label">Details</div>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step">
          <div class="step-number">4</div>
          <div class="step-label">Review</div>
        </div>
      </div>

      <!-- Summary of Previous Steps -->
      <div class="summary-section">
        <nz-card nzTitle="Issue Summary" class="summary-card">
          <div class="summary-content">
            
            <div class="summary-item" *ngIf="selectedCategory">
              <div class="summary-label">Category</div>
              <div class="summary-value">
                <span class="category-icon">{{ selectedCategory.icon }}</span>
                {{ selectedCategory.name }}
              </div>
            </div>

            <div class="summary-item" *ngIf="uploadedPhotos.length > 0">
              <div class="summary-label">Photos</div>
              <div class="summary-value">
                <nz-tag nzColor="blue">{{ uploadedPhotos.length }} photos uploaded</nz-tag>
              </div>
            </div>

            <div class="summary-item" *ngIf="currentLocation">
              <div class="summary-label">Location</div>
              <div class="summary-value">{{ currentLocation.address }}</div>
            </div>

          </div>
        </nz-card>
      </div>

      <!-- Details Form -->
      <nz-spin [nzSpinning]="isGeneratingAI">
        <div class="details-form-section">
        <nz-card nzTitle="Issue Details" class="details-card">
          
          <form nz-form [formGroup]="detailsForm" (ngSubmit)="generateAIDescription()">
            
            <!-- Brief Description -->
            <nz-form-item>
              <nz-form-label [nzSpan]="24" nzFor="briefDescription" nzRequired>
                Brief Description
              </nz-form-label>
              <nz-form-control [nzSpan]="24" nzErrorTip="Please describe the issue briefly">
                <textarea
                  nz-input
                  formControlName="briefDescription"
                  id="briefDescription"
                  rows="3"
                  placeholder="Briefly describe what you see and what the problem is..."
                  maxlength="500">
                </textarea>
                <div class="char-count">{{ detailsForm.get('briefDescription')?.value?.length || 0 }}/500</div>
              </nz-form-control>
            </nz-form-item>

            <!-- Urgency Level -->
            <nz-form-item>
              <nz-form-label [nzSpan]="24" nzFor="urgency">Urgency Level</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select formControlName="urgency" id="urgency" nzPlaceHolder="How urgent is this issue?">
                  <nz-option nzValue="low" nzLabel="Low - Can wait for routine maintenance"></nz-option>
                  <nz-option nzValue="medium" nzLabel="Medium - Should be addressed soon"></nz-option>
                  <nz-option nzValue="high" nzLabel="High - Needs prompt attention"></nz-option>
                  <nz-option nzValue="urgent" nzLabel="Urgent - Safety hazard or emergency"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <!-- When Did This Happen -->
            <nz-form-item>
              <nz-form-label [nzSpan]="24" nzFor="whenOccurred">When did you notice this?</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select formControlName="whenOccurred" id="whenOccurred">
                  <nz-option nzValue="now" nzLabel="Right now"></nz-option>
                  <nz-option nzValue="today" nzLabel="Earlier today"></nz-option>
                  <nz-option nzValue="yesterday" nzLabel="Yesterday"></nz-option>
                  <nz-option nzValue="this-week" nzLabel="This week"></nz-option>
                  <nz-option nzValue="longer" nzLabel="Longer than a week"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <!-- Generate AI Description Button -->
            <nz-form-item class="generate-section">
              <nz-form-control [nzSpan]="24">
                <nz-alert
                  nzMessage="AI Assistant Ready"
                  nzDescription="Click below to generate a professional description and proposed solution based on your photos and description."
                  nzType="info"
                  nzShowIcon
                  class="ai-info-alert">
                </nz-alert>
                
                <button 
                  nz-button 
                  nzType="primary" 
                  type="submit"
                  [disabled]="!detailsForm.get('briefDescription')?.value || isGeneratingAI"
                  class="generate-btn">
                  <span nz-icon nzType="robot" *ngIf="!isGeneratingAI"></span>
                  <span nz-icon nzType="loading" *ngIf="isGeneratingAI"></span>
                  {{ isGeneratingAI ? 'Generating...' : 'Generate AI Description' }}
                </button>
              </nz-form-control>
            </nz-form-item>

          </form>

        </nz-card>
      </div>

      <!-- AI Generated Content -->
      <div class="ai-content-section" *ngIf="aiAnalysis">
        <nz-card nzTitle="AI Generated Report" class="ai-content-card">
          
          <div class="ai-confidence">
            <nz-tag [nzColor]="getConfidenceColor(aiAnalysis.confidence)">
              {{ (aiAnalysis.confidence * 100) | number:'1.0-0' }}% Confidence
            </nz-tag>
          </div>

          <div class="ai-content">
            
            <div class="ai-section">
              <h4>Professional Description</h4>
              <div class="ai-text" [innerHTML]="aiAnalysis.description"></div>
              <button nz-button nzType="link" nzSize="small" (click)="editDescription()">
                <span nz-icon nzType="edit"></span>
                Edit Description
              </button>
            </div>

            <div class="ai-section">
              <h4>Proposed Solution</h4>
              <div class="ai-text" [innerHTML]="aiAnalysis.proposedSolution"></div>
              <button nz-button nzType="link" nzSize="small" (click)="editSolution()">
                <span nz-icon nzType="edit"></span>
                Edit Solution
              </button>
            </div>

            <div class="ai-extracted-details" *ngIf="aiAnalysis.extractedDetails">
              <h4>AI Analysis</h4>
              <div class="details-grid">
                <div class="detail-item" *ngIf="aiAnalysis.extractedDetails.estimatedCost">
                  <div class="detail-label">Estimated Cost</div>
                  <div class="detail-value">{{ aiAnalysis.extractedDetails.estimatedCost }}</div>
                </div>
                <div class="detail-item" *ngIf="aiAnalysis.extractedDetails.timeToResolve">
                  <div class="detail-label">Time to Resolve</div>
                  <div class="detail-value">{{ aiAnalysis.extractedDetails.timeToResolve }}</div>
                </div>
                <div class="detail-item" *ngIf="aiAnalysis.extractedDetails.affectedArea">
                  <div class="detail-label">Affected Area</div>
                  <div class="detail-value">{{ aiAnalysis.extractedDetails.affectedArea }}</div>
                </div>
              </div>
            </div>

          </div>

        </nz-card>
      </div>

      <!-- Navigation -->
      <div class="navigation-section">
        <div class="nav-buttons">
          <button 
            nz-button 
            nzType="default" 
            nzSize="large"
            routerLink="/create-issue/photo"
            class="nav-btn">
            <span nz-icon nzType="arrow-left"></span>
            Previous
          </button>
          
          <div class="nav-spacer"></div>
          
          <button 
            nz-button 
            nzType="primary" 
            nzSize="large"
            [disabled]="!aiAnalysis"
            (click)="continueToReview()"
            class="nav-btn continue-btn">
            Continue to Review
            <span nz-icon nzType="arrow-right"></span>
          </button>
        </div>
        
        <div class="requirement-note" *ngIf="!aiAnalysis">
          <p>Please generate an AI description to continue</p>
        </div>
        </div>
      </nz-spin>

    </div>
  `,
  styles: [`
    .issue-details-container {
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

    .summary-section {
      max-width: 800px;
      margin: 0 auto 2rem auto;
    }

    .summary-card,
    .details-card,
    .ai-content-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(20, 33, 61, 0.1);
    }

    .summary-content {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
    }

    .summary-item {
      flex: 1;
      min-width: 200px;
    }

    .summary-label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.25rem;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .summary-value {
      font-size: 1rem;
      color: #14213D;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .category-icon {
      font-size: 1.2rem;
    }

    .details-form-section {
      max-width: 800px;
      margin: 0 auto 2rem auto;
    }

    .char-count {
      text-align: right;
      font-size: 0.8rem;
      color: #999;
      margin-top: 0.25rem;
    }

    .generate-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #f0f0f0;
    }

    .ai-info-alert {
      margin-bottom: 1rem;
      border-radius: 8px;
    }

    .generate-btn {
      background: #FCA311 !important;
      border-color: #FCA311 !important;
      color: white !important;
      font-weight: 600;
      font-size: 1.1rem;
      height: 48px;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .generate-btn:hover:not(:disabled) {
      background: #e8930f !important;
      border-color: #e8930f !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(252, 163, 17, 0.3);
    }

    .generate-btn:disabled {
      background: #ccc !important;
      border-color: #ccc !important;
      transform: none;
      box-shadow: none;
    }

    .ai-content-section {
      max-width: 800px;
      margin: 0 auto 2rem auto;
    }

    .ai-confidence {
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .ai-content {
      margin-bottom: 1rem;
    }

    .ai-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .ai-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .ai-section h4 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #14213D;
      margin: 0 0 1rem 0;
    }

    .ai-text {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      line-height: 1.6;
      color: #333;
      margin-bottom: 0.5rem;
      border-left: 4px solid #FCA311;
    }

    .ai-extracted-details {
      background: #f0f8ff;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e6f3ff;
    }

    .ai-extracted-details h4 {
      color: #14213D;
      margin-bottom: 1rem;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .detail-item {
      background: white;
      padding: 1rem;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .detail-label {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 0.25rem;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 1rem;
      font-weight: 600;
      color: #14213D;
    }

    .navigation-section {
      max-width: 800px;
      margin: 0 auto;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
    }

    .nav-buttons {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
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

    .continue-btn {
      background: #FCA311 !important;
      border-color: #FCA311 !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .continue-btn:hover:not(:disabled) {
      background: #e8930f !important;
      border-color: #e8930f !important;
    }

    .continue-btn:disabled {
      background: #ccc !important;
      border-color: #ccc !important;
    }

    .requirement-note {
      text-align: center;
    }

    .requirement-note p {
      color: #666;
      font-size: 0.95rem;
      margin: 0;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .issue-details-container {
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

      .summary-content {
        flex-direction: column;
        gap: 1rem;
      }

      .summary-item {
        min-width: auto;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Form styling */
    .ant-input:focus,
    .ant-select-focused .ant-select-selector {
      border-color: #FCA311;
      box-shadow: 0 0 0 2px rgba(252, 163, 17, 0.2);
    }

    .ant-form-item-has-error .ant-input,
    .ant-form-item-has-error .ant-select-selector {
      border-color: #DC3545;
    }
  `]
})
export class IssueDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedCategory: IssueCategory | null = null;
  uploadedPhotos: PhotoData[] = [];
  currentLocation: any = null;
  detailsForm!: FormGroup;
  aiAnalysis: AIAnalysisResult | null = null;
  isGeneratingAI = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private message: NzMessageService,
    private issueCreationService: MockIssueCreationService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadSessionData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.detailsForm = this.fb.group({
      briefDescription: ['', [Validators.required, Validators.minLength(10)]],
      urgency: ['medium'],
      whenOccurred: ['now']
    });
  }

  private loadSessionData(): void {
    // Load category
    const categoryData = sessionStorage.getItem('civica_selected_category');
    if (categoryData) {
      this.selectedCategory = JSON.parse(categoryData);
    }

    // Load photos
    const photosData = sessionStorage.getItem('civica_uploaded_photos');
    if (photosData) {
      this.uploadedPhotos = JSON.parse(photosData);
    }

    // Load location
    const locationData = sessionStorage.getItem('civica_current_location');
    if (locationData) {
      this.currentLocation = JSON.parse(locationData);
    }

    // Validate we have required data
    if (!this.selectedCategory || !this.uploadedPhotos.length) {
      console.warn('[ISSUE DETAILS] Missing required data, redirecting...');
      this.router.navigate(['/create-issue']);
    }
  }

  generateAIDescription(): void {
    if (!this.detailsForm.valid) {
      Object.keys(this.detailsForm.controls).forEach(key => {
        this.detailsForm.get(key)?.markAsTouched();
      });
      return;
    }

    const briefDescription = this.detailsForm.get('briefDescription')?.value;
    console.log('[ISSUE DETAILS] Generating AI description...', briefDescription);

    this.isGeneratingAI = true;

    this.issueCreationService.generateAIDescription(
      this.uploadedPhotos,
      briefDescription,
      this.selectedCategory!
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (analysis) => {
        this.aiAnalysis = analysis;
        this.isGeneratingAI = false;
        console.log('[ISSUE DETAILS] AI analysis generated:', analysis);
        this.message.success('AI description generated successfully!');
      },
      error: (error) => {
        console.error('[ISSUE DETAILS] Failed to generate AI description:', error);
        this.message.error('Failed to generate AI description. Please try again.');
        this.isGeneratingAI = false;
      }
    });
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'orange';
    return 'red';
  }

  editDescription(): void {
    console.log('[ISSUE DETAILS] Edit description requested');
    // TODO: Open modal with editable description
    this.message.info('Description editing will be implemented in the next phase.');
  }

  editSolution(): void {
    console.log('[ISSUE DETAILS] Edit solution requested');
    // TODO: Open modal with editable solution
    this.message.info('Solution editing will be implemented in the next phase.');
  }

  continueToReview(): void {
    if (!this.aiAnalysis) {
      this.message.warning('Please generate an AI description first');
      return;
    }

    console.log('[ISSUE DETAILS] Continuing to review...');
    
    // Store form data and AI analysis in session
    const issueData = {
      category: this.selectedCategory,
      photos: this.uploadedPhotos,
      location: this.currentLocation,
      briefDescription: this.detailsForm.get('briefDescription')?.value,
      urgency: this.detailsForm.get('urgency')?.value,
      whenOccurred: this.detailsForm.get('whenOccurred')?.value,
      aiAnalysis: this.aiAnalysis
    };

    sessionStorage.setItem('civica_complete_issue_data', JSON.stringify(issueData));
    
    this.router.navigate(['/create-issue/review']);
  }
}