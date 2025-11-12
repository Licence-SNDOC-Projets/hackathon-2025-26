# 📧 Solutions alternatives pour l'envoi d'emails

## 🚨 Problème identifié

Votre organisation (lasalle84.org) a désactivé les mots de passe d'application pour des raisons de sécurité. C'est une pratique courante dans les établissements.

## ✅ Solution 1 : Compte Gmail dédié (Recommandé pour le hackathon)

### Créer un compte Gmail spécifique

1. **Créez un compte Gmail** : `hackathon.mqtt.race@gmail.com`
2. **Activez l'authentification 2 étapes**
3. **Générez un App Password Gmail** (plus permissif que Office365)

### Configuration .env avec Gmail

```bash
# Configuration Gmail pour le hackathon
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hackathon.mqtt.race@gmail.com
EMAIL_PASSWORD=app_password_gmail_ici
EMAIL_FROM_NAME=Hackathon MQTT Race - LaSalle 84
EMAIL_FROM_ADDRESS=hackathon.mqtt.race@gmail.com
```

## ✅ Solution 2 : Mode développement sans vérification

Pour les tests et développement, désactivons temporairement la vérification :

```typescript
// Configuration développement dans .env
EMAIL_SKIP_VERIFICATION=true
EMAIL_USER=test@exemple.com
EMAIL_PASSWORD=fake_password
```

Le service fonctionnera en mode simulation et loggera les emails dans la console.

## ✅ Solution 3 : Contact admin IT

Si vous voulez absolument utiliser votre compte professionnel :

1. **Contactez l'admin IT** de LaSalle 84
2. **Demandez** l'activation temporaire des App Passwords
3. **Ou demandez** une configuration SMTP spéciale pour le hackathon

## ✅ Solution 4 : Microsoft Graph API (Avancé)

Alternative moderne avec OAuth2 au lieu de SMTP :
- Utilise l'API REST Microsoft Graph
- Compatible avec MFA
- Plus sécurisé mais plus complexe

## 🚀 Implémentation rapide - Mode simulation

Modifions le service pour fonctionner en mode développement sans vraie authentification :
