import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil, interval, combineLatest } from 'rxjs';
import { ChallengeService } from '../../../../core/services/challenge.service';
import {
  ChallengeUIState,
  TeamState,
  LeaderboardEntry,
  LiveData,
  LogEvent,
  ChallengeDisplayConfig
} from '../../models/challenge.models';
import {
  ChallengeStatus,
  Team,
  RobotTelemetry
} from '@wizard-console/challenge';

/**
 * Page du challenge Tron Legacy Circuit
 *
 * Cette page gère l'affichage et le contrôle du premier challenge :
 * - Circuit ovale d'initiation
 * - Chronométrage en temps réel
 * - Tableau des scores (leaderboard)
 * - Télémétrie des robots
 * - Contrôles administrateur (démarrage, arrêt)
 */
@Component({
  selector: 'app-tron-legacy-circuit',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './tron-legacy-circuit.component.html',
  styleUrl: './tron-legacy-circuit.component.scss'
})
export class TronLegacyCircuitComponent implements OnInit, OnDestroy {
  private challengeService = inject(ChallengeService);
  private destroy$ = new Subject<void>();

  // Données du challenge
  challengeState: ChallengeUIState | null = null;
  registeredTeams: TeamState[] = [];
  liveData: Record<string, LiveData> = {};
  logs: LogEvent[] = [];

  // Configuration d'affichage
  displayConfig: ChallengeDisplayConfig = {
    showTelemetry: true,
    showSensorData: true,
    showPIDValues: false,
    updateInterval: 1000,
    maxLogEntries: 50,
    theme: 'tron'
  };

  // État UI
  selectedTeam: string | null = null;
  isCountdownActive = false;
  countdownValue = '';
  challengeId = 'tron-legacy-circuit';

  // Constantes
  readonly ChallengeStatus = ChallengeStatus;

  ngOnInit() {
    this.initializeChallenge();
    this.subscribeToUpdates();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise le challenge au chargement de la page
   */
  private async initializeChallenge() {
    try {
      // Charger les challenges disponibles
      await this.challengeService.loadAvailableChallenges().toPromise();

      // Charger les détails du challenge Tron Legacy
      const challengeDetails = await this.challengeService.getChallengeDetails(this.challengeId).toPromise();

      if (challengeDetails) {
        this.challengeState = {
          config: challengeDetails.config,
          participants: [],
          isActive: false,
          leaderboard: [],
          countdown: {
            active: false,
            value: null
          }
        };

        this.addLog('info', 'system', `Challenge ${challengeDetails.config.name} initialisé`);
      }
    } catch (error) {
      this.addLog('error', 'system', `Erreur lors de l'initialisation: ${error}`);
    }
  }

  /**
   * S'abonne aux mises à jour en temps réel
   */
  private subscribeToUpdates() {
    // Mise à jour périodique des données
    interval(this.displayConfig.updateInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateLiveData();
      });

    // Écouter les équipes enregistrées
    this.challengeService.registeredTeams$
      .pipe(takeUntil(this.destroy$))
      .subscribe(teams => {
        this.registeredTeams = teams.map(team => ({
          team,
          status: ChallengeStatus.WAITING,
          isOnline: true,
          batteryLevel: Math.floor(Math.random() * 40) + 60, // Simulation
          lastUpdate: Date.now()
        }));

        this.updateLeaderboard();
      });

    // Écouter les challenges actifs
    this.challengeService.activeChallenges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(activeChallenges => {
        const tronChallenge = activeChallenges.find(c => c.challengeId === this.challengeId);
        if (tronChallenge && this.challengeState) {
          this.challengeState.isActive = tronChallenge.status === ChallengeStatus.IN_PROGRESS;
          this.updateParticipants(tronChallenge.teamId, tronChallenge.status);
        }
      });
  }

