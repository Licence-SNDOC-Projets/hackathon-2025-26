import {
  BaseChallenge,
  ChallengeConfig,
  ChallengeResult,
  ChallengeStatus,
  Team
} from '../challenge';
import { RegisterChallenge } from '../challenge-registry';
import { PlayerProfile } from '../player-profile-types';
import {
  TeamInfo,
  TeamMember,
  TeamProfile,
  BacklogPlayer,
  calculateTeamProfile,
  validateTeamName
} from '../team-formation-types';

/**
 * Challenge "Guild.join() - Squad Assembly"
 *
 * Permet aux participants de former des équipes en consultant les profils
 * des autres joueurs et en rejoignant des équipes existantes ou en créant
 * de nouvelles équipes.
 */
@RegisterChallenge({
  id: 'team-formation',
  version: '1.0.0',
  author: 'WizardConsole Team',
  tags: ['onboarding', 'équipe', 'formation', 'collaboration']
})
export class TeamFormationChallenge extends BaseChallenge {

  private teams = new Map<string, TeamInfo>();
  private backlogPlayers = new Map<string, BacklogPlayer>();
  private userTeamMapping = new Map<string, string>(); // userId -> teamId

  constructor() {
    const config: ChallengeConfig = {
      id: 'team-formation',
      name: '🎮 Guild.join() - Squad Assembly',
      description: `Rejoignez l'une des 12 équipes du hackathon !
        Explorez les profils des players disponibles, analysez leurs skills,
        et choisissez la squad qui correspond à vos talents.
        Chaque équipe a une place limitée, alors choisissez stratégiquement !`,
      hasCountdown: false,
      customConfig: {
        maxTeams: 12,
        defaultMaxMembersPerTeam: 4,
        allowTeamCreation: false, // Les équipes sont pré-définies
        requiresAdminValidation: false
      }
    };

    super(config);

    // Initialiser les 12 équipes pré-définies du hackathon
    this.initializePredefinedTeams();
  }

