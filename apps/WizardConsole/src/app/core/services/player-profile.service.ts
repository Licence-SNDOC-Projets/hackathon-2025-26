import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Interface pour le profil joueur
 */
export interface PlayerProfile {
  name: string;
  skills: {
    development: number;    // 1-5
    electronics: number;    // 1-5
    iot: number;           // 1-5
    mechanics: number;     // 1-5
  };
  preferredRole: 'leader' | 'developer' | 'electronics' | 'mechanics' | 'generalist';
  energyLevel: number;     // 1-5
  workStyle: 'independent' | 'collaborative' | 'balanced';
  specialSkill?: string;
  pastExperience?: string;
}

/**
 * Interface pour le profil enrichi
 */
export interface EnrichedProfile extends PlayerProfile {
  userId: string;
  email: string;
  overallScore: number;
  playerClass: string;
  suggestions: string[];
  createdAt: string;
}

/**
 * Interface pour les statistiques
 */
export interface PlayerProfileStats {
  totalProfiles: number;
  averageSkills: {
    development: number;
    electronics: number;
    iot: number;
    mechanics: number;
  };
  roleDistribution: Record<string, number>;
  workStyleDistribution: Record<string, number>;
}

/**
 * Interface pour la réponse de statut
 */
export interface ChallengeStatusResponse {
  isOpen: boolean;
  message: string;
}

/**
 * Service pour gérer le challenge Player Profile
 */
@Injectable({
  providedIn: 'root'
})
export class PlayerProfileService {
  private readonly baseUrl = '/api/player-profile';
  private http = inject(HttpClient);

  /**
   * Vérifie si le challenge est ouvert
   */
  getStatus(): Observable<ChallengeStatusResponse> {
    return this.http.get<{ success: boolean; data: ChallengeStatusResponse }>(`${this.baseUrl}/status`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors de la vérification du statut:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Ouvre le challenge (admin uniquement)
   */
  openChallenge(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/open`, {}).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'ouverture du challenge:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Ferme le challenge (admin uniquement)
   */
  closeChallenge(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/close`, {}).pipe(
      catchError(error => {
        console.error('Erreur lors de la fermeture du challenge:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Soumet un profil joueur
   */
  submitProfile(profile: PlayerProfile): Observable<{ message: string; profile: EnrichedProfile }> {
    // Transformer la structure plate du frontend vers la structure imbriquée du backend
    const backendFormat = {
      name: profile.name,
      skills: profile.skills,
      preferredRole: this.mapRole(profile.preferredRole),
      motivation: {
        energyLevel: profile.energyLevel,
        workStyle: this.mapWorkStyle(profile.workStyle),
        specialSkill: profile.specialSkill || '',
        pastExperience: profile.pastExperience || ''
      }
    };

    return this.http.post<{ message: string; profile: EnrichedProfile }>(`${this.baseUrl}/submit`, backendFormat).pipe(
      catchError(error => {
        console.error('Erreur lors de la soumission du profil:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mappe le rôle du frontend vers le format backend
   */
  private mapRole(role: string): 'strategist' | 'developer' | 'electronician' | 'designer' {
    const roleMap: Record<string, 'strategist' | 'developer' | 'electronician' | 'designer'> = {
      'leader': 'strategist',
      'developer': 'developer',
      'electronics': 'electronician',
      'mechanics': 'designer',
      'generalist': 'developer'
    };
    return roleMap[role] || 'developer';
  }

  /**
   * Mappe le style de travail du frontend vers le format backend
   */
  private mapWorkStyle(workStyle: string): 'methodical' | 'creative' | 'fast' | 'analytical' {
    const workStyleMap: Record<string, 'methodical' | 'creative' | 'fast' | 'analytical'> = {
      'independent': 'analytical',
      'collaborative': 'creative',
      'balanced': 'methodical'
    };
    return workStyleMap[workStyle] || 'methodical';
  }

  /**
   * Récupère son propre profil
   */
  getMyProfile(): Observable<EnrichedProfile | null> {
    return this.http.get<EnrichedProfile>(`${this.baseUrl}/me`).pipe(
      map(profile => profile || null),
      catchError(error => {
        if (error.status === 404) {
          return [null];
        }
        console.error('Erreur lors de la récupération du profil:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère son profil enrichi avec classe et suggestions
   */
  getEnrichedProfile(): Observable<EnrichedProfile | null> {
    return this.http.get<{
      success: boolean;
      data: {
        profile: any | null;
        playerClass?: string;
        overallScore?: number;
        suggestions?: string[];
      }
    }>(`${this.baseUrl}/me/enriched`).pipe(
      map(response => {
        // Gérer le cas où il n'y a pas de profil
        if (!response.data || !response.data.profile) {
          return null;
        }

        const backendProfile = response.data.profile;

        // Aplatir la structure imbriquée du backend vers EnrichedProfile
        // Backend: { name, skills, preferredRole, motivation: { energyLevel, workStyle, ... } }
        // Frontend: { name, skills, preferredRole, energyLevel, workStyle, ... }
        const enriched: EnrichedProfile = {
          userId: backendProfile.userId || '',
          email: backendProfile.email || '',
          name: backendProfile.name,
          skills: backendProfile.skills,
          preferredRole: backendProfile.preferredRole,
          energyLevel: backendProfile.motivation?.energyLevel || 3,
          workStyle: backendProfile.motivation?.workStyle || 'balanced',
          specialSkill: backendProfile.motivation?.specialSkill || '',
          pastExperience: backendProfile.motivation?.pastExperience || '',
          playerClass: response.data.playerClass || '',
          overallScore: response.data.overallScore || 0,
          suggestions: response.data.suggestions || [],
          createdAt: backendProfile.createdAt || new Date().toISOString()
        };

        return enriched;
      }),
      catchError(error => {
        if (error.status === 404) {
          return [null];
        }
        console.error('Erreur lors de la récupération du profil enrichi:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère tous les profils (admin uniquement)
   */
  getAllProfiles(): Observable<EnrichedProfile[]> {
    return this.http.get<{ profiles: EnrichedProfile[] }>(`${this.baseUrl}/all`).pipe(
      map(response => response.profiles || []),
      catchError(error => {
        console.error('Erreur lors de la récupération de tous les profils:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les statistiques (admin uniquement)
   */
  getStats(): Observable<PlayerProfileStats> {
    return this.http.get<{ stats: PlayerProfileStats }>(`${this.baseUrl}/stats`).pipe(
      map(response => response.stats),
      catchError(error => {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère le profil d'un utilisateur spécifique (admin uniquement)
   */
  getUserProfile(userId: string): Observable<EnrichedProfile | null> {
    return this.http.get<EnrichedProfile>(`${this.baseUrl}/${userId}`).pipe(
      map(profile => profile || null),
      catchError(error => {
        if (error.status === 404) {
          return [null];
        }
        console.error(`Erreur lors de la récupération du profil de l'utilisateur ${userId}:`, error);
        return throwError(() => error);
      })
    );
  }
}
