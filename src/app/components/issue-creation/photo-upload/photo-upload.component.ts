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

import { ApiService } from '../../../services/api.service';
import { IssueCategory } from '../../../types/civica-api.types';

// Interface for category data from session storage
interface IssueCategoryInfo {
  id: IssueCategory;
  name: string;
  description: string;
  icon: string;
  examples: string[];
}

// Keep local PhotoData interface for component
interface PhotoData {
  id: string;
  url: string;
  thumbnail: string;
  quality: 'low' | 'medium' | 'high';
  timestamp: Date;
  metadata: {
    size: number;
    dimensions: { width: number; height: number };
    format: string;
  };
}

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
  templateUrl: './photo-upload.component.html',
  styleUrls: ['./photo-upload.component.scss']
})
export class PhotoUploadComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedCategory: IssueCategoryInfo | null = null;
  uploadedPhotos: PhotoData[] = [];
  isUploading = false;

  constructor(
    private router: Router,
    private message: NzMessageService,
    private apiService: ApiService
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
      this.selectedCategory = JSON.parse(categoryData) as IssueCategoryInfo;
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
      this.message.warning('Maxim 5 fotografii permise. Vă rugăm să ștergeți câteva fotografii mai întâi.');
      return;
    }

    this.isUploading = true;
    
    // Track number of files being processed
    const filesToProcess = Array.from(files);
    let processedCount = 0;

    // Process each file
    filesToProcess.forEach(file => {
      this.processFile(file, () => {
        processedCount++;
        // Only set isUploading to false when all files are processed
        if (processedCount === filesToProcess.length) {
          this.isUploading = false;
        }
      });
    });
  }

  private processFile(file: File, onComplete: () => void): void {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.message.error(`${file.name} nu este un fișier imagine valid.`);
      onComplete(); // Call completion callback even on error
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      this.message.error(`${file.name} este prea mare. Dimensiunea maximă este de 10MB.`);
      onComplete(); // Call completion callback even on error
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
      this.message.success(`Fotografia a fost încărcată cu succes (calitate ${this.getQualityLabel(photoData.quality)})`);
      onComplete(); // Call completion callback after upload completes
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
      'high': 'Înaltă',
      'medium': 'Bună',
      'low': 'De bază'
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
    this.message.info('Fotografia a fost ștearsă');
  }

  continueToDetails(): void {
    if (this.uploadedPhotos.length === 0) {
      this.message.warning('Vă rugăm să încărcați cel puțin o fotografie pentru a continua');
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