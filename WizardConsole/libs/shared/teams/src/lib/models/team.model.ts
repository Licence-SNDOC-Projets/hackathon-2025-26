import { Team, TeamMember, TeamStatus, RobotConfig, SkillLevel, TeamRole } from '../interfaces/team.interface';

/**
 * Classe modèle pour l'équipe avec méthodes utilitaires
 */
export class TeamModel implements Team {
  id: string;
  name: string;
  displayName: string;
  color: string;
  members: TeamMember[];
  status: TeamStatus;
  robotConfig: RobotConfig;
  currentChallenge?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Team>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.displayName = data.displayName || '';
    this.color = data.color || '#007bff';
    this.members = data.members || [];
    this.status = data.status || {
      connection: 'unknown',
      batteryLevel: 0,
      lastSeen: new Date(),
      currentActivity: 'idle'
    };
    this.robotConfig = data.robotConfig || {
      speed: 50,
      pidKp: 1.0,
      pidKi: 0.1,
      pidKd: 0.05,
      sensorSensitivity: 50,
      customSettings: {}
    };
    this.currentChallenge = data.currentChallenge;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Obtient le capitaine de l'équipe
   */
  getCaptain(): TeamMember | undefined {
    return this.members.find(member => member.role === 'captain');
  }

  /**
   * Vérifie si l'équipe est complète (4 membres)
   */
  isComplete(): boolean {
    return this.members.length === 4;
  }

  /**
   * Obtient les compétences moyennes de l'équipe
   */
  getAverageSkills(): Record<string, number> {
    const skillAverages: Record<string, number> = {};
    
    if (this.members.length === 0) return skillAverages;

    // Collecter toutes les catégories de compétences
    const allCategories = new Set<string>();
    this.members.forEach(member => {
      member.skills.forEach(skill => {
        allCategories.add(skill.category);
      });
    });

    // Calculer la moyenne pour chaque catégorie
    allCategories.forEach(category => {
      const levels = this.members
        .flatMap(member => member.skills)
        .filter(skill => skill.category === category)
        .map(skill => skill.level);
      
      if (levels.length > 0) {
        skillAverages[category] = levels.reduce((a, b) => a + b, 0) / levels.length;
      }
    });

    return skillAverages;
  }

  /**
   * Vérifie si l'équipe a les compétences minimales requises
   */
  hasMinimumSkills(): boolean {
    const averageSkills = this.getAverageSkills();
    const requiredSkills = ['programming', 'electronics'];
    
    return requiredSkills.every(skill => 
      averageSkills[skill] && averageSkills[skill] >= 2
    );
  }

  /**
   * Obtient le statut de connexion avec couleur
   */
  getConnectionStatusColor(): string {
    switch (this.status.connection) {
      case 'online': return '#28a745'; // Vert
      case 'offline': return '#dc3545'; // Rouge
      default: return '#6c757d'; // Gris
    }
  }

  /**
   * Vérifie si la batterie est faible
   */
  isLowBattery(): boolean {
    return this.status.batteryLevel < 20;
  }

  /**
   * Obtient le temps depuis la dernière connexion
   */
  getTimeSinceLastSeen(): string {
    const now = new Date();
    const diff = now.getTime() - this.status.lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `Il y a ${days} jour(s)`;
  }

  /**
   * Met à jour la configuration du robot
   */
  updateRobotConfig(newConfig: Partial<RobotConfig>): void {
    this.robotConfig = { ...this.robotConfig, ...newConfig };
    this.updatedAt = new Date();
  }

  /**
   * Ajoute un membre à l'équipe
   */
  addMember(member: TeamMember): boolean {
    if (this.members.length >= 4) {
      return false; // Équipe complète
    }
    
    // Vérifier si le membre n'existe pas déjà
    const exists = this.members.some(m => m.email === member.email);
    if (exists) {
      return false;
    }
    
    this.members.push(member);
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Retire un membre de l'équipe
   */
  removeMember(memberId: string): boolean {
    const initialLength = this.members.length;
    this.members = this.members.filter(m => m.id !== memberId);
    
    if (this.members.length < initialLength) {
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Sérialise l'équipe pour l'envoi MQTT
   */
  toMqttPayload(): string {
    return JSON.stringify({
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      status: this.status,
      robotConfig: this.robotConfig,
      currentChallenge: this.currentChallenge,
      memberCount: this.members.length
    });
  }

  /**
   * Crée une équipe depuis les données MQTT
   */
  static fromMqttPayload(payload: string): TeamModel {
    try {
      const data = JSON.parse(payload);
      return new TeamModel(data);
    } catch (error) {
      throw new Error(`Invalid MQTT payload: ${error}`);
    }
  }
}

/**
 * Classe utilitaire pour la gestion des membres d'équipe
 */
export class TeamMemberModel implements TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  role: TeamRole;
  skills: SkillLevel[];
  isActive: boolean;
  joinedAt: Date;

  constructor(data: Partial<TeamMember>) {
    this.id = data.id || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.displayName = data.displayName || `${data.firstName} ${data.lastName}`;
    this.email = data.email || '';
    this.role = data.role || 'developer';
    this.skills = data.skills || [];
    this.isActive = data.isActive ?? true;
    this.joinedAt = data.joinedAt || new Date();
  }

  /**
   * Obtient le nom complet
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Obtient la compétence la plus forte
   */
  getStrongestSkill(): SkillLevel | undefined {
    return this.skills.reduce((max, skill) => 
      skill.level > (max?.level || 0) ? skill : max, 
      undefined as SkillLevel | undefined
    );
  }

  /**
   * Obtient le niveau pour une compétence spécifique
   */
  getSkillLevel(category: string): number {
    const skill = this.skills.find(s => s.category === category);
    return skill?.level || 0;
  }

  /**
   * Vérifie si le membre a un rôle de leadership
   */
  isLeader(): boolean {
    return this.role === 'captain';
  }

  /**
   * Crée une fiche joueur style gaming
   */
  toPlayerCard(): string {
    const strongest = this.getStrongestSkill();
    return `
╔══════════════════════════════════════╗
║ 🎮 ${this.displayName.padEnd(30)} ║
║ ${this.role.toUpperCase().padEnd(35)} ║
╠══════════════════════════════════════╣
${this.skills.map(skill => 
  `║ ${skill.category}: ${'⭐'.repeat(skill.level)}${'☆'.repeat(5-skill.level)} (${skill.level}/5) ║`
).join('\n')}
╠══════════════════════════════════════╣
║ ✨ ATOUT SPÉCIAL: ${strongest?.category || 'Polyvalent'} ║
╚══════════════════════════════════════╝`;
  }
}