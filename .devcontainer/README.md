# 🚀 Dev Container MQTT Race Hackathon

Ce dev container configure automatiquement un environnement de développement complet avec un serveur MQTT Mosquitto persistant pour le hackathon "MQTT Race".

## 📦 Services Inclus

### 🔌 MQTT Broker (Mosquitto)
- **Port TCP** : `1883` (protocole MQTT standard)
- **Port WebSocket** : `9001` (pour les clients web)
- **Persistance** : Activée avec volumes Docker
- **Configuration** : Optimisée pour le développement

### 🖥️ MQTT Web Client (MQTTX)
- **URL** : http://localhost:8080
- **Utilité** : Interface web moderne pour tester et déboguer MQTT
- **Image** : emqx/mqttx-web (interface MQTTX officielle)

### 🚀 Services de Développement
- **Backend NestJS** : Port `3000`
- **Frontend Angular** : Port `4200`
- **Node.js 20** avec TypeScript

## 🛠️ Utilisation

### Démarrage Rapide

1. **Ouvrir dans VSCode** avec l'extension Dev Containers
2. **Rebuild Container** depuis la palette de commandes
3. Les services MQTT démarrent automatiquement

### Test de Connexion MQTT

#### En ligne de commande (dans le container)
```bash
# Installer les outils mosquitto (si nécessaire)
apt-get update && apt-get install -y mosquitto-clients

# Publier un message
mosquitto_pub -h mqtt -t 'hackathon/test' -m 'Hello from devcontainer!'

# S'abonner aux messages  
mosquitto_sub -h mqtt -t 'hackathon/test'
```

#### Via l'interface web MQTTX
1. Ouvrir http://localhost:8080
2. Créer une nouvelle connexion :
   - Host : `mqtt://localhost:1883`
   - Port : `1883`
   - Client ID : `hackathon-test`
3. Tester les topics du hackathon dans l'interface moderne

## 📡 Topics MQTT Recommandés

Selon les spécifications du hackathon :

```
/<team>/                           # Espace personnel équipe
├── startchallenge                 # Demande challenge
├── config/
│   ├── speed                      # Config vitesse robot
│   ├── pid_kp, pid_ki, pid_kd     # Paramètres PID
├── status/
│   ├── battery                    # État batterie
│   ├── sensors                    # État capteurs
│   └── connection                 # État connexion
└── debug/
    ├── logs                       # Messages debug
    └── telemetry                  # Télémétrie

/challenges/<challenge_name>/      # Système challenges
├── <team>/status                  # Réponse système
├── countdown/value                # Décompte (3,2,1,GO)
└── scores/<team>/<run>/           # Résultats
```

## 💾 Persistance des Données

### Volumes Docker
- **`mqtt_data`** : Base de données Mosquitto (messages retained, abonnements)
- **`mqtt_log`** : Logs du serveur MQTT
- **`node_modules`** : Cache des dépendances Node.js

### Répertoires Mappés
```
.devcontainer/mosquitto/
├── config/mosquitto.conf          # Configuration
├── data/                          # Base de données (persisté)
└── log/                          # Logs (persisté)
```

## 🔧 Configuration MQTT

### Paramètres Mosquitto
- **Persistance** : Activée (autosave toutes les 60s)
- **Messages Retained** : Supportés
- **Connexions Anonymes** : Autorisées (mode développement)
- **Taille Max Message** : 256 MB
- **WebSocket** : Activé sur port 9001

### Sécurité
⚠️ **Mode Développement** : Connexions anonymes autorisées
🔒 **Production** : Activer l'authentification dans `mosquitto.conf`

## 🚀 Intégration Application

### Backend NestJS
```typescript
// Exemple d'intégration MQTT
import { Injectable } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService {
  private client: mqtt.MqttClient;

  constructor() {
    this.client = mqtt.connect('mqtt://mqtt:1883');
    
    this.client.on('connect', () => {
      console.log('✅ Connected to MQTT broker');
    });
  }

  publishChallenge(team: string, challenge: string) {
    this.client.publish(`/challenges/${challenge}/${team}/status`, 'accepted');
  }
}
```

### Frontend Angular
```typescript
// Utilisation via WebSocket
import { Injectable } from '@angular/core';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService {
  private client: mqtt.MqttClient;

  constructor() {
    this.client = mqtt.connect('ws://localhost:9001');
  }

  subscribeToScores() {
    this.client.subscribe('/challenges/+/scores/+/+');
  }
}
```

## 🐛 Dépannage

### Le serveur MQTT ne démarre pas
1. Vérifier les permissions : `chmod -R 755 .devcontainer/mosquitto/`
2. Reconstruire le container : `Dev Containers: Rebuild Container`

### Connexion refusée
1. Vérifier que les ports sont bien exposés
2. Tester avec l'interface web : http://localhost:8080
3. Consulter les logs : `docker-compose logs mqtt`

### Perte des données
Les données sont persistées dans les volumes Docker. Si besoin de reset :
```bash
docker-compose down -v  # Supprime les volumes
docker-compose up       # Recrée tout
```

## 📊 Monitoring

### Logs MQTT
```bash
# Voir les logs en temps réel
docker-compose logs -f mqtt

# Consulter le fichier de log
cat .devcontainer/mosquitto/log/mosquitto.log
```

### Interface Web MQTT
- **URL** : http://localhost:8080
- **Connexion** : `mqtt://localhost:1883`
- **Fonctionnalités** : Publish/Subscribe, historique des messages

## 🏁 Prêt pour le Hackathon !

Une fois le dev container démarré, vous disposez de :
- ✅ Serveur MQTT persistant et configuré
- ✅ Interface web de test
- ✅ Environnement Node.js/Angular
- ✅ Outils de développement VSCode
- ✅ Persistance des données assurée

Bon hackathon ! 🚀🏎️
