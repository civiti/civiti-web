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
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ApiService } from '../../../services/api.service';
import {
  IssueCategory,
  AIAnalysisResult
} from '../../../types/civica-api.types';

// Interface for category data from session storage
interface IssueCategoryInfo {
  id: IssueCategory;
  name: string;
  description: string;
  icon: string;
  examples: string[];
}

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
    NzAlertModule,
    NzTagModule
  ],
  templateUrl: './issue-details.component.html',
  styleUrls: ['./issue-details.component.scss']
})
export class IssueDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Issue ID - generated once and reused across saves
  private issueId: string | null = null;

  selectedCategory: IssueCategoryInfo | null = null;
  uploadedPhotos: PhotoData[] = [];
  currentLocation: { address: string; coordinates: { lat: number; lng: number }; district?: string } | null = null;
  detailsForm!: FormGroup;
  aiAnalysis: AIAnalysisResult | null = null;
  isGeneratingAI = false;

  // Track if user is editing AI content
  isEditingDescription = false;
  isEditingSolution = false;

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
      briefDescription: ['', [Validators.required, Validators.minLength(10)]],
      urgency: ['Medium'],
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
        if (issueData.briefDescription) {
          this.detailsForm.patchValue({
            briefDescription: issueData.briefDescription,
            urgency: this.normalizeUrgency(issueData.urgency),
            whenOccurred: issueData.whenOccurred || 'now'
          });
        }
        // Restore AI analysis
        if (issueData.aiAnalysis) {
          this.aiAnalysis = issueData.aiAnalysis;
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
      briefDescription: this.detailsForm.get('briefDescription')?.value,
      urgency: this.detailsForm.get('urgency')?.value,
      whenOccurred: this.detailsForm.get('whenOccurred')?.value,
      aiAnalysis: this.aiAnalysis
    };
    sessionStorage.setItem('civica_complete_issue_data', JSON.stringify(issueData));
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

    // For now, simulate AI description generation since the backend may not have this endpoint
    // TODO: Replace with actual API call when backend implements AI description
    setTimeout(() => {
      this.aiAnalysis = {
        aiGeneratedDescription: `${briefDescription} - Această problemă necesită atenția autorităților locale pentru rezolvarea rapidă și eficientă.`,
        aiProposedSolution: 'Se recomandă contactarea serviciului de urgență al primăriei pentru intervenție rapidă.',
        aiConfidence: 0.85
      };

      this.isGeneratingAI = false;
      console.log('[ISSUE DETAILS] AI analysis generated:', this.aiAnalysis);
      this.message.success('Descrierea AI a fost generată cu succes!');

      // Save to session for back navigation support
      this.saveFormToSession();
    }, 1500); // Simulate API delay
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'orange';
    return 'red';
  }

  // Inline editing methods
  editDescription(): void {
    this.isEditingDescription = true;
  }

  saveDescription(newDescription: string): void {
    if (!this.aiAnalysis) {
      return;
    }
    const trimmed = newDescription.trim();
    if (!trimmed) {
      this.message.warning('Descrierea nu poate fi goală');
      return;
    }
    this.aiAnalysis.aiGeneratedDescription = trimmed;
    this.isEditingDescription = false;
    this.saveFormToSession();
    this.message.success('Descrierea a fost actualizată');
  }

  cancelEditDescription(): void {
    this.isEditingDescription = false;
  }

  editSolution(): void {
    this.isEditingSolution = true;
  }

  saveSolution(newSolution: string): void {
    if (!this.aiAnalysis) {
      return;
    }
    const trimmed = newSolution.trim();
    if (!trimmed) {
      this.message.warning('Soluția propusă nu poate fi goală');
      return;
    }
    this.aiAnalysis.aiProposedSolution = trimmed;
    this.isEditingSolution = false;
    this.saveFormToSession();
    this.message.success('Soluția a fost actualizată');
  }

  cancelEditSolution(): void {
    this.isEditingSolution = false;
  }

  continueToReview(): void {
    if (!this.aiAnalysis) {
      this.message.warning('Vă rugăm să generați mai întâi o descriere AI');
      return;
    }

    console.log('[ISSUE DETAILS] Continuing to review...');

    // Store form data and AI analysis in session
    const issueData = {
      id: this.getOrCreateIssueId(), // Generate ID here to be used in submission
      category: this.selectedCategory,
      photos: this.uploadedPhotos,
      location: this.currentLocation,
      briefDescription: this.detailsForm.get('briefDescription')?.value,
      urgency: this.detailsForm.get('urgency')?.value,
      whenOccurred: this.detailsForm.get('whenOccurred')?.value,
      aiAnalysis: this.aiAnalysis
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
      return 'Medium';
    }
    // Map of valid urgency values (case-insensitive lookup)
    const urgencyMap: Record<string, string> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent'
    };
    const normalized = urgencyMap[value.toLowerCase()];
    return normalized || 'Medium';
  }
}