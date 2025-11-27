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
import { ApiService } from '../../../services/api.service';
import { IssueCategory, ISSUE_CATEGORIES } from '../../../types/civica-api.types';

// Define IssueCategory interface for component
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
    NzTagModule
  ],
  templateUrl: './issue-type-selection.component.html',
  styleUrls: ['./issue-type-selection.component.scss']
})
export class IssueTypeSelectionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  categories: IssueCategoryInfo[] = [];
  selectedCategory: IssueCategoryInfo | null = null;
  isLoading = false;
  currentLocation: any = null;

  isAuthenticated$!: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private apiService: ApiService
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
    console.log('[ISSUE TYPE] Categories loaded:', this.categories.length);
  }

  private loadCurrentLocation(): void {
    // Mock current location - in real app would use geolocation
    this.currentLocation = {
      address: 'Strada Libertății, Sector 5, București',
      coordinates: { lat: 44.4268, lng: 26.1025 },
      accuracy: 10
    };
  }

  selectCategory(category: IssueCategoryInfo): void {
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
    alert('Selectarea locației va fi implementată în următoarea fază.');
  }

  showCategoryHelp(): void {
    console.log('[ISSUE TYPE] Category help requested');
    // TODO: Show category help modal or navigate to help page
    alert('Ghidul de ajutor pentru categorii va fi implementat în următoarea fază.');
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