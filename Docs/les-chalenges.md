# 🏁 Les Challenges de la "MQTT Race"

## Introduction

Bienvenue dans la "MQTT Race", un hackathon qui combine robotique, IoT et esprit d'équipe dans une série de défis palpitants ! 

Durant cette semaine intense, vous transformerez un simple kit robotique en véritable bolide connecté capable de suivre des lignes, de communiquer via MQTT et de s'adapter à différents environnements. Les challenges proposés évolueront progressivement en difficulté et en complexité, vous permettant d'explorer toutes les dimensions de l'IoT appliqué à la robotique.

### Principe général

Votre mission : assembler, programmer et optimiser un robot suiveur de ligne basé sur le kit Freenove FNK0077 et un ESP32. Votre robot devra:
- Détecter et suivre une ligne noire sur fond blanc
- Communiquer via le protocole MQTT avec un serveur central
- S'arrêter et démarrer sur commande
- Optimiser sa vitesse et sa précision
- S'adapter à différents types de circuits

### Communication MQTT

Le cœur de ce hackathon repose sur le protocole MQTT, élément fondamental de l'IoT moderne. Votre robot devra:
- Se signaler sur la ligne de départ (`registration/<team_name>`)
- Attendre le signal de départ (`start/<team_name>`)
- Publier son passage à l'arrivée (`finish/<team_name>`)
- Réagir à divers événements MQTT pendant les courses

### Progression des défis

Les challenges sont conçus pour vous faire monter en compétence progressivement:
1. Maîtrise du suivi de ligne basique
2. Navigation dans des environnements complexes
3. Optimisation de la vitesse et de la précision
4. Création et adaptation à de nouveaux circuits
5. Amélioration mécanique et optimisation matérielle

### Évaluation

Chaque challenge sera évalué selon des critères spécifiques qui incluent généralement:
- **Performance technique**: temps de parcours, précision du suivi, réactivité aux commandes MQTT
- **Qualité du code**: structure, efficacité, commentaires
- **Innovation**: solutions créatives aux problèmes rencontrés
- **Travail d'équipe**: organisation, répartition des tâches

Que la meilleure équipe gagne, mais souvenez-vous que l'objectif principal est d'apprendre en s'amusant !

---

## Challenge #1: "Tron Legacy Circuit"

### Description
Votre première mission consiste à maîtriser un circuit ovale simple, semblable aux pistes lumineuses du film Tron. Ce challenge d'initiation vous permettra de vous familiariser avec les bases du suivi de ligne et de la communication MQTT.

### Objectifs techniques
- Assembler votre robot et configurer les capteurs de suivi de ligne
- Implémenter l'algorithme de base pour suivre une ligne noire sur fond blanc
- Établir une communication MQTT avec le serveur central:
  - Publication: `registration/<team_name>` lorsque le robot est prêt
  - Abonnement: `start/<team_name>` pour recevoir le signal de départ
  - Publication: `finish/<team_name>` lorsque le robot franchit la ligne d'arrivée

### Critères d'évaluation
- **Temps de parcours**: Combien de temps votre robot met-il pour compléter un tour?
- **Fiabilité**: Votre robot reste-t-il sur la ligne pendant tout le parcours?
- **Communication**: Les messages MQTT sont-ils correctement envoyés et reçus?

### Représentation du circuit
```
    ╭───────────────────╮
    │                   │
    │                   │
    │                   │
    │                   │
    │                   │
 🏁 │                   │ 🚦
    │                   │
    │                   │
    │                   │
    │                   │
    ╰───────────────────╯
```

### Conseils
- Commencez par un algorithme simple de suivi de ligne avant d'optimiser la vitesse
- Testez votre communication MQTT avant de vous lancer sur le circuit
- Pensez à calibrer vos capteurs en fonction de la luminosité ambiante

---

## Challenge #2: "Wiggle Protocol"

### Description
Le "Wiggle Protocol" introduit un nouveau niveau de difficulté avec un circuit présentant des oscillations de plus en plus serrées avant de se terminer par une ligne droite. Votre robot devra s'adapter à des courbes de plus en plus exigeantes.

### Objectifs techniques
- Améliorer votre algorithme de suivi pour gérer des virages serrés
- Optimiser les paramètres d'asservissement (PID recommandé)
- Maintenir une vitesse constante malgré les variations du tracé

### Critères d'évaluation
- **Précision**: Capacité à suivre la ligne dans les virages les plus serrés
- **Adaptation**: Transition efficace entre différentes amplitudes de virage
- **Stabilité**: Absence d'oscillations parasites lors du suivi

### Représentation du circuit
```
    🚦
    ╭─────────────────╮
    │                 │ 
    │   ╭───╮  ╭──╮ ╭╮│
    │   │   │  │  │ │││
    ╰───╯   ╰──╯  ╰─╯╰╯
    🏁
```

### Conseils
- Ajustez la sensibilité des capteurs pour détecter plus précisément les variations
- Expérimentez avec différentes valeurs de PID pour trouver le meilleur équilibre
- Considérez de ralentir dans les virages serrés et d'accélérer dans les portions droites

---

## Challenge #3: "Schrodinger's Crash"

### Description
Dans ce défi inspiré de la physique quantique, votre robot doit parcourir une ligne droite à vitesse maximale et s'arrêter le plus près possible d'un mur... sans jamais le toucher! Comme le chat de Schrödinger, votre robot est à la fois crashé et non crashé jusqu'à l'observation finale.

