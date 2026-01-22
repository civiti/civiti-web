import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import * as ActivityActions from './activity.actions';

@Injectable()
export class ActivityEffects {
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);

  loadMyActivity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActivityActions.loadMyActivity),
      switchMap((action) =>
        this.apiService.getMyActivity(action.params).pipe(
          map(response => ActivityActions.loadMyActivitySuccess({
            activities: response.items,
            totalCount: response.totalItems
          })),
          catchError(error => of(ActivityActions.loadMyActivityFailure({
            error: error.message || 'Eroare la încărcarea activității'
          })))
        )
      )
    )
  );
}
