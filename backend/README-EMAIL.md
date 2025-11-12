# 📧 Service d'Emails - Hackathon MQTT Race

## 🎯 Vue d'ensemble

Le service d'emails permet d'envoyer des notifications automatiques via Office365 pour :
- Résultats de challenges
- Rapports quotidiens
- Communications avec les équipes
- Tests de configuration

## ⚙️ Configuration

### Variables d'environnement (.env)

```bash
# Configuration Email Office365 - À configurer avec vos vraies credentials
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=s.brissy@lasalle84.org
EMAIL_PASSWORD=votre_mot_de_passe_office365
EMAIL_FROM_NAME=Hackathon MQTT Race
EMAIL_FROM_ADDRESS=s.brissy@lasalle84.org
```

**⚠️ Important :**
- Remplacez `votre_mot_de_passe_office365` par votre vrai mot de passe
- Pour Office365, vous devrez peut-être créer un "App Password" si l'authentification 2FA est activée

## 🚀 Routes disponibles

### GET `/api/email/test`
Envoie un email de test à `sylvain.brissy@gmail.com`

**Exemple de réponse :**
```json
{
  "success": true,
  "message": "Email de test envoyé avec succès",
  "data": {
    "messageId": "<...>",
    "recipient": "sylvain.brissy@gmail.com",
    "timestamp": "2025-11-12T19:49:00.000Z"
  }
}
```

### POST `/api/email/send`
Envoie un email personnalisé

**Body :**
```json
{
  "to": "destinataire@exemple.com",
  "subject": "Sujet de l'email",
  "html": "<h1>Contenu HTML</h1>",
  "text": "Contenu texte",
  "cc": ["cc@exemple.com"],
  "bcc": ["bcc@exemple.com"]
}
```

### POST `/api/email/challenge-completion`
Envoie une notification de fin de challenge

**Body :**
```json
{
  "recipient": "equipe@exemple.com",
  "challengeName": "Tron Legacy Circuit",
  "teamName": "Team Alpha",
  "finalScore": 95,
  "position": 1,
  "bestLapTime": "23.45s",
  "totalTime": "1:45.23"
}
```

### POST `/api/email/daily-report`
Envoie un rapport quotidien

**Body :**
```json
{
  "recipient": "superviseur@exemple.com"
}
```

### GET `/api/email/config`
Affiche la configuration email (sans mots de passe)

### GET `/api/email/health`
Vérifie l'état de santé du service email

## 🧪 Tests avec curl

### Test de l'email de test
```bash
curl http://localhost:3000/api/email/test
```

### Test de configuration
```bash
curl http://localhost:3000/api/email/health
```

### Test d'email personnalisé
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@exemple.com",
    "subject": "Test depuis curl",
    "html": "<h1>Hello from backend!</h1>"
  }'
```

## 🎨 Templates d'emails

Le service inclut des templates HTML avec thème Tron Legacy pour :
- **Emails de test** : Design futuriste avec informations système
- **Fin de challenges** : Résultats avec podium et métriques
- **Rapports quotidiens** : Statistiques complètes avec grille

## 🔧 Configuration Office365

Pour Office365, assurez-vous que :
1. **SMTP** est activé sur le compte
2. **Authentification moderne** est configurée si nécessaire  
3. **App Password** est créé si l'authentification 2FA est activée
4. Le compte a les **permissions d'envoi SMTP**

## 🚨 Dépannage

### Erreur d'authentification
- Vérifiez les credentials dans le .env
- Créez un App Password pour Office365
- Testez l'authentification avec un client email

### Erreur de connexion  
- Vérifiez que le port 587 n'est pas bloqué
- Testez avec `telnet smtp-mail.outlook.com 587`

### Emails non reçus
- Vérifiez les spams/courrier indésirable
- Vérifiez les limites d'envoi Office365
- Consultez les logs NestJS pour plus de détails

## ✅ Intégration avec les challenges

Le service d'emails peut être facilement intégré dans les challenges pour envoyer automatiquement les résultats :

```typescript
// Dans un challenge
async cleanup(team: Team): Promise<void> {
  const result = await this.getDetailedResult(team);
  
  // Envoyer email de résultats
  await this.emailService.sendChallengeCompletionEmail(
    'destinataire@exemple.com',
    {
      challengeName: this.config.name,
      teamName: team.name,
      finalScore: await this.calculateScore(result),
      // ... autres données
    }
  );
}
```

Le service d'emails est maintenant prêt pour le hackathon ! 🎉
