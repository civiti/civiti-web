import { createReducer, on } from '@ngrx/store';
import { LocationState } from './location.state';
import * as LocationActions from './location.actions';

export const initialLocationState: LocationState = {
  county: null,
  city: null,
  district: null,
  loading: false,
  error: null
};

export const locationReducer = createReducer(
  initialLocationState,
  
  on(LocationActions.setLocation, (state, { county, city, district }) => ({
    ...state,
    county,
    city,
    district,
    error: null
  })),
  
  on(LocationActions.loadLocationFromStorage, (state) => {
    const stored = sessionStorage.getItem('civica-location');
    if (stored) {
      const location = JSON.parse(stored);
      return {
        ...state,
        county: location.county,
        city: location.city,
        district: location.district,
        error: null
      };
    }
    return state;
  }),
  
  on(LocationActions.clearLocation, () => {
    sessionStorage.removeItem('civica-location');
    return initialLocationState;
  })
);