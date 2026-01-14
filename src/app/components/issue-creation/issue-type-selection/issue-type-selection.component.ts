import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { AppState } from '../../../store/app.state';
import { selectIsAuthenticated } from '../../../store/auth/auth.selectors';
import { IssueCategory, ISSUE_CATEGORIES } from '../../../types/civica-api.types';
import { LocationPickerModalComponent } from '../../shared/location-picker-modal/location-picker-modal.component';
import { LocationData, SECTOR_5_CENTER } from '../../../types/location.types';

interface IssueCategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  examples: string[];
}

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
    NzTagModule,
    NzModalModule
  ],
  templateUrl: './issue-type-selection.component.html',
  styleUrls: ['./issue-type-selection.component.scss']
})
export class IssueTypeSelectionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  categories: IssueCategoryInfo[] = [];
  selectedCategory: IssueCategoryInfo | null = null;
  isLoading = false;
  currentLocation: {
    address: string;
    coordinates: { lat: number; lng: number };
    city?: string;
    district?: string;
  } | null = null;

  isAuthenticated$!: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private modalService: NzModalService
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

    // Load categories from the constants defined in API types
    this.categories = Object.entries(ISSUE_CATEGORIES).map(([id, name]) => ({
      id: id as IssueCategory,
      name,
      description: `Probleme legate de ${name.toLowerCase()}`,
      icon: this.getCategoryIcon(id as IssueCategory),
      examples: this.getCategoryExamples(id as IssueCategory)
    }));

    this.isLoading = false;
    console.log('[TIP PROBLEMĂ] Categorii încărcate:', this.categories.length);
  }

  private loadCurrentLocation(): void {
    // Try to load saved location from session storage
    const savedLocation = sessionStorage.getItem('civica_current_location');
    if (savedLocation) {
      try {
        this.currentLocation = JSON.parse(savedLocation);
        return;
      } catch (e) {
        console.warn('[TIP PROBLEMĂ] Nu s-a putut parsa locația salvată');
      }
    }

    // Default location for Sector 5
    this.currentLocation = {
      address: 'Sectorul 5, București',
      coordinates: SECTOR_5_CENTER,
      city: 'București',
      district: 'Sector 5'
    };
  }

  selectCategory(category: IssueCategoryInfo): void {
    this.selectedCategory = category;
    console.log('[TIP PROBLEMĂ] Categorie selectată:', category.name);
  }

  continueToPhotos(): void {
    if (!this.selectedCategory) {
      console.warn('[TIP PROBLEMĂ] Nicio categorie selectată');
      return;
    }

    console.log('[TIP PROBLEMĂ] Se continuă cu fotografiile pentru categoria:', this.selectedCategory.name);

    // Store selected category in session storage for the creation flow
    sessionStorage.setItem('civica_selected_category', JSON.stringify(this.selectedCategory));
    sessionStorage.setItem('civica_current_location', JSON.stringify(this.currentLocation));

    this.router.navigate(['/create-issue/photo']);
  }

  changeLocation(): void {
    console.log('[TIP PROBLEMĂ] Schimbare locație solicitată');

    const modalRef = this.modalService.create({
      nzTitle: 'Selectează Locația',
      nzContent: LocationPickerModalComponent,
      nzWidth: 700,
      nzMaskClosable: false,
      nzData: {
        config: {
          initialLocation: this.currentLocation?.coordinates,
          initialAddress: this.currentLocation?.address,
          initialCity: this.currentLocation?.city,
          initialDistrict: this.currentLocation?.district
        }
      },
      nzFooter: null // Footer is in the component
    });

    modalRef.afterClose.subscribe((result: LocationData | null) => {
      if (result) {
        console.log('[TIP PROBLEMĂ] Locație selectată:', result);
        this.currentLocation = {
          address: result.address,
          coordinates: { lat: result.latitude, lng: result.longitude },
          city: result.city,
          district: result.district || undefined
        };
        // Save to session storage for persistence
        sessionStorage.setItem('civica_current_location', JSON.stringify(this.currentLocation));
      }
    });
  }

  private getCategoryIcon(categoryId: IssueCategory): string {
    const icons: { [key in IssueCategory]: string } = {
      Infrastructure: 'build',
      Environment: 'global',
      Transportation: 'car',
      PublicServices: 'tool',
      Safety: 'safety',
      Other: 'question-circle'
    };
    return icons[categoryId];
  }

  private getCategoryExamples(categoryId: IssueCategory): string[] {
    const examples: { [key in IssueCategory]: string[] } = {
      Infrastructure: ['Drum deteriorat', 'Trotuar stricat', 'Grop în carosabil'],
      Environment: ['Poluare', 'Zgomot', 'Defrișări'],
      Transportation: ['Semafor defect', 'Lipsă trecere pietoni', 'Transport public'],
      PublicServices: ['Lipsă apă', 'Pane curent', 'Problemă gaze'],
      Safety: ['Iluminat public', 'Zone nesigure', 'Câini fără stăpân'],
      Other: ['Altă problemă', 'Nedefinită', 'Diverse']
    };
    return examples[categoryId];
  }
}