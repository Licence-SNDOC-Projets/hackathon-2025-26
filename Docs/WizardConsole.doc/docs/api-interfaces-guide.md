# 🔗 Interfaces & API + Guide de Développement

## 🎯 Interfaces entre Modules

### 1️⃣ Backend - Interfaces Communes

#### Challenge Interface (Contrat pour tous les challenges)
```typescript
// packages/shared/interfaces/challenge.interface.ts
export interface Challenge {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly maxTeams: number;
  readonly maxDuration: number;
  
  startChallenge(teamName: string): Promise<ChallengeSession>;
  stopChallenge(sessionId: string): Promise<ChallengeResult>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  isTrackAvailable(): boolean;
}

export interface ChallengeSession {
  id: string;
  challengeName: string;
  teamName: string;
  startTime: number;
  status: 'waiting' | 'countdown' | 'running' | 'finished' | 'aborted';
  currentLap?: number;
  lapTimes?: number[];
}

export interface ChallengeResult {
  sessionId: string;
  teamName: string;
  challengeName: string;
  startTime: number;
  endTime: number;
  totalTime: number;
  laps: LapResult[];
  bestLap: number;
  ranking: number;
  status: 'completed' | 'dnf' | 'disqualified';
}

export interface LapResult {
  lapNumber: number;
  startTime: number;
  endTime: number;
  duration: number;
  checkpoints?: CheckpointTime[];
}
```

#### MQTT Service Interface
```typescript
// packages/shared/interfaces/mqtt.interface.ts
export interface MqttMessage {
  topic: string;
  payload: string;
  timestamp: number;
  retained: boolean;
}

export interface MqttService {
  // État persistant (retained messages)
  publishState(topic: string, payload: string): Promise<void>;
  getState(topicPattern: string): Promise<Map<string, string>>;
  
  // Événements transitoires
  publishEvent(topic: string, payload: string): Promise<void>;
  
  // Abonnements
  subscribe(topic: string, callback: (message: MqttMessage) => void): void;
  unsubscribe(topic: string): void;
  
  // Backup/Restore
  getAllRetainedMessages(): Promise<Map<string, string>>;
  restoreState(state: Map<string, string>): Promise<void>;
}
```

#### Team Management Interface
```typescript
// packages/shared/interfaces/team.interface.ts
export interface Team {
  name: string;
  displayName: string;
  members: TeamMember[];
  status: TeamStatus;
  robotConfig: RobotConfig;
  currentChallenge?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'captain' | 'developer' | 'electronics' | 'designer';
  skills: SkillLevel[];
}

export interface TeamStatus {
  connection: 'online' | 'offline' | 'unknown';
  batteryLevel: number;
  lastSeen: number;
  currentActivity: string;
}

export interface RobotConfig {
  speed: number;           // 0-100%
  pidKp: number;
  pidKi: number;
  pidKd: number;
  sensorSensitivity: number;
  customSettings: Record<string, any>;
}
```

### 2️⃣ Frontend - Services Partagés

#### MQTT Client Service
```typescript
// packages/shared/services/mqtt-client.service.ts
export interface MqttClientService {
  // Connexion
  connect(options: MqttConnectionOptions): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Observables pour l'état en temps réel
  getStateStream(topicPattern: string): Observable<MqttMessage>;
  getEventStream(topicPattern: string): Observable<MqttMessage>;
  
  // Publication (pour l'arbitre)
  publish(topic: string, payload: string, retained?: boolean): Promise<void>;
  
  // État complet du système
  getSystemState(): Observable<SystemState>;
}

export interface SystemState {
  teams: Map<string, Team>;
  challenges: Map<string, ChallengeState>;
  beacons: Map<string, BeaconStatus>;
  leaderboards: Map<string, LeaderboardEntry[]>;
}
```

#### Challenge Service (Frontend)
```typescript
// packages/shared/services/challenge.service.ts
export interface ChallengeService {
  // Liste des challenges disponibles
  getAvailableChallenges(): Observable<ChallengeInfo[]>;
  
  // État d'un challenge spécifique
  getChallengeState(challengeName: string): Observable<ChallengeState>;
  getLeaderboard(challengeName: string): Observable<LeaderboardEntry[]>;
  
  // Contrôles arbitre
  startChallenge(challengeName: string, teamName: string): Promise<void>;
  stopChallenge(challengeName: string): Promise<void>;
  resetChallenge(challengeName: string): Promise<void>;
}

export interface ChallengeState {
  name: string;
  isActive: boolean;
  currentTeam?: string;
  countdown?: CountdownState;
  sessions: ChallengeSession[];
  trackStatus: 'free' | 'occupied' | 'maintenance';
}
```

## 🌐 API REST Endpoints

### Backend API Structure
```typescript
// Base URL: http://localhost:3000/api

// Authentification (arbitre)
POST   /auth/login
POST   /auth/logout
GET    /auth/profile

// Teams Management
GET    /teams                     // Liste toutes les équipes
GET    /teams/:name               // Détails d'une équipe
PUT    /teams/:name/config        // Mise à jour config robot
GET    /teams/:name/status        // État temps réel équipe

// Challenges Management
GET    /challenges                // Liste des challenges
GET    /challenges/:name          // État d'un challenge
POST   /challenges/:name/start    // Démarrer un challenge
POST   /challenges/:name/stop     // Arrêter un challenge
DELETE /challenges/:name/reset    // Reset un challenge

// Leaderboards
GET    /challenges/:name/leaderboard
GET    /challenges/:name/scores/:team
GET    /global/ranking            // Classement général

// System Management
GET    /system/status             // État général système
GET    /system/mqtt-state         // État MQTT complet
POST   /system/backup             // Forcer backup
POST   /system/restore            // Restaurer backup

// Beacons & IoT
GET    /beacons                   // État des balises
GET    /beacons/:id/history       // Historique d'une balise
```

