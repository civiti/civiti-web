import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app.state';
import * as LocationActions from '../../store/location/location.actions';
import { MockDataService } from '../../services/mock-data.service';
import { SanitizationService } from '../../services/sanitization.service';

interface LocationData {
  counties: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  districts: { id: string; name: string }[];
}

@Component({
  selector: 'app-location-selection',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzSelectModule,
    NzFormModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzAlertModule,
    NzGridModule,
    NzTypographyModule,
    NzSpaceModule,
  ],
  templateUrl: './location-selection.component.html',
  styleUrls: ['./location-selection.component.scss']
})
export class LocationSelectionComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _router = inject(Router);
  private _store = inject(Store<AppState>);
  private _mockDataService = inject(MockDataService);
  private _sanitizer = inject(SanitizationService);

  locationData: LocationData | null = null;
  isLoading = false;

  locationForm = this._fb.group({
    county: [{ value: 'B', disabled: true }, Validators.required],
    city: [{ value: 'BUCURESTI', disabled: true }, Validators.required],
    district: [{ value: 'SECTOR5', disabled: true }, Validators.required] // Only Sector 5 for MVP
  });

  ngOnInit(): void {
    this.loadLocationData();
  }

  private loadLocationData(): void {
    this.isLoading = true;
    this._mockDataService.getLocationData().subscribe({
      next: (data) => {
        this.locationData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading location data:', error);
        this.isLoading = false;
      }
    });
  }

  onContinue(): void {
    // For MVP, all fields are pre-filled and disabled, so we don't need to validate
    // Use getRawValue() to include disabled form controls
    const rawData = this.locationForm.getRawValue();

    // Sanitize values before storing
    const selectedLocation = {
      county: this._sanitizer.sanitizeUrlParam(rawData.county || ''),
      city: this._sanitizer.sanitizeUrlParam(rawData.city || ''),
      district: this._sanitizer.sanitizeUrlParam(rawData.district || '')
    };

    console.log('Location data:', selectedLocation); // Debug log

    // Dispatch action to store location in state (effects will handle storage)
    this._store.dispatch(LocationActions.setLocation(selectedLocation));

    // Navigate to issues list
    this._router.navigate(['/issues']);
  }

  navigateToLogin(): void {
    this._router.navigate(['/auth/login'], { queryParams: { returnUrl: '/location' } });
  }

  navigateToRegister(): void {
    this._router.navigate(['/auth/register'], { queryParams: { returnUrl: '/location' } });
  }
} 