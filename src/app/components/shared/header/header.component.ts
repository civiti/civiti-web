import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { AuthButtonsComponent } from '../auth-buttons/auth-buttons.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    NzPageHeaderModule,
    NzButtonModule,
    NzIconModule,
    AuthButtonsComponent,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  private _router = inject(Router);

  title = input('Civiti');
  showBackButton = input(false);
  backUrl = input<string | null>(null);
  subtitle = input<string | null>(null);

  onBack(): void {
    if (this.backUrl()) {
      this._router.navigate([this.backUrl()!]);
    } else {
      window.history.back();
    }
  }
}
