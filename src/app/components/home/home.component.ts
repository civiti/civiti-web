import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app.state';
import * as LocationActions from '../../store/location/location.actions';
import { DEFAULT_CITY } from '../../data/romanian-locations';
import { GUIDE_ARTICLES } from '../../generated/guide-data';
import { AuthButtonsComponent } from '../shared/auth-buttons/auth-buttons.component';

/**
 * The homepage.
 *
 * Exists because `/` was previously `{ path: '', redirectTo: '/location' }`. A
 * route carrying `redirectTo` cannot be prerendered, so the build emitted no
 * `index.html` at all and the apex domain — the URL that collects every backlink
 * and every brand query — served a bare CSR shell whose only <h1> was
 * "Loading Civiti...". Giving `/` a real component is what makes the build emit
 * a prerendered homepage.
 *
 * The city picker that used to live at /location is folded in here; /location
 * now 301s to `/` (see vercel.json).
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NzButtonModule, NzIconModule, AuthButtonsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly _router = inject(Router);
  private readonly _store = inject(Store<AppState>);

  readonly defaultCity = DEFAULT_CITY;

  /** Every guide, so the homepage links each one directly. Two of the four
   *  previously had only a single inbound internal link on the whole site. */
  readonly guides = GUIDE_ARTICLES;

  /**
   * Selects the city without navigating, for callers that are already real
   * links. Keeps the hero visual a genuine anchor — middle-click, open in new
   * tab and keyboard activation all behave — while still seeding the location
   * state that `enterCity()` would have set.
   */
  selectCity(): void {
    this._store.dispatch(
      LocationActions.setLocation({ county: 'B', city: DEFAULT_CITY, district: '' }),
    );
  }

  enterCity(): void {
    this.selectCity();
    this._router.navigate(['/bucuresti']);
  }
}
