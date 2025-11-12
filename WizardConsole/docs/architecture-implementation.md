# 🏗️ Spécifications d'Implémentation - WizardConsole

## 🚀 1. Configuration Workspace Nx

### Initialisation du projet
```bash
# Dans le dossier WizardConsole/
npx create-nx-workspace@latest . --preset=apps --packageManager=npm
cd WizardConsole

# Ajout des plugins NestJS et Angular
npm install @nx/nest @nx/angular
```

### Structure Nx proposée
```json
// nx.json
{
  "extends": "nx/presets/npm.json",
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json"
    ],
    "sharedGlobals": []
  }
}
```

## 🐳 2. Configuration Docker

### docker-compose.yml
```yaml
version: '3.8'

services:
  # MQTT Broker
  mosquitto:
    build: ./docker/mosquitto
    container_name: mqtt_broker
    ports:
      - "1883:1883"      # MQTT
      - "9001:9001"      # WebSocket
    volumes:
      - mqtt_data:/mosquitto/data
      - mqtt_logs:/mosquitto/log
    restart: unless-stopped

  # Backend NestJS
  backend:
    build: 
      context: .
      dockerfile: ./docker/backend/Dockerfile
    container_name: wizard_backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MQTT_BROKER_URL=mqtt://mosquitto:1883
      - BACKUP_INTERVAL=30000
    volumes:
      - ./packages/backend:/app
      - /app/node_modules
      - backup_data:/app/backups
    depends_on:
      - mosquitto
    restart: unless-stopped

  # Frontend Angular + Nginx
  frontend:
    build: 
      context: .
      dockerfile: ./docker/frontend/Dockerfile
    container_name: wizard_frontend
    ports:
      - "4200:80"
    volumes:
      - ./packages/frontend/dist:/usr/share/nginx/html
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mqtt_data:
  mqtt_logs:
  backup_data:
```

### Mosquitto Configuration
```ini
# docker/mosquitto/mosquitto.conf
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/

# WebSocket support pour le frontend
listener 9001
protocol websockets
allow_anonymous true

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_type all
```

## 🏗️ 3. Architecture Backend NestJS

### Structure modulaire des challenges
```typescript
// src/challenges/challenges.module.ts
@Module({
  imports: [
    SpeedrunModule,
    WiggleModule,
    CrashModule,
    LocalhostTrackModule,
    PimpMyBotModule,
    MqttModule,
    TeamsModule
  ],
  providers: [ChallengesService],
  controllers: [ChallengesController]
})
export class ChallengesModule {}
```

### Interface commune pour tous les challenges
```typescript
// src/challenges/interfaces/challenge.interface.ts
export interface Challenge {
  name: string;
  displayName: string;
  description: string;
  maxTeams: number;
  maxDuration: number; // en ms
  
  // Méthodes communes
  startChallenge(teamName: string): Promise<ChallengeSession>;
  stopChallenge(sessionId: string): Promise<ChallengeResult>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
}

export interface ChallengeSession {
  id: string;
  challengeName: string;
  teamName: string;
  startTime: number;
  status: 'waiting' | 'countdown' | 'running' | 'finished';
}

export interface ChallengeResult {
  sessionId: string;
  teamName: string;
  challengeName: string;
  totalTime: number;
  laps: number[];
  bestLap: number;
  ranking: number;
}
```

### Service MQTT central
```typescript
// src/mqtt/mqtt.service.ts
@Injectable()
export class MqttService {
  private client: MqttClient;
  private retainedState = new Map<string, string>();

  constructor() {
    this.client = connect(process.env.MQTT_BROKER_URL);
    this.setupEventHandlers();
  }

  // Publication avec retention automatique pour l'état
  async publishState(topic: string, payload: string): Promise<void> {
    await this.client.publish(topic, payload, { retain: true });
    this.retainedState.set(topic, payload);
  }

  // Publication transitoire (événements)
  async publishEvent(topic: string, payload: string): Promise<void> {
    await this.client.publish(topic, payload, { retain: false });
  }

  // Sauvegarde périodique de l'état retained
  async backupState(): Promise<void> {
    const backup = Object.fromEntries(this.retainedState);
    const timestamp = new Date().toISOString();
    await fs.writeFile(
      `./backups/state-${timestamp}.json`, 
      JSON.stringify(backup, null, 2)
    );
  }
}
```

## 🎯 4. Modules Challenge Spécifiques