### WebSocket Events
```typescript
// WebSocket: ws://localhost:3000

// Events Frontend → Backend
interface WebSocketEvents {
  // Arbitre
  'challenge:start': { challengeName: string, teamName: string };
  'challenge:stop': { challengeName: string };
  'countdown:abort': { challengeName: string };
  
  // Monitoring
  'subscribe:challenge': { challengeName: string };
  'subscribe:team': { teamName: string };
  'subscribe:system': {};
}

// Events Backend → Frontend
interface WebSocketResponses {
  // État challenges
  'challenge:state': ChallengeState;
  'challenge:countdown': CountdownState;
  'challenge:result': ChallengeResult;
  
  // État équipes
  'team:status': TeamStatus;
  'team:config': RobotConfig;
  
  // Système
  'system:notification': SystemNotification;
  'beacon:triggered': BeaconEvent;
}
```

## 📋 Guide de Développement

### 🏗️ Structure de Développement

#### Phase 1: Infrastructure (1-2 jours)
```bash
# 1. Initialiser le workspace
npx create-nx-workspace@latest wizard-console --preset=apps
cd wizard-console

# 2. Ajouter les applications
npx nx g @nx/nest:app backend
npx nx g @nx/angular:app frontend

# 3. Configurer Docker
# Créer les fichiers selon configuration-files.md

# 4. Tester l'environnement
docker-compose up -d
npm run serve:backend
npm run serve:frontend
```

#### Phase 2: Modules Core (2-3 jours)
```bash
# Backend - Modules principaux
npx nx g @nx/nest:module mqtt --path=packages/backend/src
npx nx g @nx/nest:module teams --path=packages/backend/src
npx nx g @nx/nest:module beacons --path=packages/backend/src
npx nx g @nx/nest:module persistence --path=packages/backend/src

# Frontend - Services partagés
npx nx g @angular/core:service mqtt --path=packages/frontend/src/app/core
npx nx g @angular/core:service teams --path=packages/frontend/src/app/core
npx nx g @angular/core:service challenges --path=packages/frontend/src/app/core
```

#### Phase 3: Challenges (3-4 jours)
```bash
# Un challenge par jour
npx nx g @nx/nest:module challenges/speedrun --path=packages/backend/src
npx nx g @nx/angular:module challenges/speedrun --path=packages/frontend/src/app

# Répéter pour : wiggle, crash, localhost-track, pimp-my-bot
```

#### Phase 4: Interface & Polish (1-2 jours)
```bash
# Dashboard principal
npx nx g @nx/angular:component dashboard --path=packages/frontend/src/app

# Interface arbitre
npx nx g @nx/angular:component arbitre --path=packages/frontend/src/app

# Tests et optimisations
npm test
npm run build
```

### 🔧 Workflow de Développement

#### Commandes Quotidiennes
```bash
# Démarrage environnement complet
npm run docker:up

# Mode développement backend
npm run serve:backend          # http://localhost:3000

# Mode développement frontend  
npm run serve:frontend         # http://localhost:4200

# Monitoring MQTT en temps réel
mosquitto_sub -h localhost -p 1883 -t "#" -v

# Logs Docker
docker-compose logs -f backend
docker-compose logs -f mosquitto
```

#### Tests & Validation
```bash
# Tests unitaires
npm run test:backend
npm run test:frontend

# Tests E2E
npm run e2e:frontend

# Validation MQTT
# Terminal 1: Simuler robot
mosquitto_pub -h localhost -p 1883 -t "/alpha/startchallenge" -m "speedrun"

# Terminal 2: Observer réponse
mosquitto_sub -h localhost -p 1883 -t "/challenges/speedrun/alpha/status" -v
```

### 📊 Monitoring & Debug

#### MQTT Topics à Surveiller
```bash
# État équipes
mosquitto_sub -t "/teams/+/status/+" -v

# Challenges actifs
mosquitto_sub -t "/challenges/+/+/+/status" -v

# Scores temps réel
mosquitto_sub -t "/challenges/+/scores/+/+/+" -v

# Événements système
mosquitto_sub -t "/system/+" -v

# Balises IoT
mosquitto_sub -t "/beacons/+/+" -v
```

#### Debugging Backend
```bash
# Logs détaillés NestJS
export DEBUG=*
npm run serve:backend

# Profiling MQTT
export MQTT_DEBUG=1
npm run serve:backend

# État mémoire des retained messages
curl http://localhost:3000/api/system/mqtt-state
```

#### Debugging Frontend
```bash
# Mode développement avec source maps
ng build --configuration=development

# WebSocket debugging (Dev Tools → Network → WS)
# MQTT over WebSocket debugging
wscat -c ws://localhost:9001
```

### 🎯 Checklist de Déploiement

#### Production Ready
- [ ] Variables d'environnement sécurisées
- [ ] MQTT avec authentification
- [ ] HTTPS avec certificats
- [ ] Monitoring avec logs centralisés
- [ ] Backup automatique des données
- [ ] Tests E2E passants
- [ ] Documentation utilisateur complète

#### Optimisations Performance
- [ ] Build Angular en mode AOT
- [ ] Compression Gzip sur Nginx
- [ ] Connection pooling MQTT
- [ ] Lazy loading des modules frontend
- [ ] Cache HTTP pour les assets statiques

Cette documentation fournit tout le nécessaire pour démarrer l'implémentation du projet WizardConsole !