import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { GUIDE_ARTICLES } from '../../../generated/guide-data';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, NzIconModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly guideArticles = GUIDE_ARTICLES.slice(0, 2);
  readonly currentYear = new Date().getFullYear();
  readonly appStoreUrl = 'https://apps.apple.com/ro/app/civiti/id6760908767';
  readonly githubUrl = 'https://github.com/civiti';
}
