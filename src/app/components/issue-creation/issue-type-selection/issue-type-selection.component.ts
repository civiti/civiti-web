import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { AppState } from '../../../store/app.state';
import { selectIsAuthenticated } from '../../../store/auth/auth.selectors';
import { MockIssueCreationService, IssueCategory } from '../../../services/mock-issue-creation.service';

@Component({
  selector: 'app-issue-type-selection',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
    NzSpinModule,
    NzTypographyModule,
    NzAlertModule,
    NzTagModule
  ],
  template: `
    <div class="issue-type-container">
      
      <!-- Header -->
      <div class="page-header">
        <button nz-button nzType="text" nzSize="large" routerLink="/dashboard" class="back-btn">
          <span nz-icon nzType="arrow-left"></span>
          Back to Dashboard
        </button>
        <h1 class="page-title">Report a Community Issue</h1>
        <p class="page-subtitle">Choose the category that best describes your issue</p>
      </div>

      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <div class="progress-step active">
          <div class="step-number">1</div>
          <div class="step-label">Issue Type</div>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step">
          <div class="step-number">2</div>
          <div class="step-label">Photos</div>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step">
          <div class="step-number">3</div>
          <div class="step-label">Details</div>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step">
          <div class="step-number">4</div>
          <div class="step-label">Review</div>
        </div>
      </div>

      <!-- Authentication Check -->
      <nz-alert
        *ngIf="!(isAuthenticated$ | async)"
        nzMessage="Authentication Required"
        nzDescription="Please sign in to report community issues"
        nzType="warning"
        nzShowIcon
        nzCloseable
        class="auth-alert">
        <div class="auth-actions">
          <button nz-button nzType="primary" routerLink="/auth/login">Sign In</button>
          <button nz-button nzType="default" routerLink="/auth/register">Create Account</button>
        </div>
      </nz-alert>

      <!-- Category Selection -->
      <nz-spin [nzSpinning]="isLoading">
        <div class="categories-container">
        
        <div class="categories-intro">
          <h2>What type of issue are you reporting?</h2>
          <p>Select the category that best matches your community concern. This helps us route your report to the right authorities.</p>
        </div>

        <div class="categories-grid">
          <div nz-row [nzGutter]="[16, 16]">
            
            <div 
              nz-col 
              [nzSpan]="24" 
              [nzMd]="12" 
              [nzLg]="8"
              *ngFor="let category of categories"
              class="category-col">
              
              <nz-card 
                class="category-card" 
                [class.selected]="selectedCategory?.id === category.id"
                (click)="selectCategory(category)">
                
                <div class="category-content">
                  <div class="category-icon">
                    {{ category.icon }}
                  </div>
                  
                  <div class="category-info">
                    <h3 class="category-title">{{ category.name }}</h3>
                    <p class="category-description">{{ category.description }}</p>
                  </div>
                  
                  <div class="category-examples">
                    <div class="examples-label">Examples:</div>
                    <div class="examples-tags">
                      <nz-tag 
                        *ngFor="let example of category.examples.slice(0, 3)" 
                        class="example-tag">
                        {{ example }}
                      </nz-tag>
                      <nz-tag 
                        *ngIf="category.examples.length > 3" 
                        class="example-tag more-tag">
                        +{{ category.examples.length - 3 }} more
                      </nz-tag>
                    </div>
                  </div>
                  
                  <div class="selection-indicator" *ngIf="selectedCategory?.id === category.id">
                    <span nz-icon nzType="check-circle" nzTheme="fill"></span>
                    Selected
                  </div>
                  
                </div>
              </nz-card>
              
            </div>
            
          </div>
        </div>

        <!-- Current Location Display -->
        <div class="location-info" *ngIf="currentLocation">
          <nz-card class="location-card">
            <div class="location-content">
              <span nz-icon nzType="environment" class="location-icon"></span>
              <div class="location-details">
                <div class="location-label">Current Location</div>
                <div class="location-address">{{ currentLocation.address }}</div>
                <button nz-button nzType="link" nzSize="small" (click)="changeLocation()">
                  Change Location
                </button>
              </div>
            </div>
          </nz-card>
        </div>

        <!-- Continue Button -->
        <div class="continue-section">
          <button 
            nz-button 
            nzType="primary" 
            nzSize="large"
            [disabled]="!selectedCategory || !(isAuthenticated$ | async)"
            (click)="continueToPhotos()"
            class="continue-btn">
            <span>Continue to Photos</span>
            <span nz-icon nzType="arrow-right"></span>
          </button>
          
          <p class="help-text" *ngIf="!selectedCategory">
            Please select a category to continue
          </p>
          
          <div class="category-help">
            <p>Not sure which category fits your issue?</p>
            <button nz-button nzType="link" (click)="showCategoryHelp()">
              Get help choosing a category
            </button>
          </div>
        </div>

        </div>
      </nz-spin>
    </div>
  `,
  styles: [`
    .issue-type-container {
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
      margin-bottom: 3rem;
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

    .step-label {
      font-size: 0.9rem;
      color: #666;
      font-weight: 500;
    }

    .progress-step.active .step-label {
      color: #14213D;
      font-weight: 600;
    }

    .progress-line {
      flex: 1;
      height: 2px;
      background: #E5E5E5;
      margin: 0 1rem;
    }

    .auth-alert {
      max-width: 800px;
      margin: 0 auto 2rem auto;
      border-radius: 8px;
    }

    .auth-actions {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
    }

    .categories-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .categories-intro {
      text-align: center;
      margin-bottom: 3rem;
    }

    .categories-intro h2 {
      font-size: 1.8rem;
      font-weight: 600;
      color: #14213D;
      margin-bottom: 1rem;
    }

    .categories-intro p {
      font-size: 1.1rem;
      color: #666;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
    }

    .categories-grid {
      margin-bottom: 3rem;
    }

    .category-col {
      display: flex;
    }

    .category-card {
      width: 100%;
      height: 100%;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(20, 33, 61, 0.1);
    }

    .category-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(20, 33, 61, 0.15);
      border-color: #FCA311;
    }

    .category-card.selected {
      border-color: #FCA311;
      background: rgba(252, 163, 17, 0.05);
    }

    .category-content {
      padding: 1rem;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .category-icon {
      font-size: 3rem;
      text-align: center;
      margin-bottom: 1rem;
      line-height: 1;
    }

    .category-info {
      flex: 1;
      margin-bottom: 1.5rem;
    }

    .category-title {
      font-size: 1.4rem;
      font-weight: 600;
      color: #14213D;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .category-description {
      color: #666;
      font-size: 1rem;
      line-height: 1.4;
      text-align: center;
      margin-bottom: 0;
    }

    .category-examples {
      margin-bottom: 1rem;
    }

    .examples-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #14213D;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .examples-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
    }

    .example-tag {
      font-size: 0.8rem;
      background: #f0f0f0;
      border: none;
      border-radius: 4px;
    }

    .more-tag {
      background: #FCA311;
      color: white;
    }

    .selection-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #FCA311;
      font-weight: 600;
      font-size: 0.95rem;
      background: rgba(252, 163, 17, 0.1);
      padding: 0.5rem;
      border-radius: 6px;
    }

    .location-info {
      margin-bottom: 2rem;
    }

    .location-card {
      max-width: 600px;
      margin: 0 auto;
      border-radius: 8px;
    }

    .location-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .location-icon {
      font-size: 1.5rem;
      color: #FCA311;
    }

    .location-details {
      flex: 1;
    }

    .location-label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.25rem;
    }

    .location-address {
      font-size: 1rem;
      font-weight: 600;
      color: #14213D;
    }

    .continue-section {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
    }

    .continue-btn {
      background: #FCA311 !important;
      border-color: #FCA311 !important;
      color: white !important;
      font-weight: 600;
      font-size: 1.1rem;
      height: 48px;
      padding: 0 2rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .continue-btn:hover:not(:disabled) {
      background: #e8930f !important;
      border-color: #e8930f !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(252, 163, 17, 0.3);
    }

    .continue-btn:disabled {
      background: #ccc !important;
      border-color: #ccc !important;
      transform: none;
      box-shadow: none;
    }

    .help-text {
      margin-top: 1rem;
      color: #666;
      font-size: 0.95rem;
    }

    .category-help {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #f0f0f0;
    }

    .category-help p {
      margin-bottom: 0.5rem;
      color: #666;
      font-size: 0.95rem;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .issue-type-container {
        padding: 1rem;
      }

      .page-title {
        font-size: 2rem;
      }

      .page-subtitle {
        font-size: 1.1rem;
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

      .progress-indicator {
        margin-bottom: 2rem;
      }

      .step-number {
        width: 32px;
        height: 32px;
        font-size: 0.95rem;
      }

      .step-label {
        font-size: 0.8rem;
      }

      .progress-line {
        margin: 0 0.5rem;
      }

      .categories-intro h2 {
        font-size: 1.5rem;
      }

      .categories-intro p {
        font-size: 1rem;
      }

      .category-icon {
        font-size: 2.5rem;
      }

      .category-title {
        font-size: 1.2rem;
      }

      .auth-actions {
        flex-direction: column;
      }
    }

    /* Accessibility improvements */
    .category-card:focus {
      outline: 2px solid #FCA311;
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .category-card,
      .continue-btn,
      .step-number {
        transition: none;
      }
    }
  `]
})
export class IssueTypeSelectionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  categories: IssueCategory[] = [];
  selectedCategory: IssueCategory | null = null;
  isLoading = false;
  currentLocation: any = null;

  isAuthenticated$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private issueCreationService: MockIssueCreationService
  ) {
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadCurrentLocation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.isLoading = true;
    
    this.issueCreationService.getIssueCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.isLoading = false;
          console.log('[ISSUE TYPE] Categories loaded:', categories.length);
        },
        error: (error) => {
          console.error('[ISSUE TYPE] Failed to load categories:', error);
          this.isLoading = false;
        }
      });
  }

  private loadCurrentLocation(): void {
    // Mock current location - in real app would use geolocation
    this.currentLocation = {
      address: 'Strada Libertății, Sector 5, București',
      coordinates: { lat: 44.4268, lng: 26.1025 },
      accuracy: 10
    };
  }

  selectCategory(category: IssueCategory): void {
    this.selectedCategory = category;
    console.log('[ISSUE TYPE] Category selected:', category.name);
  }

  continueToPhotos(): void {
    if (!this.selectedCategory) {
      console.warn('[ISSUE TYPE] No category selected');
      return;
    }

    console.log('[ISSUE TYPE] Continuing to photos with category:', this.selectedCategory.name);
    
    // Store selected category in session storage for the creation flow
    sessionStorage.setItem('civica_selected_category', JSON.stringify(this.selectedCategory));
    sessionStorage.setItem('civica_current_location', JSON.stringify(this.currentLocation));

    this.router.navigate(['/create-issue/photo']);
  }

  changeLocation(): void {
    console.log('[ISSUE TYPE] Change location requested');
    // TODO: Implement location selection modal
    alert('Location selection will be implemented in the next phase.');
  }

  showCategoryHelp(): void {
    console.log('[ISSUE TYPE] Category help requested');
    // TODO: Show category help modal or navigate to help page
    alert('Category help guide will be implemented in the next phase.');
  }
}