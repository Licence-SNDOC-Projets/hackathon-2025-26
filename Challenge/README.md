# 📡 Librairie Challenge - MQTT Race Hackathon

## 🎯 Vue d'ensemble

La librairie **Challenge** est un système modulaire et extensible conçu pour le hackathon "MQTT Race". Elle permet de créer, gérer et orchestrer des challenges robotiques avec une communication MQTT type-safe entre le frontend Angular, le backend NestJS et les robots ESP32.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Angular                         │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │ Challenge       │    │ MQTT Types & Validators             │ │
│  │ Service         │◄───┤ - Topic Builder/Parser              │ │
│  └─────────────────┘    │ - Type-safe communication          │ │
└──────────────┬──────────┴─────────────────────────────────────┘
               │ HTTP REST API                                    
┌──────────────▼──────────────────────────────────────────────────┐
│                        Backend NestJS                          │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │ Challenge       │    │ Challenge Registry                  │ │
│  │ Controller      │◄───┤ - Dynamic registration             │ │
│  └─────────────────┘    │ - Singleton pattern                │ │
│  ┌─────────────────┐    └─────────────────────────────────────┘ │
│  │ Challenge       │                                            │
│  │ Service         │    ┌─────────────────────────────────────┐ │
│  └─────────────────┘◄───┤ Challenge Implementations          │ │
│                         │ - TronLegacyCircuitChallenge       │ │
│                         │ - Extensible for new challenges    │ │
└─────────────────────────┴─────────────────────────────────────┘
                                      │ MQTT Communication
┌─────────────────────────────────────▼─────────────────────────┐
│                        Robots ESP32                          │
│  - Subscribe/Publish via topics type-safe                    │
│  - Telemetry, configuration, events                          │
└───────────────────────────────────────────────────────────────┘
```

## 🚀 Installation et utilisation

### Dans le backend NestJS

```typescript
import { 
  challengeRegistry,
  TronLegacyCircuitChallenge,
  BaseChallenge,
  Team,
  ChallengeStatus 
} from '@wizard-console/challenge';

// Le challenge est automatiquement enregistré grâce au décorateur @RegisterChallenge

// Utilisation dans un service
@Injectable()
export class MyService {
  async handleChallengeRequest(teamId: string, challengeId: string) {
    const challenge = challengeRegistry.getChallenge(challengeId);
    const team: Team = { id: teamId, name: "TeamAlpha" };
    
    const canParticipate = await challenge.canTeamParticipate(team);
    if (canParticipate) {
      await challenge.prepareForTeam(team);
      return ChallengeStatus.ACCEPTED;
    }
    return ChallengeStatus.DENIED;
  }
}
```

### Dans le frontend Angular

```typescript
import { 
  ChallengeService,
  RobotTelemetry,
  MQTTTopicBuilder 
} from './services/challenge.service';

@Component({...})
export class ChallengeComponent {
  constructor(private challengeService: ChallengeService) {}

  async registerTeam() {
    const team = await this.challengeService.registerTeam({
      id: 'team-alpha',
      name: 'Team Alpha',
      members: ['Alice', 'Bob']
    }).toPromise();
    
    console.log('Équipe enregistrée:', team);
  }

  async requestChallenge() {
    const result = await this.challengeService.requestChallenge(
      'team-alpha', 
      'tron-legacy-circuit'
    ).toPromise();
    
    if (result.status === 'accepted') {
      // Démarrer le challenge
      await this.challengeService.startChallenge('team-alpha', 'tron-legacy-circuit').toPromise();
    }
  }
}
```

## 🎮 Créer un nouveau challenge

### Étape 1: Créer la classe du challenge

```typescript
import { BaseChallenge, ChallengeConfig, Team, RegisterChallenge } from '@wizard-console/challenge';

@RegisterChallenge({
  id: 'my-custom-challenge',
  version: '1.0.0',
  author: 'Mon Équipe',
  tags: ['custom', 'advanced']
})
export class MyCustomChallenge extends BaseChallenge {
  constructor() {
    const config: ChallengeConfig = {
      id: 'my-custom-challenge',
      name: 'Mon Challenge Personnalisé',
      description: 'Description de mon challenge',
      maxDuration: 180000, // 3 minutes
      hasCountdown: true
    };
    super(config);
  }

  async canTeamParticipate(team: Team): Promise<boolean> {
    // Logique personnalisée
    return true;
  }

  async prepareForTeam(team: Team): Promise<void> {
    // Préparation spécifique au challenge
  }

  async startChallenge(team: Team): Promise<void> {
    // Démarrage du challenge
  }

  async processTelemetry(team: Team, data: any): Promise<void> {
    // Traitement des données télémétrie
  }

  async calculateScore(result: ChallengeResult): Promise<number> {
    // Calcul du score
    return 100;
  }

  async isCompleted(team: Team): Promise<boolean> {
    // Vérification de fin
    return false;
  }

  async cleanup(team: Team): Promise<void> {
    // Nettoyage
  }
}
```

### Étape 2: Importer dans le projet

```typescript
// Dans Challenge/src/index.ts
export * from './lib/challenges/my-custom-challenge';

// Le challenge sera automatiquement disponible via le registry
```

## 📡 Communication MQTT Type-Safe

### Génération de topics

```typescript
import { MQTTTopicBuilder } from '@wizard-console/challenge';