  /**
   * Initialise les 12 équipes pré-définies du hackathon
   */
  private initializePredefinedTeams(): void {
    const predefinedTeams = [
      { name: 'BotRacers', emoji: '⚡' },
      { name: 'Les TurboBytes', emoji: '💨' },
      { name: 'RoboRush', emoji: '🤖' },
      { name: 'Code2Speed', emoji: '🚀' },
      { name: 'Les Overdrivés', emoji: '🔧' },
      { name: 'SpeedCtrl', emoji: '🕹️' },
      { name: 'Bit Racers', emoji: '🏁' },
      { name: 'The Debug Drivers', emoji: '🧠' },
      { name: 'Firmware Fury', emoji: '🔥' },
      { name: 'Les ChronoBots', emoji: '⏱️' },
      { name: "Hack 'n' Drift", emoji: '💻' },
      { name: 'Team LoopRacers', emoji: '🔁' }
    ];

    predefinedTeams.forEach(({ name, emoji }) => {
      const teamId = `team_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const now = new Date();

      this.teams.set(teamId, {
        id: teamId,
        name: `${emoji} ${name}`,
        members: [],
        createdAt: now,
        updatedAt: now,
        isComplete: false,
        maxMembers: 4
      });
    });

    console.log(`🎮 ${predefinedTeams.length} équipes pré-définies initialisées`);
  }

  /**
   * Vérifie si une équipe (utilisateur) peut participer
   */
  async canTeamParticipate(team: Team): Promise<boolean> {
    // Tout utilisateur avec un profil peut participer
    return !!team.id && !!team.name;
  }

  /**
   * Prépare le challenge pour un utilisateur
   */
  async prepareForTeam(team: Team): Promise<void> {
    // Vérifier si l'utilisateur a déjà une équipe
    if (!this.userTeamMapping.has(team.id)) {
      // Ajouter au backlog
      const player: BacklogPlayer = {
        userId: team.id,
        email: '', // Sera rempli lors de la soumission du profil
        name: team.name,
        profile: null as any, // Nécessite un profil
        addedAt: new Date()
      };
      this.backlogPlayers.set(team.id, player);
    }
  }

  /**
   * Démarre le challenge
   */
  async startChallenge(team: Team): Promise<void> {
    if (!this.isOpen()) {
      throw new Error('Challenge is closed');
    }
    // Pas d'action particulière au démarrage
  }

  /**
   * Crée une nouvelle équipe (désactivé - équipes pré-définies uniquement)
   */
  async createTeam(
    creatorUserId: string,
    creatorProfile: PlayerProfile,
    teamName: string
  ): Promise<TeamInfo> {
    throw new Error('La création d\'équipes est désactivée. Veuillez rejoindre une équipe existante.');
  }

  /**
   * Rejoint une équipe existante
   */
  async joinTeam(
    userId: string,
    userProfile: PlayerProfile,
    teamId: string
  ): Promise<TeamInfo> {
    // Vérifier que l'équipe existe
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Vérifier que l'utilisateur n'est pas déjà dans une équipe
    if (this.userTeamMapping.has(userId)) {
      throw new Error('User is already in a team');
    }

    // Vérifier que l'équipe n'est pas complète
    if (team.members.length >= (team.maxMembers || 4)) {
      throw new Error('Team is full');
    }

    // Ajouter le membre
    const newMember: TeamMember = {
      userId,
      email: userProfile.email,
      name: userProfile.name,
      profile: userProfile,
      joinedAt: new Date(),
      isCaptain: false
    };

    team.members.push(newMember);
    team.updatedAt = new Date();

    // Marquer comme complète si max atteint
    if (team.members.length >= (team.maxMembers || 4)) {
      team.isComplete = true;
    }

    this.userTeamMapping.set(userId, teamId);
    this.backlogPlayers.delete(userId);

    console.log(`✅ ${userProfile.name} a rejoint l'équipe "${team.name}"`);

    return team;
  }

  /**
   * Quitte une équipe
   */
  async leaveTeam(userId: string, userProfile: PlayerProfile): Promise<void> {
    const teamId = this.userTeamMapping.get(userId);
    if (!teamId) {
      throw new Error('User is not in any team');
    }

    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Retirer le membre
    const memberIndex = team.members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) {
      throw new Error('Member not found in team');
    }

    const member = team.members[memberIndex];
    team.members.splice(memberIndex, 1);
    team.updatedAt = new Date();
    team.isComplete = false;

    this.userTeamMapping.delete(userId);

    // Si c'était le capitaine et qu'il reste des membres, promouvoir quelqu'un
    if (member.isCaptain && team.members.length > 0) {
      team.members[0].isCaptain = true;
      console.log(`👑 ${team.members[0].name} est maintenant capitaine de "${team.name}"`);
    }

    // Si l'équipe est vide, la supprimer
    if (team.members.length === 0) {
      this.teams.delete(teamId);
      console.log(`🗑️ Équipe "${team.name}" supprimée (aucun membre)`);
    }

    // Remettre dans le backlog
    const backlogPlayer: BacklogPlayer = {
      userId,
      email: userProfile.email,
      name: userProfile.name,
      profile: userProfile,
      addedAt: new Date()
    };
    this.backlogPlayers.set(userId, backlogPlayer);

    console.log(`👋 ${userProfile.name} a quitté l'équipe "${team.name}"`);
  }

  /**
   * Obtient toutes les équipes
   */
  getAllTeams(): TeamInfo[] {
    return Array.from(this.teams.values());
  }

  /**
   * Obtient une équipe par son ID
   */
  getTeam(teamId: string): TeamInfo | null {
    return this.teams.get(teamId) || null;
  }

  /**
   * Obtient l'équipe d'un utilisateur
   */
  getUserTeam(userId: string): TeamInfo | null {
    const teamId = this.userTeamMapping.get(userId);
    if (!teamId) return null;
    return this.teams.get(teamId) || null;
  }

  /**
   * Obtient tous les joueurs dans le backlog
   */
  getBacklogPlayers(): BacklogPlayer[] {
    return Array.from(this.backlogPlayers.values());
  }

  /**
   * Obtient le profil agrégé d'une équipe
   */
  getTeamProfile(teamId: string): TeamProfile | null {
    const team = this.teams.get(teamId);
    if (!team) return null;
    return calculateTeamProfile(team);
  }

  /**
   * Met à jour le profil d'un joueur (dans son équipe ou backlog)
   */
  updatePlayerProfile(userId: string, profile: PlayerProfile): void {
    // Mettre à jour dans l'équipe si existe
    const teamId = this.userTeamMapping.get(userId);
    if (teamId) {
      const team = this.teams.get(teamId);
      if (team) {
        const member = team.members.find(m => m.userId === userId);
        if (member) {
          member.profile = profile;
          member.name = profile.name;
          member.email = profile.email;
          team.updatedAt = new Date();
        }
      }
    }

    // Mettre à jour dans le backlog si existe
    const backlogPlayer = this.backlogPlayers.get(userId);
    if (backlogPlayer) {
      backlogPlayer.profile = profile;
      backlogPlayer.name = profile.name;
      backlogPlayer.email = profile.email;
    }
  }

  /**
   * Traite la télémétrie (non utilisé pour ce challenge)
   */
  async processTelemetry(team: Team, data: any): Promise<void> {
    // Ce challenge n'utilise pas de télémétrie
    return;
  }

  /**
   * Calcule le score (non applicable)
   */
  async calculateScore(result: ChallengeResult): Promise<number> {
    // Pas de score pour ce challenge
    return 0;
  }

  /**
   * Vérifie si terminé (quand toutes les équipes sont complètes)
   */
  async isCompleted(team: Team): Promise<boolean> {
    return Array.from(this.teams.values()).every(t => t.isComplete);
  }

  /**
   * Nettoie (pas de nettoyage nécessaire)
   */
  async cleanup(team: Team): Promise<void> {
    // Les équipes sont conservées
    return;
  }

  /**
   * Réinitialise le challenge
   */
  reset(): void {
    this.teams.clear();
    this.backlogPlayers.clear();
    this.userTeamMapping.clear();
    this.close();
    console.log('🔄 Challenge Team Formation réinitialisé');
  }
}

export default TeamFormationChallenge;
