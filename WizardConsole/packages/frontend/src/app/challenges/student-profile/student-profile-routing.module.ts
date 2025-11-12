import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentProfileComponent } from './components/student-profile/student-profile.component';
import { ProfileCreationComponent } from './components/profile-creation/profile-creation.component';
import { QuestionnaireComponent } from './components/questionnaire/questionnaire.component';
import { ProfileDashboardComponent } from './components/profile-dashboard/profile-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: StudentProfileComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'create', component: ProfileCreationComponent },
      { path: 'questionnaire/:studentId', component: QuestionnaireComponent },
      { path: 'dashboard', component: ProfileDashboardComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentProfileRoutingModule { }