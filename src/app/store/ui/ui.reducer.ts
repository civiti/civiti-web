import { createReducer, on } from '@ngrx/store';
import { UIState } from './ui.state';
import * as UIActions from './ui.actions';

export const initialUIState: UIState = {
  showLoader: false,
  snackbarMessage: null
};

export const uiReducer = createReducer(
  initialUIState,
  
  on(UIActions.showLoader, (state) => ({
    ...state,
    showLoader: true
  })),
  
  on(UIActions.hideLoader, (state) => ({
    ...state,
    showLoader: false
  })),
  
  on(UIActions.showSnackbar, (state, { message }) => ({
    ...state,
    snackbarMessage: message
  })),
  
  on(UIActions.hideSnackbar, (state) => ({
    ...state,
    snackbarMessage: null
  }))
);