import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlayerProfileService, PlayerProfile, EnrichedProfile } from '../../../../core/services/player-profile.service';
import { AuthStatusComponent } from '../../../../shared/components/auth-status/auth-status.component';

/**
 * Composant pour le challenge Player Profile
 * Permet aux étudiants de créer leur profil de compétences
 */
@Component({
  selector: 'app-player-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, AuthStatusComponent],
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.scss']
})
export class PlayerProfileComponent implements OnInit {
  private playerProfileService = inject(PlayerProfileService);
  private router = inject(Router);

  challengeOpen = false;
  isLoading = true;
  isSubmitting = false;
  existingProfile: EnrichedProfile | null = null;
  errorMessage = '';

  profile: PlayerProfile = {
    name: '',
    skills: {
      development: 3,
      electronics: 3,
      iot: 3,
      mechanics: 3
    },
    preferredRole: 'generalist',
    energyLevel: 3,
    workStyle: 'balanced',
    specialSkill: '',
    pastExperience: ''
  };

  ngOnInit() {
    this.loadChallengeStatus();
  }

  /**
   * Charge le statut du challenge et le profil existant
   */
  loadChallengeStatus() {
    this.isLoading = true;

    this.playerProfileService.getStatus().subscribe({
      next: (status) => {
        this.challengeOpen = status.isOpen;

        if (this.challengeOpen) {
          // Charger le profil existant si le challenge est ouvert
          this.loadExistingProfile();
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du statut:', error);
        this.errorMessage = 'Impossible de vérifier le statut du challenge';
        this.isLoading = false;
      }
    });
  }

  /**
   * Charge le profil existant de l'utilisateur
   */
  loadExistingProfile() {
    this.playerProfileService.getEnrichedProfile().subscribe({
      next: (profile) => {
        this.existingProfile = profile;
        if (profile) {
          // Pré-remplir le formulaire avec les données existantes
          // Mapper les valeurs backend vers frontend
          this.profile = {
            name: profile.name,
            skills: { ...profile.skills },
            preferredRole: this.mapBackendRoleToFrontend(profile.preferredRole),
            energyLevel: profile.energyLevel,
            workStyle: this.mapBackendWorkStyleToFrontend(profile.workStyle),
            specialSkill: profile.specialSkill,
            pastExperience: profile.pastExperience
          };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Mappe les rôles du backend vers le frontend
   */
  private mapBackendRoleToFrontend(role: string): 'leader' | 'developer' | 'electronics' | 'mechanics' | 'generalist' {
    const roleMap: Record<string, 'leader' | 'developer' | 'electronics' | 'mechanics' | 'generalist'> = {
      'strategist': 'leader',
      'developer': 'developer',
      'electronician': 'electronics',
      'designer': 'mechanics'
    };
    return roleMap[role] || 'generalist';
  }

  /**
   * Mappe les styles de travail du backend vers le frontend
   */
  private mapBackendWorkStyleToFrontend(workStyle: string): 'independent' | 'collaborative' | 'balanced' {
    const workStyleMap: Record<string, 'independent' | 'collaborative' | 'balanced'> = {
      'analytical': 'independent',
      'creative': 'collaborative',
      'methodical': 'balanced',
      'fast': 'balanced'
    };
    return workStyleMap[workStyle] || 'balanced';
  }

  /**
   * Soumet le profil
   */
  submitProfile() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    this.playerProfileService.submitProfile(this.profile).subscribe({
      next: (response) => {
        console.log('✅ Profil créé avec succès:', response);
        // Recharger le profil enrichi complet après soumission
        this.loadExistingProfile();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors de la soumission:', error);
        this.errorMessage = error.error?.message || 'Erreur lors de la soumission du profil';
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Mode édition du profil
   */
  editProfile() {
    this.existingProfile = null;
  }

  /**
   * Retour à la liste des challenges
   */
  goBack() {
    this.router.navigate(['/challenges']);
  }

  /**
   * Obtient le label d'un rôle
   */
  getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
      leader: 'Leader',
      developer: 'Développeur',
      electronics: 'Électronicien',
      mechanics: 'Mécanicien',
      generalist: 'Généraliste'
    };
    return roleLabels[role] || role;
  }

  /**
   * Convertit les compétences en tableau pour l'affichage
   */
  getSkillsArray(profile: EnrichedProfile): Array<{name: string; value: number}> {
    return [
      { name: 'Développement', value: profile.skills.development },
      { name: 'Électronique', value: profile.skills.electronics },
      { name: 'IoT/MQTT', value: profile.skills.iot },
      { name: 'Mécanique', value: profile.skills.mechanics }
    ];
  }
}
