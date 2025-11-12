# 📚 Librairies Partagées - WizardConsole

## 🎯 Vue d'ensemble

Ce répertoire contient les librairies partagées Nx utilisables à la fois dans le **backend NestJS** et le **frontend Angular**. Ces librairies garantissent la cohérence des types et la réutilisation du code métier.

## 📦 Librairies Disponibles

### 👥 shared-teams
Gestion des équipes de hackathon

**Contenu :**
- **Interfaces** : `Team`, `TeamMember`, `TeamStatus`, `RobotConfig`
- **Modèles** : `TeamModel`, `TeamMemberModel` avec méthodes utilitaires
- **Services** : `TeamValidationService` pour validation côté client/serveur
- **Types** : Types utilitaires pour événements, statistiques, filtres

### 🎓 shared-students
Gestion des étudiants et formation d'équipes

**Contenu :**
- **Interfaces** : `Student`, `SkillProfile`, `StudentPreferences`
- **Modèles** : `StudentModel` avec calculs de compatibilité
- **Services** : `StudentValidationService` pour validation complète
- **Types** : Types pour algorithmes de formation d'équipes, analytics

## 🚀 Installation et Usage

### 1. Build des librairies

```bash
# Build la librairie teams
nx build shared-teams

# Build la librairie students  
nx build shared-students

# Build toutes les librairies partagées
nx run-many --target=build --projects=shared-teams,shared-students
```

### 2. Usage dans le Backend NestJS

```typescript
// Dans un service NestJS
import { TeamModel, TeamValidationService } from '@wizard-console/shared-teams';
import { StudentModel, StudentValidationService } from '@wizard-console/shared-students';

@Injectable()
export class TeamsService {
  constructor() {}

  async createTeam(createTeamDto: CreateTeamDto) {
    // Validation avec la librairie partagée
    const validation = TeamValidationService.validateCreateTeam(createTeamDto);
    
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors);
    }

    // Création avec le modèle partagé
    const team = new TeamModel(createTeamDto);
    
    return team;
  }

  async getTeamBalance(team: Team) {
    const teamModel = new TeamModel(team);
    return {
      averageSkills: teamModel.getAverageSkills(),
      isComplete: teamModel.isComplete(),
      hasMinimumSkills: teamModel.hasMinimumSkills()
    };
  }
}
```

### 3. Usage dans le Frontend Angular

```typescript
// Dans un service Angular
import { Injectable } from '@angular/core';
import { TeamModel, Team, ValidationResult } from '@wizard-console/shared-teams';
import { StudentModel, Student } from '@wizard-console/shared-students';

@Injectable({ providedIn: 'root' })
export class TeamFormationService {
  
  validateTeamForm(teamData: any): ValidationResult {
    return TeamValidationService.validateCreateTeam(teamData);
  }

  calculateTeamStats(team: Team) {
    const teamModel = new TeamModel(team);
    
    return {
      captain: teamModel.getCaptain(),
      isComplete: teamModel.isComplete(),
      averageSkills: teamModel.getAverageSkills(),
      connectionStatus: teamModel.getConnectionStatusColor(),
      timeSinceLastSeen: teamModel.getTimeSinceLastSeen()
    };
  }

  generateStudentCard(student: Student): string {
    const studentModel = new StudentModel(student);
    return studentModel.toPlayerCard();
  }
}
```

```typescript
// Dans un composant Angular
import { Component } from '@angular/core';
import { Team, TeamMember, Student } from '@wizard-console/shared-teams';

@Component({
  selector: 'app-team-dashboard',
  template: `
    <div class="team-card" *ngFor="let team of teams">
      <h3>{{ team.displayName }}</h3>
      <div class="team-status" [ngStyle]="{ color: getStatusColor(team) }">
        {{ team.status.connection }}
      </div>
      <div class="team-skills">
        <span *ngFor="let skill of getTeamSkills(team)">
          {{ skill.category }}: {{ skill.level }}/5
        </span>
      </div>
      <div class="team-members">
        <div *ngFor="let member of team.members" class="member">
          {{ member.displayName }} ({{ member.role }})
        </div>
      </div>
    </div>
  `
})
export class TeamDashboardComponent {
  teams: Team[] = [];

  getStatusColor(team: Team): string {
    const teamModel = new TeamModel(team);
    return teamModel.getConnectionStatusColor();
  }

  getTeamSkills(team: Team) {
    const teamModel = new TeamModel(team);
    const skills = teamModel.getAverageSkills();
    return Object.entries(skills).map(([category, level]) => ({
      category,
      level: Math.round(level)
    }));
  }
}
```

