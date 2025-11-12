import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { TronLegacyCircuitComponent } from './pages/tron-legacy-circuit/tron-legacy-circuit.component';

/**
 * Module pour la feature Challenges
 * Contient toutes les pages et composants liés aux challenges
 */
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule.forChild([
      {
        path: '',
        redirectTo: 'tron-legacy-circuit',
        pathMatch: 'full'
      },
      {
        path: 'tron-legacy-circuit',
        component: TronLegacyCircuitComponent,
        title: 'Tron Legacy Circuit Challenge'
      }
    ])
  ],
  providers: [
    // Les services nécessaires seront fournis ici si besoin
  ]
})
export class ChallengesModule { }
