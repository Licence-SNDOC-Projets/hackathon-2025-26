# 🛠️ Matériel pour Projets IoT avec ESP32

Ce document présente le matériel disponible pour vos projets Internet des Objets (IoT) basés sur les microcontrôleurs ESP32.

---

## 📦 Vue d'ensemble du matériel

Le kit de développement IoT comprend tous les composants nécessaires pour créer des projets robotiques et IoT connectés, du prototypage jusqu'à la réalisation complète.

---

## 🧠 Microcontrôleurs ESP32

### 1. Cartes de développement ESP32-S3 (Kit de 5 pièces)

![ESP32-S3 DevKit](https://m.media-amazon.com/images/I/61oNcYwZfPL._AC_SL1500_.jpg)

**Référence** : [AYWHP ESP-DevC-S3](https://www.amazon.fr/gp/product/B0DG8L5NG5/)

#### Caractéristiques techniques
- **Processeur** : ESP32-S3 dual-core Xtensa LX7
- **Fréquence** : jusqu'à 240 MHz
- **Mémoire Flash** : intégrée
- **RAM** : SRAM intégrée
- **Connectivité** :
  - WiFi 802.11 b/g/n (2.4 GHz)
  - Bluetooth 5.0 (LE)
- **GPIO** : Nombreuses broches d'entrées/sorties configurables
- **Interfaces** : I2C, SPI, UART, PWM, ADC
- **Alimentation** : USB-C ou externe 3.3V/5V

#### Applications
- Projets IoT connectés
- Robotique mobile
- Domotique
- Monitoring de capteurs
- Contrôle de moteurs

---

### 2. Mini cartes ESP32-S3 (Lot de 2)

**Référence** : [ESP32-S3FH4R2 Mini](https://www.amazon.fr/gp/product/B0FLDM8YY2/)

#### Caractéristiques
- **Format compact** : idéal pour l'intégration dans des espaces réduits
- **Basé sur ESP32-S3FH4R2** : double cœur avec WiFi + Bluetooth
- **Broches disponibles** : GPIO configurables pour vos projets
- **Compatible** : Arduino IDE, PlatformIO, ESP-IDF

#### Avantages
- Taille réduite pour robots compacts
- Même puissance que les cartes standard
- Parfait pour les prototypes finalisés

---

## 🤖 Kit Robot Tank - Adaptation pour ESP32

### Freenove Tank Robot Kit (FNK007) - Originellement pour Raspberry Pi

![Freenove Tank Robot](https://m.media-amazon.com/images/I/81VoKD8tSsL._AC_SL1500_.jpg)

**Référence** : [Freenove Tank Robot Kit (FNK007)](https://store.freenove.com/products/fnk007)

#### ⚠️ Important : Adaptation nécessaire

Ce kit est **conçu pour Raspberry Pi** et nécessite une **adaptation pour fonctionner avec ESP32**. L'interface électronique du kit utilise le connecteur GPIO 40 broches du Raspberry Pi, qui n'est pas directement compatible avec l'ESP32.

**Travail d'adaptation requis :**
- Concevoir et réaliser une carte d'interface adaptée
- Câblage avec breadboard et câbles Dupont pour prototypage
- Comprendre le pinout original et créer les connexions équivalentes
- Adapter le code de contrôle moteurs et servos

#### 📋 Contenu du kit

##### Structure mécanique
- **Chassis à chenilles** (crawler tank)
  - Structure robuste en métal/plastique
  - Système d'entraînement à chenilles pour tout terrain
  - Excellente adhérence et franchissement d'obstacles
  
- **Plateforme multi-niveaux**
  - Support pour carte ESP32
  - Espace pour batteries
  - Montage pour capteurs et accessoires

##### Électronique embarquée (Raspberry Pi originale)
- **Carte contrôleur basée sur Raspberry Pi**
  - Connecteur GPIO 40 broches
  - Driver de moteurs intégré
  - Gestion d'alimentation
  
- **Composants intégrés**
  - Driver moteurs DC (pont en H)
  - Connexions pour 2 servomoteurs
  - Capteur ultrason HC-SR04
  - LED WS2812 (RGB addressable)
  - 3 capteurs IR pour suivi de ligne

##### Actionneurs
- **Moteurs pour chenilles** (x2)
  - Moteurs DC avec réducteur
  - Couple élevé pour déplacement du robot
  - Contrôle de vitesse par PWM
  
- **Servo-moteurs** (x2)
  - Pour bras robotique articulé
  - Pour pince/préhenseur
  - Rotation précise 0-180°

##### Système de préhension
- **Bras robotique**
  - Mouvement vertical contrôlé par servo
  - Portée et hauteur réglables
  
- **Pince/Gripper**
  - Ouverture/fermeture contrôlée
  - Préhension d'objets légers à moyens
  - Capteur de force (optionnel)

#### 🔧 Caractéristiques techniques

##### Motorisation
- **Type** : Moteurs DC avec réducteur
- **Tension** : 5V (alimentation Raspberry Pi)
- **Contrôle** : PWM + GPIO pour direction
- **Direction** : Pont en H intégré

##### Servomoteurs
- **Type** : Servo standard (SG90 ou équivalent)
- **Angle** : 180° de rotation
- **Couple** : Suffisant pour manipulation d'objets légers
- **Signal** : PWM standard (50Hz, pulse 1-2ms)

##### Dimensions
- **Longueur** : ~20-25 cm
- **Largeur** : ~15-18 cm
- **Hauteur** : Variable selon configuration
- **Poids** : ~500-800g (sans batteries)

#### 📌 Pinout Raspberry Pi (configuration originale)

Le kit utilise le connecteur GPIO 40 broches du Raspberry Pi. Le pinout varie selon la **version de la PCB**.

##### PCB Version 1
```
Pin Phys | GPIO BCM | Fonction                    | Fichier source
---------|----------|-----------------------------|-----------------
1        | 3.3V     | Alimentation capteurs       | -
2        | 5V       | Alimentation                | -
4        | 5V       | Alimentation                | -
6        | GND      | Masse                       | -
7        | GPIO 4   | LED WS2812                  | led.py
9        | GND      | Masse                       | -
13       | GPIO 27  | Ultrason Trigger            | ultrasonic.py
14       | GND      | Masse                       | -
15       | GPIO 22  | Ultrason Echo               | ultrasonic.py
16       | GPIO 23  | Moteur gauche (forward)     | motor.py
18       | GPIO 24  | Moteur gauche (backward)    | motor.py
20       | GND      | Masse                       | -
22       | GPIO 25  | Servo 3 (optionnel)         | servo.py
24       | GPIO 8   | Servo 2 (pince)             | servo.py (Gpiozero)
25       | GND      | Masse                       | -
26       | GPIO 7   | Servo 1 (bras)              | servo.py (Gpiozero)
29       | GPIO 5   | Moteur droit (forward)      | motor.py
30       | GND      | Masse                       | -
31       | GPIO 6   | Moteur droit (backward)     | motor.py
34       | GND      | Masse                       | -
36       | GPIO 16  | Capteur IR 01               | infrared.py
38       | GPIO 20  | Capteur IR 02               | infrared.py
39       | GND      | Masse                       | -
40       | GPIO 21  | Capteur IR 03               | infrared.py
```

##### PCB Version 2 (PWM matériel)
```
Pin Phys | GPIO BCM | Fonction                    | Fichier source
---------|----------|-----------------------------|-----------------
1        | 3.3V     | Alimentation capteurs       | -
2        | 5V       | Alimentation                | -
4        | 5V       | Alimentation                | -
6        | GND      | Masse                       | -
7        | GPIO 4   | LED WS2812 (via SPI)        | led.py (spi_ledpixel)
9        | GND      | Masse                       | -
13       | GPIO 27  | Ultrason Trigger            | ultrasonic.py
14       | GND      | Masse                       | -
15       | GPIO 22  | Ultrason Echo               | ultrasonic.py
16       | GPIO 23  | Moteur gauche (forward)     | motor.py
18       | GPIO 24  | Moteur gauche (backward)    | motor.py
20       | GND      | Masse                       | -
29       | GPIO 5   | Moteur droit (forward)      | motor.py
30       | GND      | Masse                       | -
31       | GPIO 6   | Moteur droit (backward)     | motor.py
32       | GPIO 12  | Servo 1 (bras)              | servo.py (HardwareServo PWM0)
33       | GPIO 13  | Servo 2 (pince)             | servo.py (HardwareServo PWM1)
34       | GND      | Masse                       | -
36       | GPIO 16  | Capteur IR 01               | infrared.py
37       | GPIO 26  | Capteur IR 02               | infrared.py
39       | GND      | Masse                       | -
40       | GPIO 21  | Capteur IR 03               | infrared.py
```

**Notes importantes :**
- Le code source utilise des numéros **GPIO BCM** (Broadcom)
- Les numéros de **pins physiques** sont indiqués pour faciliter le câblage
- **PCB v2** utilise le PWM matériel (GPIO 12/13) au lieu du PWM logiciel (GPIO 7/8)
- La version de PCB est détectée automatiquement dans `parameter.py`
- Référez-vous au diagramme de pinout Raspberry Pi 40 broches pour le câblage

#### 🔌 Adaptation ESP32 : Correspondance des broches

Pour adapter le kit à l'ESP32, voici la correspondance selon la **version de votre PCB** :

##### Adaptation pour PCB Version 1
```
Fonction RPi             GPIO BCM  →  ESP32 GPIO  | Notes
---------------------------------------------------------------
Alimentation 5V          5V        →  VIN/5V      | Via régulateur
Masse (GND)              GND       →  GND         | Masse commune
Alimentation 3.3V        3.3V      →  3.3V        | Pour capteurs

Moteur Gauche Forward    GPIO 24   →  GPIO25      | Direction M1
Moteur Gauche Backward   GPIO 23   →  GPIO26      | Direction M1
Moteur Droit Forward     GPIO 5    →  GPIO27      | Direction M2
Moteur Droit Backward    GPIO 6    →  GPIO14      | Direction M2
PWM Moteur Gauche        (PWM)     →  GPIO33      | Vitesse M1
PWM Moteur Droit         (PWM)     →  GPIO32      | Vitesse M2

Servo 1 (Bras)           GPIO 7    →  GPIO13      | PWM Servo 1
Servo 2 (Pince)          GPIO 8    →  GPIO15      | PWM Servo 2
Servo 3 (optionnel)      GPIO 25   →  GPIO12      | PWM Servo 3

Ultrason Trigger         GPIO 27   →  GPIO18      | HC-SR04 Trig
Ultrason Echo            GPIO 22   →  GPIO19      | HC-SR04 Echo

LED WS2812 Data          GPIO 4    →  GPIO16      | LED RGB

IR Sensor 01             GPIO 16   →  GPIO34      | ADC (suivi ligne)
IR Sensor 02             GPIO 20   →  GPIO35      | ADC (suivi ligne)
IR Sensor 03             GPIO 21   →  GPIO39      | ADC (suivi ligne)
```

##### Adaptation pour PCB Version 2 (PWM Matériel)
```
Fonction RPi             GPIO BCM  →  ESP32 GPIO  | Notes
---------------------------------------------------------------
Alimentation 5V          5V        →  VIN/5V      | Via régulateur
Masse (GND)              GND       →  GND         | Masse commune
Alimentation 3.3V        3.3V      →  3.3V        | Pour capteurs

Moteur Gauche Forward    GPIO 24   →  GPIO25      | Direction M1
Moteur Gauche Backward   GPIO 23   →  GPIO26      | Direction M1
Moteur Droit Forward     GPIO 5    →  GPIO27      | Direction M2
Moteur Droit Backward    GPIO 6    →  GPIO14      | Direction M2
PWM Moteur Gauche        (PWM)     →  GPIO33      | Vitesse M1
PWM Moteur Droit         (PWM)     →  GPIO32      | Vitesse M2

Servo 1 (Bras)           GPIO 12   →  GPIO13      | PWM Hardware 0
Servo 2 (Pince)          GPIO 13   →  GPIO15      | PWM Hardware 1

Ultrason Trigger         GPIO 27   →  GPIO18      | HC-SR04 Trig
Ultrason Echo            GPIO 22   →  GPIO19      | HC-SR04 Echo

LED WS2812 Data          GPIO 4    →  GPIO16      | LED RGB (via SPI)

IR Sensor 01             GPIO 16   →  GPIO34      | ADC (suivi ligne)
IR Sensor 02             GPIO 26   →  GPIO35      | ADC (suivi ligne)
IR Sensor 03             GPIO 21   →  GPIO39      | ADC (suivi ligne)
```

**Important** :
- Les moteurs du kit utilisent la bibliothèque gpiozero Motor() qui gère automatiquement le pont en H
- Pour l'ESP32, vous devrez utiliser un driver externe (L298N ou intégré au kit) et contrôler direction + PWM
- **Vérifiez la version de votre PCB** avant de câbler (voir marquage sur la carte)
- PCB v2 utilise GPIO 12/13 pour les servos (PWM matériel du Raspberry Pi)


---

## 🔋 Alimentation

### Batteries rechargeables 18650 3600mAh (Lot de 4)

![18650 Batteries](https://m.media-amazon.com/images/I/71R0jR7YBFL._AC_SL1500_.jpg)

**Référence** : [Batteries 18650 avec chargeur USB](https://www.amazon.fr/gp/product/B0FKH2H5F7/)

#### Caractéristiques
- **Capacité** : 3600mAh
- **Tension nominale** : 3.7V
- **Type** : Li-ion rechargeable
- **Chargement** : Via port USB intégré
- **Quantité** : 4 batteries + chargeur

#### Utilisation avec le robot tank

##### Configuration recommandée (série)
```
Batterie 1 (+) ----+
                   |---- 7.4V vers driver moteurs
Batterie 2 (-)     |
Batterie 2 (+) ----+
                   
GND ---------------+---- GND commun
```

Pour l'ESP32, un régulateur 5V/3.3V est intégré au kit.

#### Autonomie estimée avec robot tank
- **Déplacement continu** : ~2-3 heures
- **Usage mixte** (déplacement + pauses) : ~4-6 heures
- **Mode veille WiFi** : ~8-12 heures

#### ⚠️ Consignes de sécurité
- Ne jamais court-circuiter les batteries
- Le kit inclut normalement un BMS (Battery Management System)
- Ne pas décharger en dessous de 3.0V
- Ne pas charger au-dessus de 4.2V
- Stocker dans un endroit frais et sec

---

## 📏 Capteurs de distance VL53L0X

### Capteurs ToF VL53L0X (Lot de 6)

![VL53L0X Sensor](https://m.media-amazon.com/images/I/61zqJ0JmVPL._AC_SL1500_.jpg)

**Référence** : [VL53L0X Time-of-Flight](https://www.amazon.fr/gp/product/B0D3PRSV3B/)

#### Caractéristiques techniques
- **Technologie** : Time-of-Flight (ToF) laser
- **Portée** : 30mm à 2000mm (3 cm à 2 mètres)
- **Précision** : ±3% jusqu'à 1 mètre
- **Interface** : I2C
- **Tension** : 2.6V à 3.5V (compatible 3.3V ESP32)
- **Angle de mesure** : 25°
- **Temps de mesure** : ~30ms en mode continu

#### 🎯 Utilisation principale : Système de chronométrage

Ces capteurs sont particulièrement adaptés pour créer un **système de chronométrage précis et fiable** dans les applications de course ou de timing.

##### Architecture d'un système de chronométrage

```
┌─────────────────────────────────────────────────┐
│              Ligne de départ                    │
│   VL53L0X_1        VL53L0X_2      VL53L0X_3    │
│      |                |              |          │
│      └────────────────┴──────────────┘          │
│              ESP32 Maître                       │
│         (Détection passage)                     │
└─────────────────────────────────────────────────┘
                    ↓ MQTT
┌─────────────────────────────────────────────────┐
│            Système central                      │
│        (Broker MQTT + Backend)                  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│              Ligne d'arrivée                    │
│   VL53L0X_4        VL53L0X_5      VL53L0X_6    │
│      |                |              |          │
│      └────────────────┴──────────────┘          │
│              ESP32 Maître                       │
│         (Détection passage)                     │
└─────────────────────────────────────────────────┘
```


## 📚 Ressources complémentaires

### Documentation technique
- [ESP32 Technical Reference](https://www.espressif.com/en/products/socs/esp32)
- [VL53L0X Datasheet](https://www.st.com/resource/en/datasheet/vl53l0x.pdf)
- [Freenove GitHub](https://github.com/Freenove)

### Tutoriels
- [Random Nerd Tutorials - ESP32](https://randomnerdtutorials.com/projects-esp32/)
- [ESP32 Servo Control](https://randomnerdtutorials.com/esp32-servo-motor-web-server-arduino-ide/)
- [MQTT avec ESP32](https://randomnerdtutorials.com/esp32-mqtt-publish-subscribe-arduino-ide/)

### Outils de développement
- **Arduino IDE** : environnement simple et accessible
- **PlatformIO** : IDE professionnel
- **ESP-IDF** : framework officiel Espressif (avancé)

---


Bon développement et bonne adaptation ! 🚀🔧
