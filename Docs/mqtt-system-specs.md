# 📡 Spécifications du Système MQTT - "MQTT Race"

## 🏗️ Architecture Générale

Le système MQTT Race est conçu avec une architecture sécurisée où :
- **Backend "WizardConsole"** : Rôle de professeur/arbitre avec privilèges étendus
- **Frontend** : Interface de visualisation en temps réel des courses
- **Robots étudiants** : Clients avec droits limités à leur propre espace
- **Balises ToF** : Capteurs de checkpoint automatisés

### 🔒 Architecture de Sécurité

```mermaid
graph TD
    A[Backend Prof] -->|RW| B[/challenges/**]
    C[Équipes] -->|R| B
    C -->|RW| D[/<team>/**]
    A -->|RW| D
    E[Balises ToF] -->|Publish| F[/beacons/**]
    A -->|Subscribe| F
```

---

## 🏷️ Structure des Topics MQTT

### 📋 Règles de Nommage

- **Éviter le JSON** : Utilisation de topics précis pour simplifier le développement embarqué
- **Hiérarchie claire** : Structure logique pour faciliter la compréhension
- **Sécurité par topics** : Droits d'accès définis au niveau des topics

### 🎯 Topics Principaux

#### 1. Espace Équipe (Read/Write pour l'équipe)
```
/<team>/                           # Espace personnel de l'équipe
├── startchallenge                 # Demande de démarrage de challenge
├── config/
│   ├── speed                      # Configuration vitesse robot
│   ├── pid_kp                     # Paramètres PID
│   ├── pid_ki
│   └── pid_kd
├── status/
│   ├── battery                    # État batterie
│   ├── sensors                    # État capteurs
│   └── connection                 # État connexion
└── debug/
    ├── logs                       # Messages de debug
    └── telemetry                  # Données de télémétrie
```

#### 2. Système de Challenges (Read-only pour équipes, RW pour prof)
```
/challenges/
├── <challenge_name>/              # Ex: speedrun, wiggle, crash, etc.
│   ├── <team>/                    # Réponse du système à l'équipe
│   │   └── status                 # "accepted", "denied", "busy"
│   ├── countdown/
│   │   ├── value                  # 3, 2, 1, 0, GO
│   │   └── active                 # true/false
│   ├── scores/
│   │   └── <team>/
│   │       └── <run_number>/      # 0, 1, 2... (plusieurs passages)
│   │           ├── laps/
│   │           │   ├── 1          # Temps tour 1 (ms)
│   │           │   ├── 2          # Temps tour 2 (ms)
│   │           │   ├── 3          # Temps tour 3 (ms)
│   │           │   ├── 4          # Temps tour 4 (ms)
│   │           │   └── 5          # Temps tour 5 (ms)
│   │           ├── avg            # Temps moyen par tour (ms)
│   │           ├── bestlap        # Meilleur tour (ms)
│   │           └── total          # Temps total (ms)
│   └── leaderboard/
│       ├── fastest_lap            # Meilleur tour tous runs confondus
│       ├── fastest_total          # Meilleur temps total
│       └── ranking                # Classement général
```

#### 3. Balises et Checkpoints
```
/beacons/
├── <beacon_id>/
│   ├── triggered                  # true/false
│   ├── team_detected              # nom de l'équipe détectée
│   └── timestamp                  # timestamp de détection
```

---

## 🚦 Processus de Déroulement d'une Course

### 1️⃣ Demande de Challenge

**Équipe → Backend**
```
Topic: /alpha/startchallenge
Payload: "speedrun"
```

**Backend → Équipe** (si piste libre)
```
Topic: /challenges/speedrun/alpha/status
Payload: "accepted"
```

**Backend → Équipe** (si piste occupée)
```
Topic: /challenges/speedrun/alpha/status
Payload: "denied"
```

### 2️⃣ Décompte de Départ

Une fois le challenge accepté, le backend lance le décompte :

```
Topic: /challenges/speedrun/countdown/value
Payloads successifs: "3", "2", "1", "0", "GO"

Topic: /challenges/speedrun/countdown/active
Payload: "true" (puis "false" après "GO")
```

### 3️⃣ Chronométrage Automatique

Les **balises ToF** détectent le passage des robots :

```
Topic: /beacons/start_line/triggered
Payload: "true"

Topic: /beacons/start_line/team_detected
Payload: "alpha"

Topic: /beacons/checkpoint1/triggered
Payload: "true"
```

Le **backend calcule automatiquement** les temps et publie les résultats :

```
Topic: /challenges/speedrun/scores/alpha/0/laps/1
Payload: "23450"  # 23.450 secondes

Topic: /challenges/speedrun/scores/alpha/0/bestlap
Payload: "22180"  # Mis à jour si c'est le meilleur
```

