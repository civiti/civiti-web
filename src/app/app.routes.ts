import { Routes } from '@angular/router';

// Route structure based on ux.md user journey with lazy loading
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/location',
    pathMatch: 'full'
  },
  // Authentication routes
  {
    path: 'auth',
    children: [
      {
        path: 'register',
        loadComponent: () => import('./components/auth/registration-gateway/registration-gateway.component').then(m => m.RegistrationGatewayComponent),
        data: { animation: 'AuthPage' }
      },
      {
        path: 'signup',
        loadComponent: () => import('./components/auth/user-registration/user-registration.component').then(m => m.UserRegistrationComponent),
        data: { animation: 'SignupPage' }
      },
      {
        path: 'login',
        loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent),
        data: { animation: 'LoginPage' }
      }
    ]
  },
  // User dashboard routes
  {
    path: 'dashboard',
    loadComponent: () => import('./components/user/dashboard/dashboard.component').then(m => m.DashboardComponent),
    data: { animation: 'DashboardPage' }
  },
  // Issue creation routes - requires authentication
  {
    path: 'create-issue',
    // TODO: Add auth guard here when implementing backend integration
    children: [
      {
        path: '',
        loadComponent: () => import('./components/issue-creation/issue-type-selection/issue-type-selection.component').then(m => m.IssueTypeSelectionComponent),
        data: { animation: 'CreateIssuePage' }
      },
      {
        path: 'photo',
        loadComponent: () => import('./components/issue-creation/photo-upload/photo-upload.component').then(m => m.PhotoUploadComponent),
        data: { animation: 'PhotoUploadPage' }
      },
      {
        path: 'details',
        loadComponent: () => import('./components/issue-creation/issue-details/issue-details.component').then(m => m.IssueDetailsComponent),
        data: { animation: 'IssueDetailsPage' }
      },
      {
        path: 'review',
        loadComponent: () => import('./components/issue-creation/issue-review/issue-review.component').then(m => m.IssueReviewComponent),
        data: { animation: 'IssueReviewPage' }
      }
    ]
  },
  // Admin routes
  {
    path: 'admin',
    children: [
      {
        path: 'approval',
        loadComponent: () => import('./components/admin/approval-interface/approval-interface.component').then(m => m.ApprovalInterfaceComponent),
        data: { animation: 'AdminPage' }
      }
    ]
  },
  // Location selection route (landing page)
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
    // Skip prerendering for dynamic routes with parameters
    data: { animation: 'DetailPage', renderMode: 'client' }
  },
  // Fallback route
  {
    path: '**',
    redirectTo: '/location'
  }
];
