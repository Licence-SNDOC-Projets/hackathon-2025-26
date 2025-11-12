import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/student-profile/dashboard', 
    pathMatch: 'full' 
  },
  {
    path: 'student-profile',
    loadChildren: () => import('./challenges/student-profile/student-profile.module').then(m => m.StudentProfileModule)
  },
  {
    path: '**',
    redirectTo: '/student-profile/dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }