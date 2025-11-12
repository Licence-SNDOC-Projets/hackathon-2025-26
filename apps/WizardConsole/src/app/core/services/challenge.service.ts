import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, interval, of } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import {
  ChallengeConfig,
  Team,
  ChallengeStatus,
  RobotTelemetry,
  MQTTTopicBuilder,
  MQTTTopicParser,
  MQTTEventType
} from '@wizard-console/challenge';

/**
 * Interface pour les réponses de l'API
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

/**
 * Interface pour une équipe enregistrée
 */
interface RegisteredTeam extends Team {
  mqttTopics?: any;
}

/**
 * Interface pour l'état d'un challenge
 */
interface ChallengeState {
  challengeId: string;
  teamId: string;
  status: ChallengeStatus;
  startTime?: number;
  topics?: any;
}

/**
 * Service Angular pour la gestion des challenges côté frontend
 *
 * Ce service fait le lien entre l'interface utilisateur Angular et
 * l'API REST du backend qui utilise la librairie Challenge.
 */
@Injectable({
  providedIn: 'root'
})
export class ChallengeService implements OnDestroy {
  private readonly baseUrl = '/api/challenges';
  private destroy$ = new Subject<void>();

  // Observables pour l'état réactif
  private availableChallengesSubject = new BehaviorSubject<ChallengeConfig[]>([]);
  private registeredTeamsSubject = new BehaviorSubject<RegisteredTeam[]>([]);
  private activeChallengesSubject = new BehaviorSubject<ChallengeState[]>([]);
  private challengeStatsSubject = new BehaviorSubject<any>(null);

  // Accesseurs publics pour les observables
  public availableChallenges$ = this.availableChallengesSubject.asObservable();
  public registeredTeams$ = this.registeredTeamsSubject.asObservable();
  public activeChallenges$ = this.activeChallengesSubject.asObservable();
  public challengeStats$ = this.challengeStatsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeService();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise le service au démarrage
   */
  private initializeService() {
    // Charger les challenges disponibles
    this.loadAvailableChallenges();

    // Rafraîchir les statistiques toutes les 30 secondes
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadChallengeStats();
      });

    console.log('🎮 Service des challenges Angular initialisé');
  }

  /**
   * Charge la liste des challenges disponibles
   */
  loadAvailableChallenges(): Observable<ChallengeConfig[]> {
    return this.http.get<ApiResponse<ChallengeConfig[]>>(`${this.baseUrl}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.availableChallengesSubject.next(response.data);
            return response.data;
          }
          return [];
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des challenges:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtient les détails d'un challenge spécifique
   */
  getChallengeDetails(challengeId: string): Observable<any> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/${challengeId}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error(`Erreur lors du chargement du challenge ${challengeId}:`, error);
          throw error;
        })
      );
  }

  /**
   * Enregistre une nouvelle équipe
   */
  registerTeam(teamData: { name: string; id: string; members?: string[] }): Observable<RegisteredTeam> {
    return this.http.post<ApiResponse<{ team: RegisteredTeam; mqttTopics: any }>>(`${this.baseUrl}/teams/register`, teamData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            const registeredTeam = {
              ...response.data.team,
              mqttTopics: response.data.mqttTopics
            };

            // Mettre à jour la liste des équipes
            const currentTeams = this.registeredTeamsSubject.value;
            const updatedTeams = [...currentTeams, registeredTeam];
            this.registeredTeamsSubject.next(updatedTeams);

            console.log(`✅ Équipe ${registeredTeam.name} enregistrée avec succès`);
            return registeredTeam;
          }
          throw new Error(response.message || 'Erreur lors de l\'enregistrement');
        }),
        catchError(error => {
          console.error('Erreur lors de l\'enregistrement de l\'équipe:', error);
          throw error;
        })
      );
  }

  /**
   * Fait une demande de challenge pour une équipe
   */
  requestChallenge(teamId: string, challengeId: string): Observable<any> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/request`, { teamId, challengeId })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            // Mettre à jour l'état du challenge
            this.updateChallengeState({
              challengeId,
              teamId,
              status: response.data.status,
              topics: response.data.topics
            });

            return response.data;
          }
          throw new Error(response.message || 'Demande de challenge refusée');
        }),
        catchError(error => {
          console.error('Erreur lors de la demande de challenge:', error);
          throw error;
        })
      );
  }

  /**
   * Démarre un challenge pour une équipe
   */
  startChallenge(teamId: string, challengeId: string): Observable<any> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/start`, { teamId, challengeId })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            // Mettre à jour l'état du challenge
            this.updateChallengeState({
              challengeId,
              teamId,
              status: ChallengeStatus.IN_PROGRESS,
              startTime: response.data.startTime,
              topics: response.data.topics
            });

            console.log(`🚀 Challenge ${challengeId} démarré pour l'équipe ${teamId}`);
            return response.data;
          }
          throw new Error(response.message || 'Erreur lors du démarrage');
        }),
        catchError(error => {
          console.error('Erreur lors du démarrage du challenge:', error);
          throw error;
        })
      );
  }

  /**
   * Envoie des données de télémétrie
   */
  sendTelemetry(teamId: string, challengeId: string, telemetry: RobotTelemetry): Observable<any> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/telemetry`, { teamId, challengeId, telemetry })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Erreur lors de l\'envoi de télémétrie:', error);
          throw error;
        })
      );
  }

  /**
   * Obtient les topics MQTT pour une équipe
   */
  getTeamMQTTTopics(teamId: string): Observable<any> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/mqtt/topics/team/${teamId}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Erreur lors de la récupération des topics MQTT:', error);
          throw error;
        })
      );
  }

  /**
   * Parse un topic MQTT
   */
  parseMQTTTopic(topic: string): Observable<any> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/mqtt/parse-topic`, { topic })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Erreur lors du parsing du topic MQTT:', error);
          throw error;
        })
      );
  }

  /**
   * Charge les statistiques des challenges
   */
  loadChallengeStats(): Observable<any> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/stats`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.challengeStatsSubject.next(response.data);
            return response.data;
          }
          return null;
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des statistiques:', error);
          return of(null);
        })
      );
  }

  /**
   * Vérifie l'état de santé du service
   */
  checkHealth(): Observable<any> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/health`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Erreur lors de la vérification de santé:', error);
          throw error;
        })
      );
  }

  /**
   * Met à jour l'état d'un challenge
   */
  private updateChallengeState(newState: ChallengeState) {
    const currentStates = this.activeChallengesSubject.value;
    const existingIndex = currentStates.findIndex(
      state => state.challengeId === newState.challengeId && state.teamId === newState.teamId
    );

    if (existingIndex >= 0) {
      // Mettre à jour l'état existant
      const updatedStates = [...currentStates];
      updatedStates[existingIndex] = { ...updatedStates[existingIndex], ...newState };
      this.activeChallengesSubject.next(updatedStates);
    } else {
      // Ajouter un nouvel état
      const updatedStates = [...currentStates, newState];
      this.activeChallengesSubject.next(updatedStates);
    }
  }

  /**
   * Obtient l'état d'un challenge pour une équipe
   */
  getChallengeState(teamId: string, challengeId: string): ChallengeState | null {
    const currentStates = this.activeChallengesSubject.value;
    return currentStates.find(
      state => state.challengeId === challengeId && state.teamId === teamId
    ) || null;
  }

  /**
   * Supprime l'état d'un challenge
   */
  removeChallengeState(teamId: string, challengeId: string) {
    const currentStates = this.activeChallengesSubject.value;
    const filteredStates = currentStates.filter(
      state => !(state.challengeId === challengeId && state.teamId === teamId)
    );
    this.activeChallengesSubject.next(filteredStates);
  }

  /**
   * Méthodes utilitaires pour les topics MQTT
   */
  generateTeamTopics(teamId: string) {
    return MQTTTopicBuilder.team(teamId);
  }

  generateChallengeTopics(challengeId: string, teamId?: string) {
    return MQTTTopicBuilder.challenge(challengeId, teamId);
  }

  parseTopicClient(topic: string) {
    // Utilise les parsers côté client
    const teamTopic = MQTTTopicParser.parseTeamTopic(topic);
    if (teamTopic) return { type: 'team', ...teamTopic };

    const challengeTopic = MQTTTopicParser.parseChallengeTopic(topic);
    if (challengeTopic) return { type: 'challenge', ...challengeTopic };

    const beaconTopic = MQTTTopicParser.parseBeaconTopic(topic);
    if (beaconTopic) return { type: 'beacon', ...beaconTopic };

    return null;
  }

  /**
   * Simule des données de télémétrie pour les tests
   */
  generateMockTelemetry(teamId: string): RobotTelemetry {
    return {
      timestamp: Date.now(),
      sensors: {
        line_sensors: [200, 800, 150], // left, center, right
        distance: 25.5,
        battery_voltage: 7.2,
        motor_speeds: {
          left: 75,
          right: 72
        }
      },
      position: {
        x: 1.2,
        y: 0.8,
        orientation: 45
      },
      state: {
        current_speed: 75,
        following_line: true,
        challenge_active: true,
        errors: []
      },
      pid_values: {
        kp: 2.5,
        ki: 0.1,
        kd: 0.05,
        error: 15,
        integral: 2.3,
        derivative: -1.2,
        output: 8.7
      }
    };
  }
}
