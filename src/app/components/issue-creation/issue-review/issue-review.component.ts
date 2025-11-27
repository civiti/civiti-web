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
import { ApiService } from '../../../services/api.service';
import { 
  CreateIssueRequest,
  UrgencyLevel,
  IssueCategory
} from '../../../types/civica-api.types';

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
  templateUrl: './issue-review.component.html',
  styleUrls: ['./issue-review.component.scss']
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
    private apiService: ApiService
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
      'now': 'Chiar acum',
      'today': 'Mai devreme astăzi',
      'yesterday': 'Ieri',
      'this-week': 'Săptămâna aceasta',
      'longer': 'Acum mai mult de o săptămână'
    };
    return labels[when] || when;
  }

  viewPhoto(photoUrl: string): void {
    console.log('[ISSUE REVIEW] View photo:', photoUrl);
    window.open(photoUrl, '_blank');
  }

  submitIssue(): void {
    if (!this.issueData) {
      this.message.error('Nu există date despre problemă de trimis');
      return;
    }

    console.log('[ISSUE REVIEW] Submitting issue...');
    this.isSubmitting = true;

    // Prepare issue data for submission using the API format
    const issueToSubmit: CreateIssueRequest = {
      title: this.generateIssueTitle(),
      description: this.issueData.aiAnalysis?.description || this.issueData.briefDescription,
      detailedDescription: this.issueData.aiAnalysis?.suggestedSolution,
      category: this.issueData.category.id as IssueCategory,
      urgency: this.issueData.urgency as UrgencyLevel,
      county: this.issueData.location.county,
      city: this.issueData.location.city,
      district: this.issueData.location.district,
      address: this.issueData.location.address,
      latitude: this.issueData.location.coordinates?.latitude,
      longitude: this.issueData.location.coordinates?.longitude,
      photoUrls: this.issueData.photos.map((photo: any) => photo.url)
    };

    this.apiService.createIssue(issueToSubmit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('[ISSUE REVIEW] Issue submitted successfully:', result);
          
          this.isSubmitting = false;
          this.isSubmitted = true;
          
          // Award points and badge to user
          this.store.dispatch(UserActions.updatePoints({ 
            points: 50, 
            reason: 'Problemă raportată cu succes' 
          }));
          
          this.store.dispatch(UserActions.awardBadge({ 
            badgeId: 'civic-starter', 
            reason: 'Prima problemă raportată' 
          }));

          // Clear session data
          this.clearSessionData();
          
          this.message.success('Problema a fost trimisă cu succes!');
        },
        error: (error) => {
          console.error('[ISSUE REVIEW] Failed to submit issue:', error);
          this.message.error('Nu s-a putut trimite problema. Vă rugăm să încercați din nou.');
          this.isSubmitting = false;
        }
      });
  }

  private generateIssueTitle(): string {
    const category = this.issueData.category.name;
    const location = this.issueData.location.address.split(',')[0]; // Get street name
    return `Problemă de ${category} pe ${location}`;
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