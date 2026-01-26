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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';

import { EnhanceTextRequest, URGENCY_OPTIONS } from '../../../types/civica-api.types';
import { ApiService } from '../../../services/api.service';
import { CategoryInfo } from '../../../services/category.service';

// Interface for photo data from session storage
interface PhotoData {
  id: string;
  url: string;
  thumbnail: string;
  storagePath: string;
  quality: 'low' | 'medium' | 'high';
  timestamp: Date;
  metadata: {
    size: number;
    dimensions: { width: number; height: number };
    format: string;
  };
}



@Component({
  selector: 'app-issue-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzTypographyModule,
    NzTagModule
  ],
  templateUrl: './issue-details.component.html',
  styleUrls: ['./issue-details.component.scss']
})
export class IssueDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Issue ID - generated once and reused across saves
  private issueId: string | null = null;

  // Centralized urgency options for dropdown
  readonly urgencyOptions = URGENCY_OPTIONS;

  selectedCategory: CategoryInfo | null = null;
  uploadedPhotos: PhotoData[] = [];
  currentLocation: { address: string; coordinates: { lat: number; lng: number }; district?: string } | null = null;
  detailsForm!: FormGroup;
  isEnhancingAI = false;
  isAIEnhanced = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private message: NzMessageService,
    private apiService: ApiService
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
      description: ['', [Validators.required, Validators.minLength(10)]],
      desiredOutcome: ['', [Validators.required, Validators.minLength(10)]],
      communityImpact: ['', [Validators.required, Validators.minLength(10)]],
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

    // Restore form data if returning from a later step
    const completeIssueData = sessionStorage.getItem('civica_complete_issue_data');
    if (completeIssueData) {
      try {
        const issueData = JSON.parse(completeIssueData);
        // Restore issue ID to maintain consistency across saves
        if (issueData.id) {
          this.issueId = issueData.id;
        }
        // Restore form fields
        if (issueData.description) {
          this.detailsForm.patchValue({
            description: issueData.description,
            desiredOutcome: issueData.desiredOutcome || '',
            communityImpact: issueData.communityImpact || '',
            urgency: this.normalizeUrgency(issueData.urgency),
            whenOccurred: issueData.whenOccurred || 'now'
          });
        }
        // Restore AI enhanced flag
        if (issueData.isAIEnhanced) {
          this.isAIEnhanced = issueData.isAIEnhanced;
        }
        console.log('[ISSUE DETAILS] Restored form data from session, ID:', this.issueId);
      } catch (e) {
        console.warn('[ISSUE DETAILS] Failed to parse saved issue data:', e);
      }
    }

    // Validate we have required data
    if (!this.selectedCategory || !this.uploadedPhotos.length) {
      console.warn('[ISSUE DETAILS] Missing required data, redirecting...');
      this.router.navigate(['/create-issue']);
    }
  }

  /**
   * Save form data to sessionStorage for back navigation support
   */
  private saveFormToSession(): void {
    const issueData = {
      id: this.getOrCreateIssueId(),
      category: this.selectedCategory,
      photos: this.uploadedPhotos,
      location: this.currentLocation,
      description: this.detailsForm.get('description')?.value,
      desiredOutcome: this.detailsForm.get('desiredOutcome')?.value,
      communityImpact: this.detailsForm.get('communityImpact')?.value,
      urgency: this.detailsForm.get('urgency')?.value,
      whenOccurred: this.detailsForm.get('whenOccurred')?.value,
      isAIEnhanced: this.isAIEnhanced
    };
    sessionStorage.setItem('civica_complete_issue_data', JSON.stringify(issueData));
  }

  enhanceWithAI(): void {
    if (!this.detailsForm.valid) {
      Object.keys(this.detailsForm.controls).forEach(key => {
        this.detailsForm.get(key)?.markAsTouched();
      });
      this.message.warning('Te rugăm să completezi toate câmpurile obligatorii');
      return;
    }

    const request: EnhanceTextRequest = {
      description: this.detailsForm.get('description')?.value,
      desiredOutcome: this.detailsForm.get('desiredOutcome')?.value,
      communityImpact: this.detailsForm.get('communityImpact')?.value,
      category: this.selectedCategory?.id || '',
      location: this.currentLocation?.address
    };

    console.log('[ISSUE DETAILS] Enhancing text with AI...');
    this.isEnhancingAI = true;

    this.apiService.enhanceIssueText(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.detailsForm.patchValue({
            description: response.enhancedDescription,
            desiredOutcome: response.enhancedDesiredOutcome,
            communityImpact: response.enhancedCommunityImpact
          });
          this.isEnhancingAI = false;
          this.isAIEnhanced = true;
          console.log('[ISSUE DETAILS] Text enhanced with AI');
          this.message.success('Textul a fost îmbunătățit cu succes!');
          this.saveFormToSession();
        },
        error: (error) => {
          console.error('[ISSUE DETAILS] AI enhancement failed:', error);
          this.isEnhancingAI = false;
          this.message.error('Nu s-a putut îmbunătăți textul. Încercați din nou.');
        }
      });
  }

  continueToReview(): void {
    if (!this.detailsForm.valid) {
      Object.keys(this.detailsForm.controls).forEach(key => {
        this.detailsForm.get(key)?.markAsTouched();
      });
      this.message.warning('Te rugăm să completezi toate câmpurile obligatorii');
      return;
    }

    console.log('[ISSUE DETAILS] Continuing to authorities...');

    // Store form data in session
    const issueData = {
      id: this.getOrCreateIssueId(),
      category: this.selectedCategory,
      photos: this.uploadedPhotos,
      location: this.currentLocation,
      description: this.detailsForm.get('description')?.value,
      desiredOutcome: this.detailsForm.get('desiredOutcome')?.value,
      communityImpact: this.detailsForm.get('communityImpact')?.value,
      urgency: this.detailsForm.get('urgency')?.value,
      whenOccurred: this.detailsForm.get('whenOccurred')?.value,
      isAIEnhanced: this.isAIEnhanced
    };

    sessionStorage.setItem('civica_complete_issue_data', JSON.stringify(issueData));

    this.router.navigate(['/create-issue/authorities']);
  }

  /**
   * Get existing issue ID or create a new one.
   * Ensures the same ID is used throughout the issue creation flow.
   */
  private getOrCreateIssueId(): string {
    if (!this.issueId) {
      this.issueId = 'issue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }
    return this.issueId;
  }

  /**
   * Normalize urgency value to match expected capitalized format.
   * Handles legacy lowercase values from old session data.
   */
  private normalizeUrgency(value: string | undefined): string {
    if (!value) {
      return 'medium';
    }
    const validValues = ['low', 'medium', 'high', 'urgent'];
    const normalized = value.toLowerCase();
    return validValues.includes(normalized) ? normalized : 'medium';
  }
}