import { createAction, props } from '@ngrx/store';

export const setLocation = createAction(
  '[Location] Set Location',
  props<{ county: string; city: string; district: string }>()
);

export const loadLocationFromStorage = createAction(
  '[Location] Load Location From Storage'
);

export const clearLocation = createAction(
  '[Location] Clear Location'
);