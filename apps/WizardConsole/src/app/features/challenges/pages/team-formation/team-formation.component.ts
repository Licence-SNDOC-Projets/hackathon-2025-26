import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { TeamFormationService, TeamInfo, BacklogPlayer, TeamProfile } from '../../../../core/services/team-formation.service';
import { PlayerProfileService } from '../../../../core/services/player-profile.service';

/**
 * Composant pour la formation d'équipes
 */
@Component({
  selector: 'app-team-formation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-formation.component.html',
  styleUrls: ['./team-formation.component.scss']
})
export class TeamFormationComponent implements OnInit, OnDestroy {
  private readonly teamFormationService = inject(TeamFormationService);
  private readonly playerProfileService = inject(PlayerProfileService);
  private destroy$ = new Subject<void>();

  // État
  isLoading = true;
  error: string | null = null;
  successMessage: string | null = null;

  // Données
  teams: TeamInfo[] = [];
  myTeam: TeamInfo | null = null;
  backlogPlayers: BacklogPlayer[] = [];
  myProfile: any = null;

  // UI state
  showTeamDetailsModal = false;
  selectedTeam: TeamInfo | null = null;
  selectedTeamProfile: TeamProfile | null = null;

  // Vue active
  activeView: 'teams' | 'backlog' | 'myTeam' = 'teams';

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge toutes les données nécessaires
   */
  private loadData() {
    this.isLoading = true;
    this.error = null;

    // Charger le profil utilisateur
    this.playerProfileService.getEnrichedProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.myProfile = profile;

          // Charger les données d'équipe
          this.loadTeamData();
        },
        error: (error) => {
          console.error('Erreur chargement profil:', error);
          this.error = 'Veuillez compléter votre profil avant de rejoindre une équipe';
          this.isLoading = false;
        }
      });
  }

  /**
   * Charge les données des équipes
   */
  private loadTeamData() {
    combineLatest([
      this.teamFormationService.getAllTeams(),
      this.teamFormationService.getMyTeam(),
      this.teamFormationService.getBacklog()
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ([teamsResponse, myTeamResponse, backlogResponse]) => {
        this.teams = teamsResponse.data.teams || [];
        this.myTeam = myTeamResponse.data.team || null;
        this.backlogPlayers = backlogResponse.data.players || [];
        this.isLoading = false;

        // Basculer vers myTeam si l'utilisateur a une équipe
        if (this.myTeam) {
          this.activeView = 'myTeam';
        }
      },
      error: (error) => {
        console.error('Erreur chargement données:', error);
        this.error = error.error?.message || 'Erreur lors du chargement des données';
        this.isLoading = false;
      }
    });
  }

  /**
   * Affiche les détails d'une équipe
   */
  viewTeamDetails(team: TeamInfo) {
    this.selectedTeam = team;
    this.isLoading = true;

    this.teamFormationService.getTeamProfile(team.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.selectedTeamProfile = response.data.profile;
          this.showTeamDetailsModal = true;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement profil équipe:', error);
          this.error = 'Erreur lors du chargement du profil de l\'équipe';
          this.isLoading = false;
        }
      });
  }

  /**
   * Rejoint une équipe
   */
  joinTeam(team: TeamInfo) {
    if (!this.myProfile) {
      this.error = 'Profil utilisateur non trouvé';
      return;
    }

    if (this.myTeam) {
      this.error = 'Vous êtes déjà membre d\'une équipe';
      return;
    }

    if (confirm(`Voulez-vous rejoindre l'équipe "${team.name}" ?`)) {
      this.isLoading = true;
      this.error = null;

      this.teamFormationService.joinTeam(team.id, this.myProfile)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.successMessage = response.message || 'Vous avez rejoint l\'équipe';
            this.showTeamDetailsModal = false;
            this.loadTeamData();
            setTimeout(() => this.successMessage = null, 3000);
          },
          error: (error) => {
            console.error('Erreur rejoindre équipe:', error);
            this.error = error.error?.message || 'Erreur lors de l\'ajout à l\'équipe';
            this.isLoading = false;
          }
        });
    }
  }

  /**
   * Quitte l'équipe actuelle
   */
  leaveTeam() {
    if (!this.myProfile) {
      this.error = 'Profil utilisateur non trouvé';
      return;
    }

    if (!this.myTeam) {
      this.error = 'Vous n\'êtes membre d\'aucune équipe';
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir quitter l'équipe "${this.myTeam.name}" ?`)) {
      this.isLoading = true;
      this.error = null;

      this.teamFormationService.leaveTeam(this.myProfile)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.successMessage = response.message || 'Vous avez quitté l\'équipe';
            this.loadTeamData();
            setTimeout(() => this.successMessage = null, 3000);
          },
          error: (error) => {
            console.error('Erreur quitter équipe:', error);
            this.error = error.error?.message || 'Erreur lors du départ de l\'équipe';
            this.isLoading = false;
          }
        });
    }
  }

  /**
   * Ferme les modales
   */
  closeModals() {
    this.showTeamDetailsModal = false;
    this.selectedTeam = null;
    this.selectedTeamProfile = null;
    this.error = null;
  }

  /**
   * Change la vue active
   */
  setActiveView(view: 'teams' | 'backlog' | 'myTeam') {
    this.activeView = view;
    this.error = null;
  }

  /**
   * Obtient la couleur pour un niveau de compétence
   */
  getSkillColor(level: number): string {
    if (level >= 4) return '#4caf50';
    if (level >= 3) return '#8bc34a';
    if (level >= 2) return '#ff9800';
    return '#f44336';
  }

  /**
   * Obtient le label d'un rôle
   */
  getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
      'leader': '🎯 Leader',
      'developer': '💻 Développeur',
      'electronics': '⚡ Électronicien',
      'mechanics': '🔧 Mécanicien',
      'generalist': '🌟 Généraliste'
    };
    return roleLabels[role] || role;
  }

  /**
   * Obtient le label d'un niveau d'expérience
   */
  getExperienceLabel(level: number): string {
    if (level === 1) return 'Débutant';
    if (level === 2) return 'Intermédiaire';
    if (level === 3) return 'Confirmé';
    if (level === 4) return 'Expert';
    if (level === 5) return 'Master';
    return 'Inconnu';
  }

  /**
   * Obtient le label d'un style de travail
   */
  getWorkStyleLabel(style: string): string {
    const styleLabels: Record<string, string> = {
      'independent': '🧠 Indépendant',
      'collaborative': '🤝 Collaboratif',
      'balanced': '⚖️ Équilibré'
    };
    return styleLabels[style] || style;
  }

  /**
   * Calcule le pourcentage de remplissage d'une équipe
   */
  getTeamFillPercentage(team: TeamInfo): number {
    if (!team.maxMembers) return 0;
    return (team.members.length / team.maxMembers) * 100;
  }

  /**
   * Vérifie si une équipe est complète
   */
  isTeamFull(team: TeamInfo): boolean {
    return team.isComplete;
  }
}
