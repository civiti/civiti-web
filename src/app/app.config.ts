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
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './interceptors/auth.interceptor';
import { ngZorroConfig, ngZorroIcons, ngZorroI18n } from './providers/ng-zorro.providers';

registerLocaleData(ro);

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { reducers } from './store/app.reducers';
import { IssueEffects } from './store/issues/issue.effects';
import { LocationEffects } from './store/location/location.effects';
import { AuthEffects } from './store/auth/auth.effects';
import { UserEffects } from './store/user/user.effects';
import { UserIssuesEffects } from './store/user-issues/user-issues.effects';
import { ActivityEffects } from './store/activity/activity.effects';
import { CommentsEffects } from './store/comments/comments.effects';

// NgRx Store DevTools talk to a browser extension and must not run during SSR.
// Evaluate this at module load — `typeof window` is `undefined` in the Node SSR
// context but defined in the browser.
const isBrowserEnv = typeof window !== 'undefined';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Preloading every lazy module is a browser-only optimization. On the
    // server it keeps the Angular Zone busy and blocks prerender from reaching
    // stable state.
    provideRouter(
      routes,
      ...(isBrowserEnv ? [withPreloading(PreloadAllModules)] : [])
    ),
    provideStore(reducers),
    provideEffects([IssueEffects, LocationEffects, AuthEffects, UserEffects, UserIssuesEffects, ActivityEffects, CommentsEffects]),
    ...(isBrowserEnv
      ? [
          provideStoreDevtools({
            maxAge: 25,
            logOnly: !isDevMode(),
            autoPause: true,
            trace: false,
            traceLimit: 75,
          }),
        ]
      : []),
    // `withEventReplay()` was removed: it installs event listeners before
    // hydration completes and has known interactions with NG-ZORRO's CDK
    // overlays that can cause a post-hydration style flash.
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    importProvidersFrom(FormsModule),
    ngZorroConfig,
    ngZorroIcons,
    ngZorroI18n,
  ],
};
