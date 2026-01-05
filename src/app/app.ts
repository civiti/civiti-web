import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs/operators';
import { AppState } from './store/app.state';
import * as AuthActions from './store/auth/auth.actions';
import { HeaderComponent } from './components/shared/header/header.component';

interface RouteConfig {
  title: string;
  showBackButton: boolean;
  backUrl: string | null;
  hideHeader: boolean;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  template: `
    <app-header
      *ngIf="!routeConfig.hideHeader"
      [title]="routeConfig.title"
      [showBackButton]="routeConfig.showBackButton"
      [backUrl]="routeConfig.backUrl">
    </app-header>
    <router-outlet />
  `,
  styleUrl: './app.scss',
  standalone: true
})
export class App implements OnInit {
  private _store = inject(Store<AppState>);
  private _router = inject(Router);
  private _activatedRoute = inject(ActivatedRoute);

  protected title = 'Civica';

  // Default route config
  routeConfig: RouteConfig = {
    title: 'Civica',
    showBackButton: false,
    backUrl: null,
    hideHeader: false
  };

  ngOnInit(): void {
    // Restore auth state from Supabase session on app startup
    this._store.dispatch(AuthActions.loadUserFromStorage());

    // Listen to route changes and update header config
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this._activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.snapshot.data;
      })
    ).subscribe(data => {
      this.routeConfig = {
        title: data['headerTitle'] || 'Civica',
        showBackButton: data['showBackButton'] ?? false,
        backUrl: data['backUrl'] || null,
        hideHeader: data['hideHeader'] ?? false
      };
    });
  }
}