### Objectifs techniques
- Maximiser la vitesse en ligne droite
- Implémenter une détection précise de la fin de ligne ou du mur
- Développer un algorithme de freinage efficace et précis

### Critères d'évaluation
- **Vitesse**: Temps mis pour parcourir la distance
- **Précision**: Distance entre le robot et le mur à l'arrêt (sans contact)
- **Contrôle**: Capacité à s'arrêter net sans dérapage ni oscillation

### Représentation du circuit
```
🚦───────────────────────│
                        │
                        │ ⬅️ Mur
                        │
                        │
```

### Conseils
- Utilisez un capteur supplémentaire (ultrason ou ToF) pour estimer la distance au mur
- Calculez soigneusement la distance de freinage en fonction de la vitesse
- Testez différentes stratégies: freinage progressif vs freinage d'urgence

---

## Challenge #4: "Localhost:Track"

### Description
Il est temps de devenir concepteur de circuit! Chaque équipe devra créer son propre parcours sur lequel toutes les équipes devront concourir. Ce challenge teste votre créativité ainsi que votre capacité à vous adapter aux circuits des autres.

### Objectifs techniques
- Concevoir un circuit original avec un niveau de difficulté équilibré
- Adapter votre robot et son code pour performer sur différents types de circuits
- Analyser rapidement un nouveau circuit pour optimiser votre stratégie

### Critères d'évaluation
Pour la conception:
- **Originalité**: Créativité et innovation dans le design
- **Équilibre**: Niveau de difficulté adapté
- **Faisabilité**: Construction soignée et praticable

Pour la performance:
- **Adaptabilité**: Performance sur les circuits inconnus
- **Robustesse**: Capacité à gérer des situations imprévues

### Conseils
- Incluez différents éléments: virages, intersections, variations de largeur
- Pensez à l'expérience utilisateur: le circuit doit être challengeant mais pas impossible
- Prévoyez un temps pour analyser les circuits adverses avant la course

---

## Challenge #5: "Pimp My Bot"

### Description
Dans ce dernier défi, vous avez carte blanche pour modifier mécaniquement votre robot! Remplacez les chenilles par des roues, ajoutez des capteurs, modifiez la structure, augmentez la puissance... Tout est permis pour créer le robot le plus performant sur les circuits précédents.

### Objectifs techniques
- Identifier les limitations mécaniques de la configuration initiale
- Concevoir et implémenter des améliorations matérielles
- Adapter le code pour tirer parti des nouvelles capacités du robot

### Critères d'évaluation
- **Innovation**: Créativité des modifications apportées
- **Performance**: Amélioration mesurable par rapport à la version initiale
- **Ingénierie**: Qualité de l'exécution et robustesse des modifications
- **Rapport coût/bénéfice**: Efficacité des choix techniques par rapport aux ressources utilisées

### Conseils
- Analysez les performances de votre robot sur les challenges précédents pour identifier les points faibles
- Testez vos modifications une par une pour mesurer leur impact
- N'oubliez pas que la meilleure solution n'est pas toujours la plus complexe

---

## Système de points et classement final

Chaque challenge rapporte des points selon la formule suivante:
- 1er: 10 points
- 2ème: 7 points
- 3ème: 5 points
- 4ème: 3 points
- 5ème et plus: 1 point

Des points bonus peuvent être attribués pour:
- Solutions particulièrement innovantes (+3 points)
- Code exceptionnel et bien documenté (+2 points)
- Esprit d'équipe et entraide (+2 points)

Le classement final combine les points de tous les challenges, avec une pondération plus importante pour les derniers défis qui sont plus complexes.

---

## Conclusion: À vos marques, prêts, codez !

Ce hackathon "MQTT Race" a été conçu pour vous offrir une expérience complète des objets connectés, alliant programmation, électronique, mécanique et travail d'équipe. Les challenges proposés vous permettront d'explorer progressivement les différentes facettes de l'IoT à travers une compétition ludique et stimulante.

N'oubliez pas que l'objectif principal est l'apprentissage : chaque obstacle rencontré est une opportunité d'approfondir vos connaissances. Les défis sont conçus pour être accessibles aux débutants tout en offrant suffisamment de complexité pour les plus expérimentés.

Que votre code soit aussi rapide que vos robots, et que vos messages MQTT ne se perdent jamais dans le brouillard de l'IoT !

### Ressources supplémentaires

- Documentation du kit Freenove FNK0077: [lien vers documentation]
- Guide d'utilisation de l'ESP32
- Tutoriels MQTT
- Exemples de code pour le suivi de ligne
- Modèles d'asservissement PID

### FAQ

**Q: Peut-on utiliser des bibliothèques existantes ?**
R: Oui, l'utilisation de bibliothèques est encouragée pour gagner du temps.

**Q: Que se passe-t-il si notre robot sort de la piste ?**
R: Vous pouvez le replacer manuellement sur la piste, mais avec une pénalité de temps.

**Q: Est-il possible de modifier le robot entre les challenges ?**
R: Oui, vous pouvez ajuster votre code et faire des modifications mineures entre chaque défi.

**Q: Comment gérer les problèmes de batterie ?**
R: Des batteries de rechange seront disponibles. Prévoyez de recharger régulièrement.

**Q: Y aura-t-il des prix pour les gagnants ?**
R: Bien sûr ! Des prix seront décernés aux meilleures équipes, mais le véritable gain reste les compétences acquises.