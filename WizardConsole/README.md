# 🧙‍♂️ WizardConsole - MQTT Race Hackathon Platform

## 📖 Description

WizardConsole est la plateforme d'arbitrage pour le hackathon "MQTT Race". Elle orchestrer les courses de robots suiveurs de ligne via MQTT, avec une interface temps réel pour le suivi des challenges et équipes.

## 🏗️ Architecture

- **Backend**: NestJS avec modules par challenge
- **Frontend**: Angular avec composants réutilisables  
- **MQTT**: Eclipse Mosquitto comme state persistant innovant
- **Infrastructure**: Docker Compose pour environnement reproductible
- **TypeScript**: Développement type-safe complet

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

```bash
# 1. Cloner et accéder au projet
cd WizardConsole

# 2. Installer les dépendances
npm install

# 3. Démarrer seulement MQTT pour le développement
docker-compose up mosquitto -d

# 4. Développement Backend (dans un terminal)
npm run dev:backend

# 5. Développement Frontend (dans un autre terminal)
npm run dev:frontend
```

### Alternative avec Docker complet

```bash
# Démarrer l'environnement complet (nécessite la configuration complète)
npm run docker:up

# Voir les logs
npm run docker:logs

# Arrêter
npm run docker:down
```

### URLs de Développement
- **Backend API**: http://localhost:3000/api
- **MQTT Broker**: mqtt://localhost:1883  
- **MQTT WebSocket**: ws://localhost:9001
- **Health Check**: http://localhost:3000/api/health

### Tests MQTT
```bash
# Écouter tous les messages MQTT
npm run mqtt:test
# ou directement:
mosquitto_sub -h localhost -p 1883 -t "#" -v

# Publier un message de test
mosquitto_pub -h localhost -p 1883 -t "/teams/alpha/status/connection" -m "online"

# Tester un démarrage de challenge
mosquitto_pub -h localhost -p 1883 -t "/alpha/startchallenge" -m "speedrun"
```

## 🎯 Challenges Implémentés

1. **Speedrun** - Circuit ovale "Tron Legacy" 
2. **Wiggle Protocol** - Virages progressifs
3. **Schrödinger's Crash** - Freinage de précision  
4. **Localhost Track** - Circuits personnalisés
5. **Pimp My Bot** - Modifications mécaniques

## 📡 Topics MQTT Principaux

```
/teams/<team>/
├── status/connection       # État connexion robot
├── status/battery         # Niveau batterie (0-100)
├── config/speed          # Configuration vitesse
├── config/pid_kp         # Paramètres PID
└── startchallenge        # Demande de challenge

/challenges/<challenge>/
├── <team>/status         # "accepted"/"denied"
├── countdown/active      # true/false
├── countdown/value       # "3","2","1","0","GO"
├── scores/<team>/0/laps/1 # Temps de tours (ms)
└── leaderboard/ranking   # Classement JSON
```

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev:backend        # Démarre NestJS backend avec nodemon
nx serve frontend          # Démarre Angular frontend

# Build
npm run build:backend      # Compile TypeScript
npm run build:frontend     # Build Angular en production

# Docker
npm run docker:up          # Lance tous les services
npm run docker:down        # Arrête tous les services  
npm run docker:logs        # Affiche les logs en temps réel

