import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { StudentProfileRoutingModule } from './student-profile-routing.module';

// Components
import { StudentProfileComponent } from './components/student-profile/student-profile.component';
import { ProfileCreationComponent } from './components/profile-creation/profile-creation.component';
import { QuestionnaireComponent } from './components/questionnaire/questionnaire.component';
import { ProfileDashboardComponent } from './components/profile-dashboard/profile-dashboard.component';

// Services
import { StudentProfileService } from './services/student-profile.service';

@NgModule({
  declarations: [
    StudentProfileComponent,
    ProfileCreationComponent,
    QuestionnaireComponent,
    ProfileDashboardComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    StudentProfileRoutingModule
  ],
  providers: [
    StudentProfileService
  ]
})
export class StudentProfileModule {
  constructor() {
    console.log('🎓 StudentProfileModule Angular initialisé');
  }
}