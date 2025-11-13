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
├── ask                            # Demande pour le magicien
├── answer                         # Réponse du magicien
└── ...                            # Libre d'organiser comme vous le souhaiter

```

#### 2. Système de Challenges (Read-only pour équipes, RW pour prof)
```
/challenges/
├── <challenge_name>/               # Ex: speedrun, wiggle, crash, etc.
│   ├── current                     # team sur le parcour
│   ├── status                      # "free", "busy"
│   ├── countdown/ 
│   │   ├── value                   # 3, 2, 1, 0, GO
│   │   └── active                  # true/false
│   ├── scores/ 
│   │   └── <team>/ 
│   │       └── <run_number>/       # 0, 1, 2... (plusieurs passages)
│   │           ├── laps/ 
│   │           │   ├── 1           # Temps tour 1 (ms) avec pénalité
│   │           │   │   └──penality # Nombre de pénalité
│   │           │   ├── 2           # Temps tour 2 (ms) avec pénalité
│   │           │   │   └──penality # Nombre de pénalité
│   │           │   ├── 3           # Temps tour 3 (ms) avec pénalité
│   │           │   │   └──penality # Nombre de pénalité
│   │           │   ├── 4           # Temps tour 4 (ms) avec pénalité
│   │           │   │   └──penality # Nombre de pénalité
│   │           │   └── 5           # Temps tour 5 (ms) avec pénalité
│   │           │       └──penality # Nombre de pénalité
│   │           ├── avg             # Temps moyen par tour (ms)
│   │           ├── bestlap         # Meilleur tour (ms)
│   │           └── total           # Temps total (ms)
│   └── leaderboard/ 
│       ├── fastest_lap             # Meilleur tour tous runs confondus
│       │    ├── value              
│       │    └── team              
│       ├── fastest_avg             # Meilleur temps moyen
│       │    ├── value             
│       │    └── team             
```

#### 3. Balises et Checkpoints
```
/beacons/
├── <beacon_id>/
│   ├── Tof                   # Distance d'obstacle
│   │   ├── Trigger           # Distance de declenchement
│   │   ├── MoreOrLess        # Sens de comparaison <>
│   │   └── Detect            # True False
│   ├── Button                # Etat du bouton
│   └── StripLed/             # Strip led
│       ├── Max               # Nombre de led
│       ├── <led_number>      # Position de la led
│       │    └── Red          # Couleur Rouge
│       │    └── Green        # Couleur Vert
│       │    └── Blue         # Couleur Bleu
│       └── Send              # Signal d'envoi au strip led
```

---

## 🚦 Processus de Déroulement d'une Course

### 1️⃣ Demande de Challenge

**Équipe → Backend**
```
Topic: /alpha/ask
Payload: "startChalenge:speedrun"
```

**Backend → Équipe** (si piste libre)
```
Topic: /alpha/answer
Payload: "" puis "accepted"
```

**Backend → Équipe** (si piste occupée)
```
Topic: /alpha/answer
Payload: "" puis "busy"
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

Les **balises ToF** détectent le passage des robots via leurs capteurs de distance :

```
Topic: /beacons/start_line/Tof/Detect
Payload: "true"

Topic: /beacons/checkpoint1/Tof/Detect
Payload: "true"

Topic: /beacons/finish_line/Tof/Detect
Payload: "true"
```

Le **backend calcule automatiquement** les temps et publie les résultats :

```
Topic: /challenges/speedrun/scores/alpha/0/laps/1
Payload: "23450"  # 23.450 secondes

Topic: /challenges/speedrun/scores/alpha/0/laps/1/penality
Payload: "2"  # 2 pénalités sur ce tour

Topic: /challenges/speedrun/scores/alpha/0/bestlap
Payload: "22180"  # Mis à jour si c'est le meilleur
```

---

## 🎮 Utilisation pour les Étudiants

### 🏠 Votre Espace Personnel

En tant qu'équipe, vous êtes **maîtres de votre topic** `/<team>/`. Vous pouvez organiser comme vous le souhaitez, mais vous devez utiliser :

```cpp
// Communication avec le magicien (backend)
client.publish("/alpha/ask", "startChalenge:speedrun");  // Demande de challenge
client.subscribe("/alpha/answer");                       // Écouter les réponses

// Votre organisation libre
client.publish("/alpha/config/speed", "75");        // Vitesse à 75%
client.publish("/alpha/config/pid_kp", "2.5");      // Paramètre PID
client.publish("/alpha/status/battery", "87");      // Batterie à 87%
client.publish("/alpha/debug/logs", "Capteur OK");  // Messages de debug
```

### 🏁 Lancer un Challenge

