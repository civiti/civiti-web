import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
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
        MatButtonModule,
        MatSelectModule,
        MatFormFieldModule,
        MatCardModule,
        MatIconModule,
    ],
    template: `
    <div class="min-h-screen bg-background flex items-center justify-center p-4">
      <mat-card class="w-full max-w-md mx-auto">
        <mat-card-header class="text-center mb-6">
          <mat-card-title class="text-primary text-2xl font-bold mb-2">
            Civica - Participare Civică
          </mat-card-title>
          <mat-card-subtitle class="text-oxford-blue opacity-75">
            Selectează-ți locația pentru a vedea problemele din comunitate
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="locationForm" (ngSubmit)="onContinue()" class="space-y-6">
            <!-- County Selection -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label class="form-label">Județ</mat-label>
              <mat-select formControlName="county">
                <mat-option value="B">București</mat-option>
              </mat-select>
              <mat-icon matSuffix>location_on</mat-icon>
            </mat-form-field>

            <!-- City Selection -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label class="form-label">Oraș</mat-label>
              <mat-select formControlName="city">
                <mat-option value="BUCURESTI">București</mat-option>
              </mat-select>
              <mat-icon matSuffix>location_city</mat-icon>
            </mat-form-field>

            <!-- District Selection -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label class="form-label">Cartier/Sector</mat-label>
              <mat-select formControlName="district" required>
                <mat-option value="SECTOR5">Sector 5</mat-option>
              </mat-select>
              <mat-icon matSuffix>map</mat-icon>
            </mat-form-field>

            <!-- Info Box -->
            <div class="info-box bg-orange-web-20 p-4 rounded-lg border-l-4 border-orange-web">
              <div class="flex items-start">
                <mat-icon class="text-orange-web">info</mat-icon>
                <div class="info-content">
                  <p class="info-title text-sm font-semibold text-oxford-blue">Pentru MVP</p>
                  <p class="info-description text-xs text-oxford-blue opacity-75">
                    Momentan aplicația funcționează doar pentru București, Sectorul 5.
                  </p>
                </div>
              </div>
            </div>

            <!-- Continue Button -->
            <button 
              mat-raised-button 
              color="accent" 
              type="submit"
              class="w-full btn-primary text-lg py-3"
              [disabled]="isLoading"
            >
              <mat-icon class="mr-2">arrow_forward</mat-icon>
              {{ isLoading ? 'Se încarcă...' : 'Continuă la Probleme' }}
            </button>
          </form>
        </mat-card-content>

        <!-- Footer -->
        <mat-card-footer class="text-center mt-6 p-4 border-t border-platinum">
          <p class="text-xs text-oxford-blue opacity-50">
            Platforma Civica - Împreună pentru comunitate
          </p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
    styles: [`
    mat-card {
      box-shadow: 0 8px 24px rgba(20, 33, 61, 0.1);
      border: 1px solid var(--platinum);
    }

    mat-card-header {
      padding-bottom: 0;
    }

    mat-form-field {
      width: 100%;
    }

    .mat-mdc-form-field-focus-overlay {
      background-color: var(--orange-web-20);
    }

    .mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled) {
      background-color: var(--orange-web-20);
    }

    .space-y-6 > * + * {
      margin-top: 1.5rem;
    }

    .bg-orange-web-20 {
      background-color: var(--orange-web-20);
    }

    .border-orange-web {
      border-color: var(--orange-web);
    }

    // Fix info box layout and spacing
    .info-box {
      .flex {
        gap: 12px;
      }
      
      mat-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        font-size: 20px;
        line-height: 20px;
        margin-top: 2px;
      }
      
      .info-content {
        flex: 1;
        min-width: 0;
        
        p {
          margin: 0;
          word-wrap: break-word;
          
          &.info-title {
            margin-bottom: 8px;
            line-height: 1.4;
          }
          
          &.info-description {
            line-height: 1.5;
          }
        }
      }
    }

    .text-orange-web {
      color: var(--orange-web);
    }

    .text-oxford-blue {
      color: var(--oxford-blue);
    }

    .text-primary {
      color: var(--oxford-blue);
    }

    .bg-background {
      background-color: var(--color-background);
    }

    button[mat-raised-button] {
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.025em;
    }
  `]
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
} 