### Exemple : Module Speedrun
```typescript
// src/challenges/speedrun/speedrun.service.ts
@Injectable()
export class SpeedrunService implements Challenge {
  name = 'speedrun';
  displayName = 'Tron Legacy Circuit';
  maxTeams = 1;
  maxDuration = 300000; // 5 minutes

  constructor(
    private mqttService: MqttService,
    private beaconService: BeaconService
  ) {}

  async startChallenge(teamName: string): Promise<ChallengeSession> {
    const sessionId = uuidv4();
    const session: ChallengeSession = {
      id: sessionId,
      challengeName: this.name,
      teamName,
      startTime: Date.now(),
      status: 'countdown'
    };

    // Publier l'acceptation
    await this.mqttService.publishState(
      `/challenges/${this.name}/${teamName}/status`, 
      'accepted'
    );

    // Démarrer le countdown
    await this.startCountdown(teamName);

    return session;
  }

  private async startCountdown(teamName: string): Promise<void> {
    const countdownValues = ['3', '2', '1', '0', 'GO'];
    
    await this.mqttService.publishState(
      `/challenges/${this.name}/countdown/active`, 
      'true'
    );

    for (const value of countdownValues) {
      await this.mqttService.publishEvent(
        `/challenges/${this.name}/countdown/value`, 
        value
      );
      
      if (value === 'GO') {
        // Démarrer le chronométrage automatique
        await this.startTiming(teamName);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await this.mqttService.publishState(
      `/challenges/${this.name}/countdown/active`, 
      'false'
    );
  }

  private async startTiming(teamName: string): Promise<void> {
    let lapCount = 0;
    const lapTimes: number[] = [];
    let lastBeaconTime = Date.now();

    // Écouter les passages de balises
    this.beaconService.onBeaconTriggered('start-line', (detectedTeam) => {
      if (detectedTeam === teamName) {
        const now = Date.now();
        
        if (lapCount > 0) {
          const lapTime = now - lastBeaconTime;
          lapTimes.push(lapTime);
          lapCount++;

          // Publier le temps de tour
          this.mqttService.publishState(
            `/challenges/${this.name}/scores/${teamName}/0/laps/${lapCount}`,
            lapTime.toString()
          );

          // Mettre à jour le meilleur tour
          const bestLap = Math.min(...lapTimes);
          this.mqttService.publishState(
            `/challenges/${this.name}/scores/${teamName}/0/bestlap`,
            bestLap.toString()
          );
        }

        lastBeaconTime = now;
      }
    });
  }
}
```

## 🌐 5. Architecture Frontend Angular

### Structure modulaire par challenge
```typescript
// src/app/app-routing.module.ts
const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: 'speedrun', loadChildren: () => import('./challenges/speedrun/speedrun.module').then(m => m.SpeedrunModule) },
  { path: 'wiggle', loadChildren: () => import('./challenges/wiggle/wiggle.module').then(m => m.WiggleModule) },
  { path: 'crash', loadChildren: () => import('./challenges/crash/crash.module').then(m => m.CrashModule) },
  { path: 'arbitre', loadChildren: () => import('./arbitre/arbitre.module').then(m => m.ArbitreModule) },
  { path: 'teams', loadChildren: () => import('./teams/teams.module').then(m => m.TeamsModule) }
];
```

### Service MQTT WebSocket
```typescript
// src/app/core/services/mqtt.service.ts
@Injectable({ providedIn: 'root' })
export class MqttService {
  private client: MqttClient;
  private state$ = new BehaviorSubject<Map<string, string>>(new Map());

  constructor() {
    this.client = connect('ws://localhost:9001');
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    // Écouter tous les topics d'état (retained)
    this.client.subscribe('/challenges/+/scores/+/+/+');
    this.client.subscribe('/challenges/+/leaderboard/+');
    this.client.subscribe('/teams/+/status/+');
    this.client.subscribe('/beacons/+/+');

    this.client.on('message', (topic, message) => {
      const payload = message.toString();
      const currentState = this.state$.value;
      currentState.set(topic, payload);
      this.state$.next(new Map(currentState));
    });
  }

  // Observable pour écouter les changements d'état
  getStateObservable(topicPattern: string): Observable<string> {
    return this.state$.pipe(
      map(state => {
        // Logique de filtrage par pattern
        const matchingTopics = Array.from(state.keys())
          .filter(topic => this.matchesPattern(topic, topicPattern));
        
        return matchingTopics.length > 0 ? 
          state.get(matchingTopics[0]) || '' : '';
      }),
      distinctUntilChanged()
    );
  }

  // Publication pour l'arbitre
  publish(topic: string, payload: string): void {
    this.client.publish(topic, payload);
  }
}
```

