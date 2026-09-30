import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { App } from './app';
import * as AuthActions from './store/auth/auth.actions';
import { initialAuthState } from './store/auth/auth.state';
import { ngZorroIcons } from './providers/ng-zorro.providers';

@Component({ standalone: true, template: '<h1>Pagină de test</h1>' })
class StubPageComponent {}

describe('App', () => {
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideMockStore({ initialState: { auth: initialAuthState } }),
        provideNoopAnimations(),
        ngZorroIcons
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
  });

  it('creates the app shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('restores the auth session on start-up', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(store.dispatch).toHaveBeenCalledWith(AuthActions.loadUserFromStorage());
  });

  it('renders the skip link, the header and the main landmark', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('a.skip-link')?.getAttribute('href')).toBe('#continut');
    expect(el.querySelector('app-header .site-header')).not.toBeNull();
    expect(el.querySelector('main#continut router-outlet')).not.toBeNull();
    // Footer is opt-in per route.
    expect(el.querySelector('app-footer')).toBeNull();
  });

  it('follows the route data for header and footer after navigation', async () => {
    const router = TestBed.inject(Router);
    router.resetConfig([
      { path: 'pagina', component: StubPageComponent, data: { hideHeader: true, showFooter: true } }
    ]);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await router.navigateByUrl('/pagina');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('app-header')).toBeNull();
    expect(el.querySelector('app-footer .site-footer')).not.toBeNull();
    expect(el.querySelector('main h1')?.textContent).toContain('Pagină de test');
  });
});
