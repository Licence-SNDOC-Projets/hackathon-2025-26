import { Route } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: '/challenges',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/verify',
    loadComponent: () => import('./features/auth/pages/magic-link-verify/magic-link-verify.component').then(m => m.MagicLinkVerifyComponent)
  },
  {
    path: 'challenges',
    loadChildren: () => import('./features/challenges/challenges.module').then(m => m.ChallengesModule),
    canActivate: [AuthGuard]
  }
];
