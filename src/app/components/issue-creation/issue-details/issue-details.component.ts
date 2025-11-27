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

import { ApiService } from '../../../services/api.service';
import {
  IssueCategory,
  AIAnalysisResult
} from '../../../types/civica-api.types';

// Keep local interfaces for component data
interface PhotoData {
  id: string;
  file: File;
  url: string;
  description?: string;
}



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
  templateUrl: './issue-details.component.html',
  styleUrls: ['./issue-details.component.scss']
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

    // For now, simulate AI description generation since the backend may not have this endpoint
    // This should be replaced with actual API call when backend implements AI description
    setTimeout(() => {
      this.aiAnalysis = {
        aiGeneratedDescription: `${briefDescription} - Această problemă necesită atenția autorităților locale pentru rezolvarea rapidă și eficientă.`,
        aiProposedSolution: 'Se recomandă contactarea serviciului de urgență al primăriei pentru intervenție rapidă.',
        aiConfidence: 0.85
      };

      this.isGeneratingAI = false;
      console.log('[ISSUE DETAILS] AI analysis generated:', this.aiAnalysis);
      this.message.success('Descrierea AI a fost generată cu succes!');
    }, 1500); // Simulate API delay
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'orange';
    return 'red';
  }

  editDescription(): void {
    console.log('[ISSUE DETAILS] Edit description requested');
    // TODO: Open modal with editable description
    this.message.info('Editarea descrierii va fi implementată în următoarea fază.');
  }

  editSolution(): void {
    console.log('[ISSUE DETAILS] Edit solution requested');
    // TODO: Open modal with editable solution
    this.message.info('Editarea soluției va fi implementată în următoarea fază.');
  }

  continueToReview(): void {
    if (!this.aiAnalysis) {
      this.message.warning('Vă rugăm să generați mai întâi o descriere AI');
      return;
    }

    console.log('[ISSUE DETAILS] Continuing to review...');

    // Store form data and AI analysis in session
    const issueData = {
      id: this.generateIssueId(), // Generate ID here to be used in submission
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

  private generateIssueId(): string {
    return 'issue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  }
}