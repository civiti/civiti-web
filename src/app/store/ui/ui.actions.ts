import { createAction, props } from '@ngrx/store';

export const showLoader = createAction('[UI] Show Loader');

export const hideLoader = createAction('[UI] Hide Loader');

export const showSnackbar = createAction(
  '[UI] Show Snackbar',
  props<{ message: string }>()
);

export const hideSnackbar = createAction('[UI] Hide Snackbar');