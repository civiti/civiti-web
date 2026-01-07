import { Routes } from '@angular/router';

// Route structure based on ux.md user journey with lazy loading
// Header config: headerTitle, showBackButton, backUrl, hideHeader
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/location',
    pathMatch: 'full'
  },
  // Authentication routes - hide header on auth pages
  {
    path: 'auth',
    children: [
      {
        path: 'register',
        loadComponent: () => import('./components/auth/registration-gateway/registration-gateway.component').then(m => m.RegistrationGatewayComponent),
        data: { animation: 'AuthPage', hideHeader: true }
      },
      {
        path: 'signup',
        loadComponent: () => import('./components/auth/user-registration/user-registration.component').then(m => m.UserRegistrationComponent),
        data: { animation: 'SignupPage', hideHeader: true }
      },
      {
        path: 'login',
        loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent),
        data: { animation: 'LoginPage', hideHeader: true }
      },
      {
        path: 'callback',
        loadComponent: () => import('./components/auth/oauth-callback/oauth-callback.component').then(m => m.OauthCallbackComponent),
        data: { animation: 'CallbackPage', hideHeader: true }
      }
    ]
  },
  // User dashboard routes
  {
    path: 'dashboard',
    loadComponent: () => import('./components/user/dashboard/dashboard.component').then(m => m.DashboardComponent),
    data: { animation: 'DashboardPage', headerTitle: 'Panou de Control', showBackButton: true, backUrl: '/issues' }
  },
  {
    path: 'my-issues',
    loadComponent: () => import('./components/user/my-issues/my-issues.component').then(m => m.MyIssuesComponent),
    data: { animation: 'MyIssuesPage', headerTitle: 'Problemele Mele', showBackButton: true, backUrl: '/dashboard' }
  },
  {
    path: 'edit-issue/:id',
    loadComponent: () => import('./components/user/edit-issue/edit-issue.component').then(m => m.EditIssueComponent),
    data: { animation: 'EditIssuePage', headerTitle: 'Editează Problema', showBackButton: true, backUrl: '/my-issues' }
  },
  // Issue creation routes - requires authentication
  {
    path: 'create-issue',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/issue-creation/issue-type-selection/issue-type-selection.component').then(m => m.IssueTypeSelectionComponent),
        data: { animation: 'CreateIssuePage', headerTitle: 'Raportează o Problemă', showBackButton: true, backUrl: '/issues' }
      },
      {
        path: 'photo',
        loadComponent: () => import('./components/issue-creation/photo-upload/photo-upload.component').then(m => m.PhotoUploadComponent),
        data: { animation: 'PhotoUploadPage', headerTitle: 'Documentează Problema', showBackButton: true, backUrl: '/create-issue' }
      },
      {
        path: 'details',
        loadComponent: () => import('./components/issue-creation/issue-details/issue-details.component').then(m => m.IssueDetailsComponent),
        data: { animation: 'IssueDetailsPage', headerTitle: 'Detalii Problemă', showBackButton: true, backUrl: '/create-issue/photo' }
      },
      {
        path: 'authorities',
        loadComponent: () => import('./components/issue-creation/authority-selection/authority-selection.component').then(m => m.AuthoritySelectionComponent),
        data: { animation: 'AuthoritySelectionPage', headerTitle: 'Selectează Autorități', showBackButton: true, backUrl: '/create-issue/details' }
      },
      {
        path: 'review',
        loadComponent: () => import('./components/issue-creation/issue-review/issue-review.component').then(m => m.IssueReviewComponent),
        data: { animation: 'IssueReviewPage', headerTitle: 'Verificare Finală', showBackButton: true, backUrl: '/create-issue/authorities' }
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
        data: { animation: 'AdminPage', headerTitle: 'Administrare', showBackButton: true, backUrl: '/issues' }
      }
    ]
  },
  // Location selection route (landing page) - hide header on landing
  {
    path: 'location',
    loadComponent: () => import('./components/location-selection/location-selection.component').then(m => m.LocationSelectionComponent),
    data: { animation: 'LocationPage', hideHeader: true }
  },
  {
    path: 'issues',
    loadComponent: () => import('./components/issues-list/issues-list.component').then(m => m.IssuesListComponent),
    data: { animation: 'IssuesPage', headerTitle: 'Probleme Active în București' }
  },
  {
    path: 'issue/:id',
    loadComponent: () => import('./components/issue-detail/issue-detail.component').then(m => m.IssueDetailComponent),
    data: { animation: 'DetailPage', renderMode: 'client', headerTitle: 'Detalii Problemă', showBackButton: true, backUrl: '/issues' }
  },
  // Fallback route
  {
    path: '**',
    redirectTo: '/location'
  }
];
