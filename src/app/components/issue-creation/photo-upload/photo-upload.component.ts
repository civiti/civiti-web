import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzGridModule } from 'ng-zorro-antd/grid';

import { MockIssueCreationService, IssueCategory, PhotoData } from '../../../services/mock-issue-creation.service';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzUploadModule,
    NzSpinModule,
    NzTypographyModule,
    NzAlertModule,
    NzGridModule
  ],
  template: `
    <div class="photo-upload-container">
      
      <!-- Header -->
      <div class="page-header">
        <button nz-button nzType="text" nzSize="large" routerLink="/create-issue" class="back-btn">
          <span nz-icon nzType="arrow-left"></span>
          Back
        </button>
        <h1 class="page-title">Document the Issue</h1>
        <p class="page-subtitle">Take or upload photos to help authorities understand the problem</p>
      </div>

      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <div class="progress-step completed">
          <div class="step-number">✓</div>
          <div class="step-label">Issue Type</div>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step active">
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

      <!-- Selected Category Info -->
      <div class="category-info" *ngIf="selectedCategory">
        <nz-card class="category-card">
          <div class="category-summary">
            <span class="category-icon">{{ selectedCategory.icon }}</span>
            <div class="category-details">
              <h3>{{ selectedCategory.name }}</h3>
              <p>{{ selectedCategory.description }}</p>
            </div>
          </div>
        </nz-card>
      </div>

      <!-- Photo Upload Section -->
      <div class="upload-section">
        <nz-card nzTitle="Add Photos" class="upload-card">
          
          <!-- Photo Tips -->
          <div class="photo-tips">
            <nz-alert
              nzMessage="Tips for Better Photos"
              nzType="info"
              nzShowIcon
              nzCloseable="false"
              class="tips-alert">
              <div class="tips-content">
                <ul class="tips-list">
                  <li>📸 Get close to show details clearly</li>
                  <li>🌅 Take photos in good lighting if possible</li>
                  <li>📏 Include surrounding context for perspective</li>
                  <li>🔄 Multiple angles help tell the story</li>
                </ul>
              </div>
            </nz-alert>
          </div>

          <!-- Upload Area -->
          <nz-spin [nzSpinning]="isUploading">
            <div class="upload-area">
            
            <!-- File Input (Mock Implementation) -->
            <div class="mock-upload-area" (click)="triggerFileInput()">
              <div class="upload-icon">
                <span nz-icon nzType="camera" nzTheme="outline"></span>
              </div>
              <div class="upload-text">
                <h4>Take or Upload Photos</h4>
                <p>Click to open camera or select from gallery</p>
                <p class="upload-note">Maximum 5 photos, up to 10MB each</p>
              </div>
            </div>

            <input 
              #fileInput 
              type="file" 
              accept="image/*" 
              multiple 
              capture="environment"
              style="display: none;"
              (change)="onFileSelected($event)">

          </div>

          <!-- Photo Preview Grid -->
          <div class="photo-grid" *ngIf="uploadedPhotos.length > 0">
            <div class="photo-count">
              <span>{{ uploadedPhotos.length }}/5 photos uploaded</span>
            </div>
            
            <div nz-row [nzGutter]="[16, 16]">
              <div 
                nz-col 
                [nzSpan]="12" 
                [nzSm]="8" 
                [nzMd]="6"
                *ngFor="let photo of uploadedPhotos; let i = index"
                class="photo-col">
                
                <div class="photo-preview">
                  <img [src]="photo.url" [alt]="'Photo ' + (i + 1)" class="photo-image">
                  
                  <div class="photo-overlay">
                    <div class="photo-actions">
                      <button 
                        nz-button 
                        nzType="primary" 
                        nzSize="small" 
                        nzShape="circle"
                        (click)="viewPhoto(photo)">
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button 
                        nz-button 
                        nzType="primary" 
                        nzDanger 
                        nzSize="small" 
                        nzShape="circle"
                        (click)="removePhoto(i)">
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </div>

                  <div class="photo-quality" [ngClass]="'quality-' + photo.quality">
                    {{ getQualityLabel(photo.quality) }}
                  </div>
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
            routerLink="/create-issue"
            class="nav-btn">
            <span nz-icon nzType="arrow-left"></span>
            Previous
          </button>
          
          <div class="nav-spacer"></div>
          
          <button 
            nz-button 
            nzType="primary" 
            nzSize="large"
            [disabled]="uploadedPhotos.length === 0"
            (click)="continueToDetails()"
            class="nav-btn continue-btn">
            Continue to Details
            <span nz-icon nzType="arrow-right"></span>
          </button>
        </div>
        
        <div class="requirement-note" *ngIf="uploadedPhotos.length === 0">
          <p>At least one photo is required to continue</p>
        </div>
        </div>
      </nz-spin>

    </div>
  `,
  styles: [`
    .photo-upload-container {
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

    .category-info {
      max-width: 800px;
      margin: 0 auto 2rem auto;
    }

    .category-card {
      border-radius: 8px;
    }

    .category-summary {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .category-icon {
      font-size: 2rem;
    }

    .category-details h3 {
      font-size: 1.3rem;
      font-weight: 600;
      color: #14213D;
      margin: 0 0 0.25rem 0;
    }

    .category-details p {
      color: #666;
      margin: 0;
    }

    .upload-section {
      max-width: 800px;
      margin: 0 auto 2rem auto;
    }

    .upload-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(20, 33, 61, 0.1);
    }

    .photo-tips {
      margin-bottom: 2rem;
    }

    .tips-alert {
      border-radius: 8px;
    }

    .tips-list {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }

    .tips-list li {
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    .mock-upload-area {
      border: 2px dashed #E5E5E5;
      border-radius: 12px;
      padding: 3rem 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafafa;
    }

    .mock-upload-area:hover {
      border-color: #FCA311;
      background: rgba(252, 163, 17, 0.05);
    }

    .upload-icon {
      font-size: 3rem;
      color: #FCA311;
      margin-bottom: 1rem;
    }

    .upload-text h4 {
      font-size: 1.3rem;
      font-weight: 600;
      color: #14213D;
      margin-bottom: 0.5rem;
    }

    .upload-text p {
      color: #666;
      margin-bottom: 0.5rem;
    }

    .upload-note {
      font-size: 0.9rem;
      color: #999 !important;
    }

    .photo-grid {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #f0f0f0;
    }

    .photo-count {
      margin-bottom: 1rem;
      text-align: center;
    }

    .photo-count span {
      background: #FCA311;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .photo-preview {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
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
    }

    .photo-preview:hover .photo-overlay {
      opacity: 1;
    }

    .photo-actions {
      display: flex;
      gap: 0.5rem;
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
    }

    .quality-high {
      background: #28A745;
      color: white;
    }

    .quality-medium {
      background: #FCA311;
      color: white;
    }

    .quality-low {
      background: #DC3545;
      color: white;
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
      .photo-upload-container {
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

      .mock-upload-area {
        padding: 2rem 1rem;
      }

      .upload-icon {
        font-size: 2.5rem;
      }

      .upload-text h4 {
        font-size: 1.2rem;
      }

      .photo-image {
        height: 100px;
      }
    }
  `]
})
export class PhotoUploadComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedCategory: IssueCategory | null = null;
  uploadedPhotos: PhotoData[] = [];
  isUploading = false;

  constructor(
    private router: Router,
    private message: NzMessageService,
    private issueCreationService: MockIssueCreationService
  ) {}

  ngOnInit(): void {
    this.loadSelectedCategory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSelectedCategory(): void {
    const categoryData = sessionStorage.getItem('civica_selected_category');
    if (categoryData) {
      this.selectedCategory = JSON.parse(categoryData);
    } else {
      // No category selected, redirect back
      console.warn('[PHOTO UPLOAD] No category selected, redirecting...');
      this.router.navigate(['/create-issue']);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (this.uploadedPhotos.length + files.length > 5) {
      this.message.warning('Maximum 5 photos allowed. Please remove some photos first.');
      return;
    }

    this.isUploading = true;

    // Process each file
    Array.from(files).forEach(file => {
      this.processFile(file);
    });
  }

  private processFile(file: File): void {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.message.error(`${file.name} is not a valid image file.`);
      this.isUploading = false;
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      this.message.error(`${file.name} is too large. Maximum size is 10MB.`);
      this.isUploading = false;
      return;
    }

    // Create photo data object
    const photoData: PhotoData = {
      id: this.generatePhotoId(),
      url: URL.createObjectURL(file),
      thumbnail: URL.createObjectURL(file),
      quality: this.analyzePhotoQuality(file),
      timestamp: new Date(),
      metadata: {
        size: file.size,
        dimensions: { width: 800, height: 600 }, // Mock dimensions
        format: file.type
      }
    };

    this.uploadedPhotos.push(photoData);
    
    // Simulate upload delay
    setTimeout(() => {
      this.isUploading = false;
      this.message.success(`Photo uploaded successfully (${this.getQualityLabel(photoData.quality)} quality)`);
    }, 1000);

    console.log('[PHOTO UPLOAD] Photo added:', photoData);
  }

  private generatePhotoId(): string {
    return 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  }

  private analyzePhotoQuality(file: File): 'low' | 'medium' | 'high' {
    // Mock quality analysis based on file size
    if (file.size > 2000000) return 'high'; // > 2MB
    if (file.size > 500000) return 'medium'; // > 500KB
    return 'low';
  }

  getQualityLabel(quality: string): string {
    const labels: { [key: string]: string } = {
      'high': 'High Quality',
      'medium': 'Good Quality',
      'low': 'Basic Quality'
    };
    return labels[quality] || 'Unknown';
  }

  viewPhoto(photo: PhotoData): void {
    console.log('[PHOTO UPLOAD] View photo:', photo.id);
    // TODO: Open photo in lightbox/modal
    window.open(photo.url, '_blank');
  }

  removePhoto(index: number): void {
    const photo = this.uploadedPhotos[index];
    console.log('[PHOTO UPLOAD] Remove photo:', photo.id);
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(photo.url);
    if (photo.thumbnail !== photo.url) {
      URL.revokeObjectURL(photo.thumbnail);
    }

    this.uploadedPhotos.splice(index, 1);
    this.message.info('Photo removed');
  }

  continueToDetails(): void {
    if (this.uploadedPhotos.length === 0) {
      this.message.warning('Please upload at least one photo to continue');
      return;
    }

    console.log('[PHOTO UPLOAD] Continuing to details with photos:', this.uploadedPhotos.length);
    
    // Store photos in session storage
    const photosData = this.uploadedPhotos.map(photo => ({
      ...photo,
      // Don't store object URLs as they won't persist
      url: photo.url,
      thumbnail: photo.thumbnail
    }));
    
    sessionStorage.setItem('civica_uploaded_photos', JSON.stringify(photosData));
    
    this.router.navigate(['/create-issue/details']);
  }
}