---

## 🎮 Utilisation pour les Étudiants

### 🏠 Votre Espace Personnel

En tant qu'équipe, vous êtes **maîtres de votre topic** `/<team>/`. Vous pouvez :

```cpp
// Configuration de votre robot
client.publish("/alpha/config/speed", "75");        // Vitesse à 75%
client.publish("/alpha/config/pid_kp", "2.5");      // Paramètre PID

// État de votre robot
client.publish("/alpha/status/battery", "87");      // Batterie à 87%
client.publish("/alpha/debug/logs", "Capteur OK");  // Messages de debug
```

### 🏁 Lancer un Challenge

```cpp
// Demander à participer au challenge "speedrun"
client.publish("/alpha/startchallenge", "speedrun");

// S'abonner à la réponse du système
client.subscribe("/challenges/speedrun/alpha/status");

// S'abonner au décompte
client.subscribe("/challenges/speedrun/countdown/value");
```

### 📊 Suivre Vos Performances

```cpp
// S'abonner à vos scores en temps réel
client.subscribe("/challenges/speedrun/scores/alpha/+/laps/+");
client.subscribe("/challenges/speedrun/scores/alpha/+/bestlap");
client.subscribe("/challenges/speedrun/leaderboard/ranking");
```

---

## 🔧 Exemple de Code Complet

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* team_name = "alpha";
const char* mqtt_server = "192.168.1.100";

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
    String message = String((char*)payload, length);
    String topicStr = String(topic);
    
    // Réponse à une demande de challenge
    if (topicStr == "/challenges/speedrun/" + String(team_name) + "/status") {
        if (message == "accepted") {
            Serial.println("Challenge accepté ! En attente du décompte...");
            // S'abonner au décompte
            client.subscribe("/challenges/speedrun/countdown/value");
        } else if (message == "denied") {
            Serial.println("Challenge refusé - piste occupée");
        }
    }
    
    // Décompte de départ
    if (topicStr == "/challenges/speedrun/countdown/value") {
        Serial.println("Décompte: " + message);
        if (message == "GO") {
            startRobot();  // Démarrer le robot
        }
    }
    
    // Scores reçus
    if (topicStr.startsWith("/challenges/speedrun/scores/" + String(team_name))) {
        Serial.println("Score reçu: " + message + " ms");
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
    
    // Connexion avec nom d'équipe
    if (client.connect(team_name)) {
        Serial.println("Connecté au broker MQTT");
        
        // Publication de l'état initial
        client.publish(("/" + String(team_name) + "/status/connection").c_str(), "online");
        
        // Abonnement aux topics importants
        client.subscribe(("/challenges/+/" + String(team_name) + "/status").c_str());
    }
}

void loop() {
    client.loop();
    
    // Publier l'état de la batterie régulièrement
    static unsigned long lastBattery = 0;
    if (millis() - lastBattery > 30000) {  // Toutes les 30 secondes
        float voltage = readBatteryVoltage();
        client.publish(("/" + String(team_name) + "/status/battery").c_str(), 
                      String(voltage).c_str());
        lastBattery = millis();
    }
}

void requestChallenge(String challengeName) {
    // Demander un challenge
    client.publish(("/" + String(team_name) + "/startchallenge").c_str(), 
                  challengeName.c_str());
    Serial.println("Challenge demandé: " + challengeName);
}
```

---

## 🎯 Différents Types de Challenges

### 1. Speedrun (Circuit Ovale)
```
Topic de demande: /alpha/startchallenge
Payload: "speedrun"

Scores: /challenges/speedrun/scores/alpha/0/laps/1-5
```

### 2. Wiggle Protocol (Virages Serrés)
```
Topic de demande: /alpha/startchallenge  
Payload: "wiggle"

Scores: /challenges/wiggle/scores/alpha/0/total
```

### 3. Schrodinger's Crash (Freinage Précis)
```
Topic de demande: /alpha/startchallenge
Payload: "crash"

Scores: /challenges/crash/scores/alpha/0/distance
```

---

## 🚨 Conseils et Bonnes Pratiques

1. **Testez vos topics personnels** avant de demander un challenge
2. **Surveillez la connexion** - republier l'état si déconnexion
3. **Utilisez les logs de debug** pour diagnostiquer les problèmes
4. **Optimisez vos paramètres** via les topics de configuration
5. **Respectez les autres équipes** - un seul challenge à la fois par piste

---

## 📈 Dashboard et Visualisation

Le frontend affiche en temps réel :
- État des pistes (libre/occupé)  
- Décomptes actifs
- Scores et classements
- État des équipes (batterie, connexion)
- Logs d'activité

Vous pouvez suivre toute l'action depuis l'interface web !