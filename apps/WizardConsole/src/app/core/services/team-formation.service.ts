import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

/**
 * Interface pour les informations d'une équipe
 */
export interface TeamInfo {
  id: string;
  name: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;
  maxMembers?: number;
}

/**
 * Interface pour un membre d'équipe
 */
export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  profile: PlayerProfile;
  joinedAt: Date;
  isCaptain: boolean;
}

/**
 * Interface pour le profil d'un joueur
 */
export interface PlayerProfile {
  name: string;
  email: string;
  preferredRole: string;
  skills: {
    development: number;
    electronics: number;
    iot: number;
    mechanics: number;
  };
  experience: number;
  motivation: {
    energyLevel: number;
    workStyle: string;
    objectives: string[];
  };
}

/**
 * Interface pour un joueur dans le backlog
 */
export interface BacklogPlayer {
  userId: string;
  profile: PlayerProfile;
  addedAt: Date;
}

/**
 * Interface pour le profil agrégé d'une équipe
 */
export interface TeamProfile {
  teamId: string;
  teamName: string;
  averageSkills: {
    development: number;
    electronics: number;
    iot: number;
    mechanics: number;
  };
  totalMembers: number;
  roleDistribution: Record<string, number>;
  energyLevel: number;
  strengths: string[];
  weaknesses: string[];
}

/**
 * Service pour gérer la formation d'équipes
 */
@Injectable({
  providedIn: 'root'
})
export class TeamFormationService {
  private readonly apiUrl = '/api/team-formation';

  // État local
  private teamsSubject = new BehaviorSubject<TeamInfo[]>([]);
  private myTeamSubject = new BehaviorSubject<TeamInfo | null>(null);
  private backlogSubject = new BehaviorSubject<BacklogPlayer[]>([]);

  // Observables publics
  teams$ = this.teamsSubject.asObservable();
  myTeam$ = this.myTeamSubject.asObservable();
  backlog$ = this.backlogSubject.asObservable();

  private readonly http = inject(HttpClient);

  /**
   * Vérifie si le challenge est ouvert
   */
  checkStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/status`);
  }

  /**
   * Ouvre le challenge (admin uniquement)
   */
  openChallenge(): Observable<any> {
    return this.http.post(`${this.apiUrl}/open`, {});
  }

  /**
   * Ferme le challenge (admin uniquement)
   */
  closeChallenge(): Observable<any> {
    return this.http.post(`${this.apiUrl}/close`, {});
  }

  /**
   * Récupère toutes les équipes
   */
  getAllTeams(): Observable<any> {
    return this.http.get(`${this.apiUrl}/teams`).pipe(
      tap((response: any) => {
        if (response.success && response.data.teams) {
          this.teamsSubject.next(response.data.teams);
        }
      })
    );
  }

  /**
   * Récupère une équipe spécifique
   */
  getTeam(teamId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/teams/${teamId}`);
  }

  /**
   * Récupère le profil agrégé d'une équipe
   */
  getTeamProfile(teamId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/teams/${teamId}/profile`);
  }

  /**
   * Récupère l'équipe de l'utilisateur connecté
   */
  getMyTeam(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-team`).pipe(
      tap((response: any) => {
        if (response.success) {
          this.myTeamSubject.next(response.data.team);
        }
      })
    );
  }

  /**
   * Récupère tous les joueurs dans le backlog
   */
  getBacklog(): Observable<any> {
    return this.http.get(`${this.apiUrl}/backlog`).pipe(
      tap((response: any) => {
        if (response.success && response.data.players) {
          this.backlogSubject.next(response.data.players);
        }
      })
    );
  }

  /**
   * Crée une nouvelle équipe
   */
  createTeam(teamName: string, userProfile: PlayerProfile): Observable<any> {
    return this.http.post(`${this.apiUrl}/teams`, {
      teamName,
      userProfile
    }).pipe(
      tap((response: any) => {
        if (response.success) {
          // Rafraîchir la liste des équipes et mon équipe
          this.getAllTeams().subscribe();
          this.getMyTeam().subscribe();
        }
      })
    );
  }

  /**
   * Rejoint une équipe
   */
  joinTeam(teamId: string, userProfile: PlayerProfile): Observable<any> {
    return this.http.post(`${this.apiUrl}/teams/${teamId}/join`, {
      userProfile
    }).pipe(
      tap((response: any) => {
        if (response.success) {
          // Rafraîchir la liste des équipes et mon équipe
          this.getAllTeams().subscribe();
          this.getMyTeam().subscribe();
        }
      })
    );
  }

  /**
   * Quitte l'équipe actuelle
   */
  leaveTeam(userProfile: PlayerProfile): Observable<any> {
    return this.http.post(`${this.apiUrl}/leave`, {
      userProfile
    }).pipe(
      tap((response: any) => {
        if (response.success) {
          // Rafraîchir la liste des équipes et mon équipe
          this.getAllTeams().subscribe();
          this.getMyTeam().subscribe();
          this.getBacklog().subscribe();
        }
      })
    );
  }

  /**
   * Rafraîchit toutes les données
   */
  refreshAll(): void {
    this.getAllTeams().subscribe();
    this.getMyTeam().subscribe();
    this.getBacklog().subscribe();
  }

  /**
   * Réinitialise l'état local
   */
  reset(): void {
    this.teamsSubject.next([]);
    this.myTeamSubject.next(null);
    this.backlogSubject.next([]);
  }
}