### Composant Dashboard Challenge
```typescript
// src/app/challenges/speedrun/speedrun-dashboard.component.ts
@Component({
  selector: 'app-speedrun-dashboard',
  template: `
    <div class="challenge-dashboard">
      <h2>🏁 {{ challengeInfo.displayName }}</h2>
      
      <!-- État de la piste -->
      <div class="track-status" [class.occupied]="isTrackOccupied$ | async">
        <span *ngIf="!(isTrackOccupied$ | async)">🟢 Piste Libre</span>
        <span *ngIf="isTrackOccupied$ | async">🔴 Piste Occupée</span>
      </div>

      <!-- Décompte actif -->
      <div *ngIf="countdownActive$ | async" class="countdown">
        <h1 class="countdown-value">{{ countdownValue$ | async }}</h1>
      </div>

      <!-- Classement en temps réel -->
      <app-leaderboard 
        [challengeName]="challengeInfo.name"
        [scores$]="scores$">
      </app-leaderboard>

      <!-- Contrôles arbitre -->
      <div *ngIf="isArbitre" class="arbitre-controls">
        <button (click)="startChallenge('alpha')">Démarrer Alpha</button>
        <button (click)="startChallenge('beta')">Démarrer Beta</button>
        <button (click)="stopChallenge()">Arrêter</button>
      </div>
    </div>
  `
})
export class SpeedrunDashboardComponent implements OnInit {
  challengeInfo = { name: 'speedrun', displayName: 'Tron Legacy Circuit' };
  
  isTrackOccupied$ = this.mqttService.getStateObservable('/challenges/speedrun/+/status')
    .pipe(map(status => status === 'accepted'));
    
  countdownActive$ = this.mqttService.getStateObservable('/challenges/speedrun/countdown/active')
    .pipe(map(active => active === 'true'));
    
  countdownValue$ = this.mqttService.getStateObservable('/challenges/speedrun/countdown/value');
  
  scores$ = this.mqttService.getStateObservable('/challenges/speedrun/scores/+/+/+')
    .pipe(
      map(this.parseScores),
      shareReplay(1)
    );

  constructor(
    private mqttService: MqttService,
    private authService: AuthService
  ) {}

  startChallenge(teamName: string): void {
    this.mqttService.publish(`/${teamName}/startchallenge`, 'speedrun');
  }

  private parseScores(rawScores: string): ScoreEntry[] {
    // Logique de parsing des scores depuis MQTT
    return [];
  }
}
```

## 💾 6. Stratégie de Persistence

### Backup Service
```typescript
// src/persistence/backup.service.ts
@Injectable()
export class BackupService implements OnModuleInit {
  private backupInterval: NodeJS.Timeout;

  constructor(private mqttService: MqttService) {}

  onModuleInit(): void {
    const interval = parseInt(process.env.BACKUP_INTERVAL || '30000');
    this.backupInterval = setInterval(() => {
      this.createBackup();
    }, interval);

    // Restaurer au démarrage
    this.restoreFromBackup();
  }

  private async createBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const state = await this.mqttService.getAllRetainedMessages();
      
      const backup = {
        timestamp,
        version: '1.0',
        state
      };

      await fs.writeFile(
        `./backups/wizard-console-${timestamp}.json`,
        JSON.stringify(backup, null, 2)
      );

      // Garder seulement les 10 derniers backups
      await this.cleanupOldBackups();
      
    } catch (error) {
      console.error('Erreur lors du backup:', error);
    }
  }

  private async restoreFromBackup(): Promise<void> {
    try {
      const backupFiles = await fs.readdir('./backups');
      if (backupFiles.length === 0) return;

      const latestBackup = backupFiles
        .filter(f => f.endsWith('.json'))
        .sort()
        .pop();

      if (!latestBackup) return;

      const backupData = JSON.parse(
        await fs.readFile(`./backups/${latestBackup}`, 'utf-8')
      );

      // Restaurer l'état MQTT
      for (const [topic, payload] of Object.entries(backupData.state)) {
        await this.mqttService.publishState(topic, payload as string);
      }

      console.log(`État restauré depuis ${latestBackup}`);
      
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
    }
  }
}
```

Cette spécification complète fournit tous les détails nécessaires pour l'implémentation. Le code peut maintenant être généré selon cette architecture.