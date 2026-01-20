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
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store/app.state';
import * as LocationActions from '../../store/location/location.actions';
import * as AuthActions from '../../store/auth/auth.actions';
import { selectIsAuthenticated, selectAuthUser, selectUserDisplayName } from '../../store/auth/auth.selectors';
import { AuthUser } from '../../store/auth/auth.state';
import { DEFAULT_CITY } from '../../data/romanian-locations';

interface LocationData {
  counties: { id: string; name: string }[];
  cities: { id: string; name: string }[];
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
    NzAvatarModule,
    NzDropDownModule,
  ],
  templateUrl: './location-selection.component.html',
  styleUrls: ['./location-selection.component.scss']
})
export class LocationSelectionComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _router = inject(Router);
  private _store = inject(Store<AppState>);

  locationData: LocationData | null = null;
  isLoading = false;

  // Expose constant to template
  readonly defaultCity = DEFAULT_CITY;

  // Auth state observables
  isAuthenticated$: Observable<boolean>;
  user$: Observable<AuthUser | null>;
  displayName$: Observable<string>;

  constructor() {
    this.isAuthenticated$ = this._store.select(selectIsAuthenticated);
    this.user$ = this._store.select(selectAuthUser);
    this.displayName$ = this._store.select(selectUserDisplayName);
  }

  locationForm = this._fb.group({
    county: [{ value: 'B', disabled: true }, Validators.required],
    city: [{ value: DEFAULT_CITY, disabled: true }, Validators.required]
  });

  ngOnInit(): void {
    this.loadLocationData();
  }

  private loadLocationData(): void {
    this.isLoading = true;

    // Load static location data
    // For MVP, hardcoded to București
    this.locationData = {
      counties: [{ id: 'B', name: DEFAULT_CITY }],
      cities: [{ id: DEFAULT_CITY, name: DEFAULT_CITY }]
    };

    this.isLoading = false;
  }

  onContinue(): void {
    // For MVP, all fields are pre-filled and disabled, so we don't need to validate
    // Use getRawValue() to include disabled form controls
    const rawData = this.locationForm.getRawValue();

    // Store clean values in state - encoding happens at API layer when needed
    const selectedLocation = {
      county: rawData.county || '',
      city: rawData.city || '',
      district: '' // District selection moved to issues filter page
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

  navigateToDashboard(): void {
    this._router.navigate(['/dashboard']);
  }

  logout(): void {
    this._store.dispatch(AuthActions.logout());
  }
} 