## 🛠️ Configuration Nx

### Ajout au tsconfig

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@wizard-console/shared-teams": ["libs/shared/teams/src/index.ts"],
      "@wizard-console/shared-students": ["libs/shared/students/src/index.ts"]
    }
  }
}
```

### Dépendances entre projets

```json
// Dans package.json du backend ou frontend
{
  "dependencies": {
    "@wizard-console/shared-teams": "file:../../../dist/libs/shared/teams",
    "@wizard-console/shared-students": "file:../../../dist/libs/shared/students"
  }
}
```

## 🧪 Tests

```bash
# Tests unitaires pour la librairie teams
nx test shared-teams

# Tests unitaires pour la librairie students
nx test shared-students

# Tests avec couverture
nx test shared-teams --coverage
nx test shared-students --coverage
```

## 📋 Exemples d'Usage Avancé

### Formation d'équipes automatisée

```typescript
import { StudentModel, TeamFormationConfig } from '@wizard-console/shared-students';
import { TeamModel } from '@wizard-console/shared-teams';

// Service de formation d'équipes
export class AutoTeamFormationService {
  
  async formTeamsAutomatically(
    students: Student[], 
    config: TeamFormationConfig
  ): Promise<TeamFormationResult> {
    
    const studentModels = students.map(s => new StudentModel(s));
    
    // Calcul des compatibilités
    const compatibilityMatrix = this.calculateCompatibilityMatrix(studentModels);
    
    // Algorithme de formation
    const teams = await this.runFormationAlgorithm(studentModels, config);
    
    return {
      teams: teams.map(members => this.createBalancedTeam(members)),
      scores: this.calculateFormationScores(teams)
    };
  }

  private createBalancedTeam(members: StudentModel[]) {
    const team = new TeamModel({
      name: this.generateTeamName(),
      members: members.map(s => this.studentToTeamMember(s))
    });

    return {
      team,
      balance: team.getAverageSkills(),
      strengths: this.analyzeTeamStrengths(members),
      recommendations: this.getTeamRecommendations(team)
    };
  }
}
```

### Validation temps réel côté frontend

```typescript
// Dans un reactive form Angular
export class TeamCreationFormComponent {
  teamForm = this.fb.group({
    name: ['', [Validators.required, this.teamNameValidator]],
    members: this.fb.array([])
  });

  // Validator personnalisé utilisant la librairie partagée
  teamNameValidator = (control: AbstractControl): ValidationErrors | null => {
    const validation = TeamValidationService.validateCreateTeam({
      name: control.value,
      displayName: control.value,
      color: '#007bff',
      members: []
    });

    return validation.isValid ? null : { teamName: validation.errors };
  };

  onSubmit() {
    const formValue = this.teamForm.value;
    const validation = TeamValidationService.validateCreateTeam(formValue);
    
    if (!validation.isValid) {
      this.showValidationErrors(validation.errors);
      return;
    }

    // Proceed with team creation
    this.createTeam(formValue);
  }
}
```

## 🎯 Bonnes Pratiques

### 1. **Cohérence des Types**
- Toujours utiliser les interfaces partagées
- Éviter la duplication de types entre frontend/backend

### 2. **Validation Partagée**
- Utiliser les services de validation côté client ET serveur
- Garder la même logique de validation partout

### 3. **Modèles Riches**
- Utiliser les méthodes utilitaires des modèles
- Encapsuler la logique métier dans les classes

### 4. **Performance**
- Builder seulement les librairies modifiées
- Utiliser le cache Nx pour les builds

### 5. **Versionning**
- Versionner les librairies indépendamment
- Utiliser semantic versioning pour les breaking changes

## 🔄 Workflow de Développement

1. **Modification d'une librairie**
   ```bash
   # Faire les changements dans libs/shared/teams ou libs/shared/students
   nx build shared-teams
   ```

2. **Tests automatiques**
   ```bash
   nx test shared-teams --watch
   ```

3. **Usage dans les apps**
   ```bash
   # Le backend et frontend utilisent automatiquement la version buildée
   nx serve backend
   nx serve frontend
   ```

4. **Validation complète**
   ```bash
   nx run-many --target=build --all
   nx run-many --target=test --all
   nx run-many --target=lint --all
   ```

Ces librairies partagées garantissent la cohérence et la maintenabilité du code entre le backend NestJS et le frontend Angular ! 🎉