# Tests & Debug
npm run mqtt:test          # Écoute tous les messages MQTT
```

## 📁 Structure du Projet

```
WizardConsole/
├── 📦 packages/
│   └── backend/           # API NestJS
│       └── src/
│           ├── app.module.ts      # Module principal
│           ├── main.ts            # Point d'entrée
│           ├── mqtt/              # Service MQTT central  
│           ├── teams/             # Gestion équipes
│           ├── challenges/        # Modules challenges
│           └── beacons/           # Capteurs IoT
├── 🐳 docker/             # Configuration Docker
│   └── mosquitto/         # Broker MQTT
├── 📚 docs/               # Documentation architecture
└── docker-compose.yml    # Orchestration services
```

## 🎮 API Endpoints

### Santé du système
```http
GET /api/health              # État général
GET /api/system/status       # État MQTT + teams  
```

### Équipes
```http
GET /api/teams              # Liste toutes les équipes
GET /api/teams/alpha        # Détails équipe Alpha
```

### MQTT en temps réel
- Les scores et états sont publiés automatiquement sur MQTT
- Le frontend peut écouter via WebSocket sur ws://localhost:9001

## 🤖 Code Robot Minimal (ESP32)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* team_name = "alpha";  // Changez selon votre équipe
const char* mqtt_server = "192.168.1.100";  // IP du serveur

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
    String message = String((char*)payload, length);
    String topicStr = String(topic);
    
    // Challenge accepté
    if (topicStr.endsWith("/status") && message == "accepted") {
        Serial.println("✅ Challenge accepté!");
    }
    
    // Décompte
    if (topicStr.endsWith("/countdown/value")) {
        Serial.println("Décompte: " + message);
        if (message == "GO") {
            startRobot();  // Démarrer le robot
        }
    }
}

void setup() {
    Serial.begin(115200);
    
    // Connexion WiFi
    WiFi.begin("Hackathon_WiFi", "password123");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    // Connexion MQTT
    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);
    
    if (client.connect(team_name)) {
        Serial.println("📡 Connecté au broker MQTT");
        
        // S'abonner aux messages importants
        client.subscribe(("/challenges/+/" + String(team_name) + "/status").c_str());
        client.subscribe("/challenges/+/countdown/value");
        
        // Signaler connexion
        client.publish(("/" + String(team_name) + "/status/connection").c_str(), "online");
    }
}

void loop() {
    client.loop();
    
    // Publier l'état batterie toutes les 30 secondes
    static unsigned long lastBattery = 0;
    if (millis() - lastBattery > 30000) {
        int batteryLevel = readBatteryLevel(); // Votre fonction
        client.publish(("/" + String(team_name) + "/status/battery").c_str(), 
                      String(batteryLevel).c_str());
        lastBattery = millis();
    }
}

void requestChallenge(String challengeName) {
    client.publish(("/" + String(team_name) + "/startchallenge").c_str(), 
                   challengeName.c_str());
    Serial.println("🏁 Challenge demandé: " + challengeName);
}

void startRobot() {
    Serial.println("🚗 Robot démarré!");
    // Votre code de suivi de ligne ici
}
```

## 🐛 Debugging

### Logs MQTT en temps réel
```bash
# Tous les messages
mosquitto_sub -h localhost -p 1883 -t "#" -v

# Messages d'une équipe
mosquitto_sub -h localhost -p 1883 -t "/teams/alpha/#" -v

# État d'un challenge  
mosquitto_sub -h localhost -p 1883 -t "/challenges/speedrun/#" -v

# Balises/capteurs
mosquitto_sub -h localhost -p 1883 -t "/beacons/#" -v
```

### Simulation robot
```bash
# Simuler connexion équipe
mosquitto_pub -h localhost -p 1883 -t "/alpha/status/connection" -m "online"

# Simuler demande challenge
mosquitto_pub -h localhost -p 1883 -t "/alpha/startchallenge" -m "speedrun"

# Simuler niveau batterie
mosquitto_pub -h localhost -p 1883 -t "/alpha/status/battery" -m "85"
```

### Logs Docker
```bash
# Logs broker MQTT
docker logs mqtt_broker

# Logs backend  
docker logs wizard_backend

# Tous les logs en temps réel
docker-compose logs -f
```

## ⚠️ Dépannage

### "Nx initialization failed"
Le projet utilise une structure simplifiée sans Nx pour éviter les problèmes de compatibilité. Utilisez directement les scripts npm.

### "MQTT connection failed"
Vérifiez que le broker Mosquitto est démarré:
```bash
docker-compose up mosquitto -d
docker logs mqtt_broker
```

### "Module not found"
Installez les dépendances:
```bash
npm install
```

## 🎓 Développement en Équipe

Structure recommandée pour 4 développeurs:
- **Backend/MQTT** : Développement des services NestJS + logique MQTT
- **Frontend** : Interface Angular + composants temps réel  
- **DevOps** : Docker + déploiement + monitoring
- **IoT/Validation** : Intégration robots + tests + validation fonctionnelle

## 📄 Licence

MIT - Projet éducatif pour hackathon LIC-SN 2025-2026

---

**🚀 Le projet est maintenant prêt pour le développement !** 

Commencez par démarrer le broker MQTT puis le backend pour voir les premiers logs.