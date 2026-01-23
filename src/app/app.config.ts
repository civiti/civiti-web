import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { registerLocaleData } from '@angular/common';
import ro from '@angular/common/locales/ro';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './interceptors/auth.interceptor';
import { ngZorroConfig, ngZorroIcons, ngZorroI18n } from './providers/ng-zorro.providers';

registerLocaleData(ro);

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { reducers } from './store/app.reducers';
import { IssueEffects } from './store/issues/issue.effects';
import { LocationEffects } from './store/location/location.effects';
import { AuthEffects } from './store/auth/auth.effects';
import { UserEffects } from './store/user/user.effects';
import { UserIssuesEffects } from './store/user-issues/user-issues.effects';
import { ActivityEffects } from './store/activity/activity.effects';
import { CommentsEffects } from './store/comments/comments.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideStore(reducers),
    provideEffects([IssueEffects, LocationEffects, AuthEffects, UserEffects, UserIssuesEffects, ActivityEffects, CommentsEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75,
    }),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(FormsModule),
    ngZorroConfig,
    ngZorroIcons,
    ngZorroI18n,
  ],
};