  /**
   * Met à jour les données en temps réel
   */
  private updateLiveData() {
    this.registeredTeams.forEach(teamState => {
      if (teamState.status === ChallengeStatus.IN_PROGRESS) {
        // Simuler des données de télémétrie
        this.liveData[teamState.team.id] = this.generateMockLiveData(teamState.team.id);
      }
    });
  }

  /**
   * Met à jour les participants du challenge
   */
  private updateParticipants(teamId: string, status: ChallengeStatus) {
    const teamIndex = this.registeredTeams.findIndex(t => t.team.id === teamId);
    if (teamIndex >= 0) {
      this.registeredTeams[teamIndex].status = status;
      this.registeredTeams[teamIndex].lastUpdate = Date.now();

      if (status === ChallengeStatus.IN_PROGRESS) {
        this.registeredTeams[teamIndex].startTime = Date.now();
        this.addLog('success', teamId, 'Challenge démarré');
      }
    }
  }

  /**
   * Met à jour le leaderboard
   */
  private updateLeaderboard() {
    if (!this.challengeState) return;

    this.challengeState.leaderboard = this.registeredTeams
      .map((teamState, index) => ({
        teamId: teamState.team.id,
        teamName: teamState.team.name,
        position: index + 1,
        score: this.calculateTeamScore(teamState),
        completedLaps: this.getCompletedLaps(teamState.team.id),
        status: teamState.status,
        bestLapTime: this.getBestLapTime(teamState.team.id),
        totalTime: this.getTotalTime(teamState.team.id),
        averageTime: this.getAverageTime(teamState.team.id)
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, position: index + 1 }));
  }

  /**
   * Actions utilisateur
   */

  /**
   * Enregistre une nouvelle équipe
   */
  async registerTeam(teamData: { name: string; id: string; members?: string[] }) {
    try {
      const team = await this.challengeService.registerTeam(teamData).toPromise();
      this.addLog('success', 'system', `Équipe ${team?.name} enregistrée`);
    } catch (error) {
      this.addLog('error', 'system', `Erreur enregistrement équipe: ${error}`);
    }
  }

  /**
   * Demande un challenge pour une équipe
   */
  async requestChallenge(teamId: string) {
    try {
      const result = await this.challengeService.requestChallenge(teamId, this.challengeId).toPromise();

      if (result?.status === ChallengeStatus.ACCEPTED) {
        this.addLog('success', teamId, 'Challenge accepté - En attente du décompte');
      } else {
        this.addLog('warning', teamId, `Challenge refusé: ${result?.message || 'Raison inconnue'}`);
      }
    } catch (error) {
      this.addLog('error', teamId, `Erreur demande challenge: ${error}`);
    }
  }

  /**
   * Démarre un challenge pour une équipe
   */
  async startChallenge(teamId: string) {
    try {
      // Démarrer le décompte
      await this.startCountdown();

      // Après le décompte, démarrer effectivement le challenge
      setTimeout(async () => {
        const result = await this.challengeService.startChallenge(teamId, this.challengeId).toPromise();
        this.addLog('info', teamId, 'Challenge démarré!');
      }, 4000); // 3-2-1-GO = 4 secondes

    } catch (error) {
      this.addLog('error', teamId, `Erreur démarrage challenge: ${error}`);
    }
  }

  /**
   * Lance le décompte avant un challenge
   */
  private async startCountdown() {
    this.isCountdownActive = true;
    if (this.challengeState) {
      this.challengeState.countdown!.active = true;
    }

    const countdownValues = ['3', '2', '1', 'GO'];

    for (const value of countdownValues) {
      this.countdownValue = value;
      if (this.challengeState) {
        this.challengeState.countdown!.value = value;
      }

      this.addLog('info', 'system', `Décompte: ${value}`);
      await this.delay(1000);
    }

    this.isCountdownActive = false;
    if (this.challengeState) {
      this.challengeState.countdown!.active = false;
      this.challengeState.countdown!.value = null;
    }
  }