```cpp
// Demander à participer au challenge "speedrun"
client.publish("/alpha/ask", "startChalenge:speedrun");

// S'abonner à la réponse du magicien
client.subscribe("/alpha/answer");

// S'abonner au décompte et status du challenge
client.subscribe("/challenges/speedrun/countdown/value");
client.subscribe("/challenges/speedrun/status");
client.subscribe("/challenges/speedrun/current");
```

### 📊 Suivre Vos Performances

```cpp
// S'abonner à vos scores en temps réel
client.subscribe("/challenges/speedrun/scores/alpha/+/laps/+");
client.subscribe("/challenges/speedrun/scores/alpha/+/bestlap");
client.subscribe("/challenges/speedrun/leaderboard/fastest_lap/+");
client.subscribe("/challenges/speedrun/leaderboard/fastest_avg/+");
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
    
    // Réponse du magicien (backend)
    if (topicStr == "/" + String(team_name) + "/answer") {
        Serial.println("Réponse du magicien: " + message);
        if (message == "accepted") {
            Serial.println("Challenge accepté ! En attente du décompte...");
            // S'abonner au décompte et status
            client.subscribe("/challenges/speedrun/countdown/value");
            client.subscribe("/challenges/speedrun/status");
        } else if (message == "busy") {
            Serial.println("Challenge refusé - piste occupée");
        }
    }
    
    // Status du challenge
    if (topicStr == "/challenges/speedrun/status") {
        Serial.println("Status du challenge: " + message);
    }
    
    // Équipe actuellement sur le parcours
    if (topicStr == "/challenges/speedrun/current") {
        Serial.println("Équipe sur le parcours: " + message);
    }
    
    // Décompte de départ
    if (topicStr == "/challenges/speedrun/countdown/value") {
        Serial.println("Décompte: " + message);
        if (message == "GO") {
            startRobot();  // Démarrer le robot
        }
    }
    
    // Scores reçus (temps et pénalités)
    if (topicStr.startsWith("/challenges/speedrun/scores/" + String(team_name))) {
        if (topicStr.endsWith("/penality")) {
            Serial.println("Pénalités reçues: " + message);
        } else {
            Serial.println("Score reçu: " + message + " ms");
        }
    }
    
    // Leaderboard
    if (topicStr.startsWith("/challenges/speedrun/leaderboard/")) {
        if (topicStr.endsWith("/value")) {
            Serial.println("Nouveau record: " + message + " ms");
        } else if (topicStr.endsWith("/team")) {
            Serial.println("Détenteur du record: " + message);
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
    
    // Connexion avec nom d'équipe et mot de passe
    if (client.connect(team_name, team_name, "team123")) {
        Serial.println("Connecté au broker MQTT");
        
        // Abonnements essentiels
        client.subscribe(("/" + String(team_name) + "/answer").c_str());
        client.subscribe("/challenges/+/status");
        client.subscribe("/challenges/+/current");
        client.subscribe("/challenges/+/countdown/value");
        client.subscribe(("/challenges/+/scores/" + String(team_name) + "/+/laps/+").c_str());
        client.subscribe(("/challenges/+/scores/" + String(team_name) + "/+/laps/+/penality").c_str());
        client.subscribe("/challenges/+/leaderboard/+/+");
        
        // Publication de l'état initial
        client.publish(("/" + String(team_name) + "/status/connection").c_str(), "online");
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
    // Demander un challenge au magicien
    String request = "startChalenge:" + challengeName;
    client.publish(("/" + String(team_name) + "/ask").c_str(),
                  request.c_str());
    Serial.println("Challenge demandé au magicien: " + request);
}

void askWizard(String question) {
    // Poser une question au magicien
    client.publish(("/" + String(team_name) + "/ask").c_str(),
                  question.c_str());
    Serial.println("Question au magicien: " + question);
}
```

---

## 🎯 Différents Types de Challenges

### 1. Speedrun (Circuit Ovale)
```
Topic de demande: /alpha/ask
Payload: "startChalenge:speedrun"

Scores:
- /challenges/speedrun/scores/alpha/0/laps/1-5 (temps en ms)
- /challenges/speedrun/scores/alpha/0/laps/1-5/penality (nombre de pénalités)
```

### 2. Wiggle Protocol (Virages Serrés)
```
Topic de demande: /alpha/ask
Payload: "startChalenge:wiggle"

Scores:
- /challenges/wiggle/scores/alpha/0/total (temps total)
- /challenges/wiggle/scores/alpha/0/laps/+/penality (pénalités par section)
```

### 3. Schrodinger's Crash (Freinage Précis)
```
Topic de demande: /alpha/ask
Payload: "startChalenge:crash"

Scores:
- /challenges/crash/scores/alpha/0/distance (distance d'arrêt)
- /challenges/crash/scores/alpha/0/laps/1/penality (pénalités)
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
