# 🏎️ Hackathon IoT & Robot Connecté – "MQTT Race"

## 🎯 Objectif
Ce hackathon a pour but d’initier les étudiants aux **objets connectés** à travers la conception, l’assemblage et la programmation d’un **robot suiveur de ligne connecté**.

Pendant 4 jours et demi, les équipes devront :
- Monter et adapter un **kit robot Freenove FNK0077** pour **ESP32**,
- Mettre en place une **communication MQTT** entre le robot et un serveur,
- Participer à plusieurs **courses et défis techniques**,
- Concevoir et présenter leur propre **circuit connecté**.

---

## 👥 Participants
- Étudiants de niveau **Bac+3 (niveau Bac+2)**, profils **électronique** et **développement**.
- Équipes de **4 étudiants** aux compétences complémentaires.

---

## 🧰 Matériel par équipe
- 1 kit **Freenove FNK0077** (base robot à chenilles) [doc](https://store.freenove.com/products/fnk0077)
- 1 **ESP32** (remplace le Pico)
- 1 breadboard + câbles Dupont
- Materiel a la demainde
- PC de développement

---

## 💡 Thèmes abordés
- IoT & MQTT (communication publish/subscribe)
- Systèmes embarqués (ESP32)
- Capteurs et actionneurs
- Conception mécanique et électronique
- Travail collaboratif & gestion de projet court

---

## 📅 Planning de la semaine

### 🟩 **Jour 1 – Lundi : Découverte & Mise en route**
**Matin :**
- Présentation du hackathon et des [chalenges](les-chalenges.md)
- [Creation des équipe](equipes.md)
- [Introduction à l’IoT et au protocole MQTT](mqtt.md)
- [Présentation du matériel (ESP32, robot Freenove)](votre-materiel.md)
- [Présentation du materiel et logiciel arbitre](../WizardConsole/docs/iot-arbitre.md)

**Après-midi :**
- Assemblage du robot et création de l’interface ESP32 ↔ carte robot
- Tests moteurs et capteurs
- Premier test MQTT : envoi/réception de messages

🎯 *Objectif : robot monté, capteurs reconnus, communication MQTT établie.*

---

### 🟦 **Jour 2 – Mardi : Asservissement & premiers tours**
**Matin :**
- Théorie rapide sur l’asservissement (PID simplifié)
- Réglage du suivi de ligne sur un circuit ovale

**Après-midi :**
- Intégration du MQTT pour le départ et le chrono :
  - `start/<team_name>`
  - `chrono/<team_name>`
- Premiers tests sur le circuit ovale

🎯 *Objectif : robot part sur signal MQTT et boucle un circuit complet.*

---

### 🟨 **Jour 3 – Mercredi : Interaction & Challenge intermédiaire**
**Matin :**
- Ajout d’événements MQTT : `stop`, `go`, `direction`
- Création et test des balises ToF + LED tricolore (départ/arrivée)

**Midi – Challenge #1 🏁**
- Course 1 : circuit ovale → vitesse
- Course 2 : circuit biscornu → précision

**Après-midi :**
- Débrief technique
- Ajustement des paramètres d’asservissement et de communication

🎯 *Objectif : robot autonome capable de réagir à des commandes MQTT.*

---

## 🏎️ Hackathon IoT & Robot Connecté – "## 🟧 **Jour 4 – Jeudi : Créativité & circuit libre**
**Matin :**
- Course interactive : feux rouges, arrêts forcés, Y, ordres MQTT
- Test complet avec balises ToF et LED

**Après-midi :**
- Phase maker : chaque équipe crée son propre circuit
- Possibilité d’améliorer mécaniquement le robot (structure, capteurs, etc.)

🎯 *Objectif : intégration complète méca + électronique + MQTT.*

---

### 🟥 **Jour 5 – Vendredi matin : Finale & restitution**
**Matin :**
- Présentations rapides (2-3 min par équipe)
- **Course finale** sur un circuit tiré au sort parmi ceux conçus

**Évaluation :**
- 🏎️ Performance technique (vitesse, stabilité, MQTT)
- 💡 Innovation (idées, conception)
- 🤝 Esprit d’équipe

**Remise des prix et clôture du hackathon**

---

## 🧩 Points pédagogiques clés
- Apprentissage par la pratique (learning by doing)
- Collaboration interdisciplinaire (élec + dev)
- Gestion de projet rapide (4,5 jours)
- Découverte des outils IoT concrets (MQTT, Node-RED, ESP32)
- Sensibilisation à la mécanique réelle (robot à chenilles)

---

## 🧱 Extensions possibles
- Intégration d’un dashboard Node-RED pour le suivi des courses
- Ajout de scripts Python pour le chronométrage centralisé via MQTT
- Conception et impression 3D des balises ToF avec LED intégrée

---

## 🏁 En résumé
> “MQTT Race” est un hackathon immersif mêlant **robotique, IoT, et créativité**, conçu pour faire découvrir aux étudiants les enjeux et la magie des objets connectés dans un cadre stimulant et collaboratif.

---