  /**
   * Sélectionne une équipe pour affichage détaillé
   */
  selectTeam(teamId: string) {
    this.selectedTeam = this.selectedTeam === teamId ? null : teamId;
  }

  /**
   * Obtient les données live d'une équipe
   */
  getTeamLiveData(teamId: string): LiveData | null {
    return this.liveData[teamId] || null;
  }

  /**
   * Obtient l'état d'une équipe
   */
  getTeamState(teamId: string): TeamState | null {
    return this.registeredTeams.find(t => t.team.id === teamId) || null;
  }

  /**
   * Méthodes utilitaires
   */

  private calculateTeamScore(teamState: TeamState): number {
    // Score basique basé sur le statut
    switch (teamState.status) {
      case ChallengeStatus.COMPLETED: return 100;
      case ChallengeStatus.IN_PROGRESS: return 50;
      case ChallengeStatus.ACCEPTED: return 25;
      default: return 0;
    }
  }

  private getCompletedLaps(teamId: string): number {
    return Math.floor(Math.random() * 5); // Simulation
  }

  private getBestLapTime(teamId: string): number | undefined {
    return Math.random() * 30000 + 15000; // Simulation: 15-45 secondes
  }

  private getTotalTime(teamId: string): number | undefined {
    return Math.random() * 120000 + 60000; // Simulation: 1-3 minutes
  }

  private getAverageTime(teamId: string): number | undefined {
    const bestLap = this.getBestLapTime(teamId);
    return bestLap ? bestLap * 1.1 : undefined;
  }

  private generateMockLiveData(teamId: string): LiveData {
    return {
      teamId,
      telemetry: this.challengeService.generateMockTelemetry(teamId),
      currentSpeed: Math.floor(Math.random() * 40) + 60,
      isFollowingLine: Math.random() > 0.2,
      sensorValues: [
        Math.floor(Math.random() * 400) + 100,
        Math.floor(Math.random() * 600) + 400,
        Math.floor(Math.random() * 400) + 100
      ],
      batteryVoltage: 7.2 + (Math.random() - 0.5) * 0.8,
      errors: Math.random() > 0.9 ? ['Sensor noise detected'] : [],
      timestamp: Date.now()
    };
  }

  private addLog(level: 'info' | 'warning' | 'error' | 'success', source: string, message: string) {
    const logEvent: LogEvent = {
      timestamp: Date.now(),
      level,
      source,
      message
    };

    this.logs.unshift(logEvent);

    // Limiter le nombre d'entrées de log
    if (this.logs.length > this.displayConfig.maxLogEntries) {
      this.logs = this.logs.slice(0, this.displayConfig.maxLogEntries);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Formatage pour l'affichage
   */
  formatTime(ms: number | undefined): string {
    if (!ms) return '--:--';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }

  formatBattery(level: number | undefined): string {
    if (!level) return '--';
    return `${level}%`;
  }

  formatSpeed(speed: number): string {
    return `${speed}%`;
  }

  getStatusColor(status: ChallengeStatus): string {
    switch (status) {
      case ChallengeStatus.WAITING: return '#FFA500';
      case ChallengeStatus.ACCEPTED: return '#00FF00';
      case ChallengeStatus.IN_PROGRESS: return '#0088FF';
      case ChallengeStatus.COMPLETED: return '#00FF88';
      case ChallengeStatus.FAILED: return '#FF4444';
      case ChallengeStatus.DENIED: return '#FF8800';
      default: return '#CCCCCC';
    }
  }

  getLogLevelIcon(level: string): string {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  }

  /**
   * Méthodes d'aide pour le template
   */
  getActiveTeamsCount(): number {
    return this.registeredTeams.filter(team => team.status === ChallengeStatus.IN_PROGRESS).length;
  }

  trackByTeamId(index: number, entry: LeaderboardEntry): string {
    return entry.teamId;
  }

  trackByTimestamp(index: number, log: LogEvent): number {
    return log.timestamp;
  }
}
