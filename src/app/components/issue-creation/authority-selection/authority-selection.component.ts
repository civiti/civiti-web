import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { CategoryInfo } from '../../../services/category.service';
import { DEFAULT_CITY } from '../../../data/romanian-locations';
import { AuthorityPickerComponent, SelectedAuthority } from '../../shared/authority-picker/authority-picker.component';
import { MIN_AUTHORITIES } from '../issue-field.constants';

interface LocationData {
  address: string;
  coordinates?: { lat: number; lng: number };
  accuracy?: number;
  city?: string;
  district?: string;
}

@Component({
  selector: 'app-authority-selection',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    AuthorityPickerComponent,
  ],
  templateUrl: './authority-selection.component.html',
  styleUrls: ['./authority-selection.component.scss']
})
export class AuthoritySelectionComponent implements OnInit {
  private readonly router = inject(Router);

  // Data from previous steps
  selectedCategory: CategoryInfo | null = null;
  currentLocation: LocationData | null = null;

  // Location drives the shared picker's authority query.
  issueCity = signal(DEFAULT_CITY);
  issueDistrict = signal('');

  // Selection is owned here (persisted to session) and two-way bound to the picker.
  selectedAuthorities = signal<SelectedAuthority[]>([]);

  readonly MIN_AUTHORITIES = MIN_AUTHORITIES;
  readonly canContinue = computed(() => this.selectedAuthorities().length >= MIN_AUTHORITIES);

  constructor() {
    // Persist selection to session on every change (mirrors the previous per-mutation save,
    // so returning to this step rehydrates the picker). Runs after loadSessionData seeds it.
    effect(() => {
      sessionStorage.setItem('civica_selected_authorities', JSON.stringify(this.selectedAuthorities()));
    });
  }

  ngOnInit(): void {
    this.loadSessionData();
  }

  private loadSessionData(): void {
    // Load category
    const categoryData = sessionStorage.getItem('civica_selected_category');
    if (categoryData) {
      this.selectedCategory = JSON.parse(categoryData);
    }

    // Load location → city/district for authority filtering
    const locationData = sessionStorage.getItem('civica_current_location');
    if (locationData) {
      this.currentLocation = JSON.parse(locationData);
      this.issueCity.set(this.currentLocation?.city || DEFAULT_CITY);
      this.issueDistrict.set(this.currentLocation?.district || '');
    }

    // Rehydrate previously selected authorities
    const authoritiesData = sessionStorage.getItem('civica_selected_authorities');
    if (authoritiesData) {
      this.selectedAuthorities.set(JSON.parse(authoritiesData));
    }

    // Guard: require category + location from earlier steps
    if (!this.selectedCategory || !this.currentLocation) {
      console.warn('[AUTHORITY SELECTION] Missing category/location data, redirecting to start...');
      this.router.navigate(['/create-issue']);
      return;
    }

    // Guard: require the issue-details step to have run
    const completeIssueData = sessionStorage.getItem('civica_complete_issue_data');
    if (!completeIssueData) {
      console.warn('[AUTHORITY SELECTION] Missing issue details data, redirecting to details step...');
      this.router.navigate(['/create-issue/details']);
    }
  }

  continueToReview(): void {
    if (!this.canContinue()) {
      return;
    }
    // Selection is already persisted via the effect.
    this.router.navigate(['/create-issue/review']);
  }

  goBack(): void {
    this.router.navigate(['/create-issue/details']);
  }
}
