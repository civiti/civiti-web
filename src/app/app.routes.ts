import { Routes } from '@angular/router';

// Route structure based on ux.md user journey with lazy loading
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/location',
    pathMatch: 'full'
  },
  {
    path: 'location',
    loadComponent: () => import('./components/location-selection/location-selection.component').then(m => m.LocationSelectionComponent),
    data: { animation: 'LocationPage' }
  },
  {
    path: 'issues',
    loadComponent: () => import('./components/issues-list/issues-list.component').then(m => m.IssuesListComponent),
    data: { animation: 'IssuesPage' }
  },
  {
    path: 'issue/:id',
    loadComponent: () => import('./components/issue-detail/issue-detail.component').then(m => m.IssueDetailComponent),
    data: { animation: 'DetailPage' }
  },
  // Fallback route
  {
    path: '**',
    redirectTo: '/location'
  }
];
