import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LocationState } from './location.state';

export const selectLocationState = createFeatureSelector<LocationState>('location');

export const selectCounty = createSelector(
  selectLocationState,
  (state: LocationState) => state.county
);

export const selectCity = createSelector(
  selectLocationState,
  (state: LocationState) => state.city
);

export const selectDistrict = createSelector(
  selectLocationState,
  (state: LocationState) => state.district
);

export const selectFullLocation = createSelector(
  selectLocationState,
  (state: LocationState) => ({
    county: state.county,
    city: state.city,
    district: state.district
  })
);

export const selectLocationLoading = createSelector(
  selectLocationState,
  (state: LocationState) => state.loading
);

export const selectLocationError = createSelector(
  selectLocationState,
  (state: LocationState) => state.error
);