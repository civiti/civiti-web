import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards';

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
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./components/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        data: { animation: 'ForgotPasswordPage', hideHeader: true }
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./components/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        data: { animation: 'ResetPasswordPage', hideHeader: true }
      }
    ]
  },
  // User dashboard routes - requires authentication
  {
    path: 'dashboard',
    loadComponent: () => import('./components/user/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { animation: 'DashboardPage', headerTitle: 'Panou de Control', showBackButton: true, backUrl: '/issues' }
  },
  {
    path: 'my-issues',
    loadComponent: () => import('./components/user/my-issues/my-issues.component').then(m => m.MyIssuesComponent),
    canActivate: [authGuard],
    data: { animation: 'MyIssuesPage', headerTitle: 'Problemele Mele', showBackButton: true, backUrl: '/dashboard' }
  },
  {
    path: 'edit-issue/:id',
    loadComponent: () => import('./components/user/edit-issue/edit-issue.component').then(m => m.EditIssueComponent),
    canActivate: [authGuard],
    data: { animation: 'EditIssuePage', headerTitle: 'Editează Problema', showBackButton: true, backUrl: '/my-issues' }
  },
  // Issue creation routes - requires authentication
  {
    path: 'create-issue',
    canActivate: [authGuard],
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
  // Admin routes - requires admin role
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        data: { animation: 'AdminDashboardPage', headerTitle: 'Panou de Administrare', showBackButton: true, backUrl: '/issues' }
      },
      {
        path: 'approval',
        loadComponent: () => import('./components/admin/approval-interface/approval-interface.component').then(m => m.ApprovalInterfaceComponent),
        data: { animation: 'AdminApprovalPage', headerTitle: 'Aprobare Probleme', showBackButton: true, backUrl: '/admin/dashboard', headerSubtitle: 'Revizuiește și aprobă sesizările comunității' }
      },
      {
        path: 'activity',
        loadComponent: () => import('./components/admin/activity-log/activity-log.component').then(m => m.ActivityLogComponent),
        data: { animation: 'AdminActivityPage', headerTitle: 'Jurnal Activitate', showBackButton: true, backUrl: '/admin/dashboard' }
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
