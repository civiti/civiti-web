import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app.state';
import * as LocationActions from '../../store/location/location.actions';
import { DEFAULT_CITY } from '../../data/romanian-locations';
import { AuthButtonsComponent } from '../shared/auth-buttons/auth-buttons.component';

interface LocationData {
  counties: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}

@Component({
  selector: 'app-location-selection',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzSelectModule,
    NzFormModule,
    NzCardModule,
    NzIconModule,
    NzAlertModule,
    AuthButtonsComponent,
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

  readonly defaultCity = DEFAULT_CITY;

  locationForm = this._fb.group({
    county: [{ value: 'B', disabled: true }, Validators.required],
    city: [{ value: DEFAULT_CITY, disabled: true }, Validators.required]
  });

  ngOnInit(): void {
    this.loadLocationData();
  }

  private loadLocationData(): void {
    this.isLoading = true;

    this.locationData = {
      counties: [{ id: 'B', name: DEFAULT_CITY }],
      cities: [{ id: DEFAULT_CITY, name: DEFAULT_CITY }]
    };

    this.isLoading = false;
  }

  onContinue(): void {
    const rawData = this.locationForm.getRawValue();

    const selectedLocation = {
      county: rawData.county || '',
      city: rawData.city || '',
      district: ''
    };

    console.log('Location data:', selectedLocation);

    this._store.dispatch(LocationActions.setLocation(selectedLocation));
    this._router.navigate(['/issues']);
  }
}