// Topics d'équipe
const teamTopics = MQTTTopicBuilder.team('team-alpha');
// Résultat:
// {
//   startchallenge: '/team-alpha/startchallenge',
//   config: { speed: '/team-alpha/config/speed', ... },
//   status: { battery: '/team-alpha/status/battery', ... },
//   debug: { logs: '/team-alpha/debug/logs', ... }
// }

// Topics de challenge
const challengeTopics = MQTTTopicBuilder.challenge('tron-legacy-circuit');
// Résultat: topics pour countdown, scores, leaderboard...
```

### Parsing de topics

```typescript
import { MQTTTopicParser } from '@wizard-console/challenge';

const parsed = MQTTTopicParser.parseTeamTopic('/team-alpha/config/speed');
// Résultat:
// {
//   teamId: 'team-alpha',
//   category: 'config',
//   field: 'speed'
// }
```

### Validation de payloads

```typescript
import { MQTTPayloadValidator, RobotTelemetry } from '@wizard-console/challenge';

const telemetryData = { /* données */ };
if (MQTTPayloadValidator.validateTelemetry(telemetryData)) {
  // telemetryData est maintenant typé comme RobotTelemetry
  console.log(telemetryData.sensors.battery_voltage);
}
```

## 🔄 Cycle de vie d'un challenge

1. **Enregistrement automatique** : Le challenge est enregistré via `@RegisterChallenge`
2. **Demande** : Une équipe fait une demande via `/team-alpha/startchallenge`
3. **Validation** : `canTeamParticipate()` vérifie si l'équipe peut participer
4. **Préparation** : `prepareForTeam()` initialise l'état du challenge
5. **Décompte** : Le système publie sur `/challenges/tron-legacy-circuit/countdown/value`
6. **Démarrage** : `startChallenge()` lance le challenge
7. **Télémétrie** : `processTelemetry()` traite les données en temps réel
8. **Fin** : `isCompleted()` détecte la fin du challenge
9. **Score** : `calculateScore()` calcule le score final
10. **Nettoyage** : `cleanup()` nettoie les ressources

## 📊 Exemple complet : ESP32

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* team_name = "team-alpha";
const char* challenge_id = "tron-legacy-circuit";

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
    String message = String((char*)payload, length);
    String topicStr = String(topic);
    
    // Réponse au challenge accepté
    if (topicStr == "/challenges/" + String(challenge_id) + "/" + String(team_name) + "/status") {
        if (message == "accepted") {
            Serial.println("Challenge accepté!");
            // S'abonner au décompte
            client.subscribe(("/challenges/" + String(challenge_id) + "/countdown/value").c_str());
        }
    }
    
    // Décompte
    if (topicStr == "/challenges/" + String(challenge_id) + "/countdown/value") {
        Serial.println("Décompte: " + message);
        if (message == "GO") {
            startRobot();
        }
    }
}

void setup() {
    // Configuration WiFi et MQTT...
    client.setCallback(callback);
    
    // Demander un challenge
    client.publish(("/" + String(team_name) + "/startchallenge").c_str(), challenge_id);
    
    // S'abonner aux topics importants
    client.subscribe(("/challenges/" + String(challenge_id) + "/" + String(team_name) + "/status").c_str());
}

void loop() {
    client.loop();
    
    // Publier la télémétrie
    if (millis() % 1000 == 0) { // Chaque seconde
        String telemetry = createTelemetryJSON();
        client.publish(("/" + String(team_name) + "/debug/telemetry").c_str(), telemetry.c_str());
    }
}
```

## 🔧 API REST disponible

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/challenges` | GET | Liste des challenges disponibles |
| `/api/challenges/:id` | GET | Détails d'un challenge |
| `/api/challenges/teams/register` | POST | Enregistrer une équipe |
| `/api/challenges/request` | POST | Demander un challenge |
| `/api/challenges/start` | POST | Démarrer un challenge |
| `/api/challenges/telemetry` | POST | Envoyer de la télémétrie |
| `/api/challenges/stats` | GET | Statistiques globales |
| `/api/challenges/health` | GET | État de santé du service |

## 🏆 Challenges disponibles

### Tron Legacy Circuit
- **ID**: `tron-legacy-circuit`
- **Type**: Circuit ovale d'initiation  
- **Tours**: 3 tours minimum
- **Temps max**: 3 minutes
- **Interfaces**: `TimedChallenge`, `LapBasedChallenge`
- **Métriques**: Temps total, meilleur tour, régularité

## 📈 Extensibilité

Le système est conçu pour être facilement extensible :

- **Nouveaux challenges** : Héritez de `BaseChallenge`
- **Nouvelles métriques** : Implémentez `CustomMetricsChallenge`  
- **Nouveaux types de courses** : Créez vos propres interfaces
- **Nouveaux topics MQTT** : Étendez les builders et parsers

## 🛠️ Développement

```bash
# Compiler la librairie
npx nx build Challenge

# Compiler le backend
npx nx build backend

# Compiler le frontend
npx nx build WizardConsole

# Tests
npx nx test Challenge
npx nx test backend
npx nx test WizardConsole

# Servir en développement
npx nx serve WizardConsole
npx nx serve backend
```

## 🎉 Conclusion

Cette librairie offre une base solide et extensible pour créer des challenges robotiques connectés. Elle garantit une communication type-safe entre tous les composants du système et facilite l'ajout de nouveaux challenges.

**Prêt à créer votre propre challenge ? 🚀**
