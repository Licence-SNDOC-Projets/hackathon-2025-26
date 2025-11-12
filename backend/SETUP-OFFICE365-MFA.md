# 🔐 Configuration Office365 avec MFA - Guide complet

## 🎯 Problème MFA

Votre compte `s.brissy@lasalle84.org` a l'authentification multifactorielle (MFA/2FA) activée, ce qui empêche l'authentification SMTP classique. Voici comment résoudre cela :

## ✅ Solution 1 : App Password (Recommandé)

### Étape 1 : Créer un App Password

1. **Connectez-vous à** : https://account.microsoft.com/security
2. **Accédez à** : "Méthodes de connexion" > "Mot de passe d'application"
3. **Cliquez sur** : "Créer un nouveau mot de passe d'application"
4. **Nom de l'app** : `Hackathon MQTT Race Backend`
5. **Copiez le mot de passe généré** (format : xxxx-xxxx-xxxx-xxxx)

### Étape 2 : Mettre à jour le .env

```bash
# Configuration Email Office365 avec App Password
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=s.brissy@lasalle84.org
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx  # ⚠️ Utilisez l'App Password, PAS votre mot de passe normal
EMAIL_FROM_NAME=Hackathon MQTT Race
EMAIL_FROM_ADDRESS=s.brissy@lasalle84.org
```

### Étape 3 : Redémarrer le backend

```bash
npx nx serve backend
```

## 🔒 Solution 2 : Configuration SMTP alternative

Si les App Passwords ne sont pas disponibles, utilisez cette configuration :

```bash
# Configuration alternative pour Office365 avec MFA
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=s.brissy@lasalle84.org
EMAIL_PASSWORD=votre_app_password
EMAIL_FROM_NAME=Hackathon MQTT Race
EMAIL_FROM_ADDRESS=s.brissy@lasalle84.org
EMAIL_SECURE=false
EMAIL_TLS_CIPHERS=SSLv3
EMAIL_AUTH_METHOD=LOGIN
```

## 🔍 Vérifications

### 1. Tester la connexion
```bash
curl http://localhost:3000/api/email/health
```

**Réponse attendue :**
```json
{
  "success": true,
  "status": "healthy",
  "data": {
    "configured": true,
    "message": "Service email prêt à envoyer des messages"
  }
}
```

### 2. Tester l'envoi
```bash
curl http://localhost:3000/api/email/test
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Email de test envoyé avec succès à sylvain.brissy@gmail.com",
  "data": {
    "messageId": "...",
    "timestamp": "..."
  }
}
```

## 🚨 Si ça ne fonctionne toujours pas

### Option A : Utiliser Gmail à la place

Créez un compte Gmail dédié et utilisez un App Password Gmail :

```bash
# Configuration Gmail alternative
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre.hackathon@gmail.com
EMAIL_PASSWORD=app_password_gmail
EMAIL_FROM_NAME=Hackathon MQTT Race
EMAIL_FROM_ADDRESS=votre.hackathon@gmail.com
```

### Option B : Désactiver temporairement la vérification

Pour les tests uniquement, modifiez le service :

```typescript
// Dans email.service.ts - Pour tests seulement !
private async verifyConnection() {
  try {
    await this.transporter.verify();
    this.logger.log('✅ Connexion SMTP établie avec succès');
  } catch (error) {
    this.logger.warn('⚠️ Connexion SMTP non vérifiée:', error.message);
    // Ne pas faire crash l'application pour les tests
  }
}
```

## 💡 Conseils Office365

1. **App Password obligatoire** si MFA/2FA est activé
2. **Ne jamais** utiliser votre mot de passe principal pour SMTP
3. **Un App Password par application** (créez-en un spécifique)
4. **Révocable** : Vous pouvez supprimer l'App Password à tout moment
5. **Logs détaillés** : Les erreurs SMTP sont loggées dans la console NestJS

## 🔧 Debug

Si vous avez encore des problèmes :

1. **Vérifiez les logs** du backend au démarrage
2. **Testez la route health** : `/api/email/health`
3. **Vérifiez la config** : `/api/email/config`
4. **Consultez les erreurs** dans la console NestJS

## 🎯 Prochaines étapes

Une fois l'App Password configuré :
1. **Redémarrez le backend**
2. **Testez avec** : `curl http://localhost:3000/api/email/test`
3. **Vérifiez votre boîte mail** `sylvain.brissy@gmail.com`
4. **L'email de test** devrait arriver avec le thème Tron Legacy !

Le service d'emails est prêt, il ne manque que l'App Password ! 🚀📧
