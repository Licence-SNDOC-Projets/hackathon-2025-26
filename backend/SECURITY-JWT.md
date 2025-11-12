# 🔐 Authentification JWT - Hackathon MQTT Race

## ✅ Sécurité implémentée et fonctionnelle

### 🎯 Architecture de sécurité

**Backend NestJS :**
- ✅ **AuthService** : Validation credentials + génération JWT
- ✅ **AuthController** : Routes login/logout/profile/verify
- ✅ **JwtStrategy** : Validation tokens JWT avec Passport
- ✅ **JwtAuthGuard** : Protection des routes sensibles
- ✅ **Configuration .env** : JWT_SECRET, credentials admin

**Frontend Angular :**
- ✅ **AuthService** : Gestion état authentification + localStorage
- ✅ **AuthInterceptor** : Injection automatique JWT dans requêtes
- ✅ **LoginComponent** : Interface de connexion style Tron
- ✅ **Guards** : Protection des routes sensibles

## 🔑 Credentials par défaut

```bash
# Configurés dans .env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=hackathon2025
JWT_SECRET=hackathon_mqtt_race_super_secret_key_2025
JWT_EXPIRES_IN=24h
```

## 🚀 Endpoints d'authentification

### POST `/api/auth/login`
```json
{
  "username": "admin",
  "password": "hackathon2025"
}
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin", 
    "role": "admin"
  },
  "expires_in": "24h"
}
```

### GET `/api/auth/profile` (protégé)
Header : `Authorization: Bearer <token>`

### POST `/api/auth/logout` (protégé)
Header : `Authorization: Bearer <token>`

### GET `/api/auth/verify` (protégé)
Vérifie la validité du token

## 🛡️ Routes protégées

**Challenges (nécessitent JWT) :**
- `POST /api/challenges/teams/register`
- `POST /api/challenges/request`  
- `POST /api/challenges/start`

**Emails (publiques pour l'instant) :**
- `GET /api/email/test`
- `POST /api/email/send`

**Routes publiques :**
- `GET /api/challenges` (liste)
- `GET /api/challenges/:id` (détails)
- `GET /api/challenges/stats`
- `GET /api/auth/health`

## 🧪 Tests authentification

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"hackathon2025"}'
```

### 2. Accès route protégée
```bash
curl -X POST http://localhost:3000/api/challenges/teams/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <votre_token>" \
  -d '{"id":"team-test","name":"Team Test"}'
```

### 3. Accès sans token (erreur 401)
```bash
curl -X POST http://localhost:3000/api/challenges/teams/register \
  -H "Content-Type: application/json" \
  -d '{"id":"team-test","name":"Team Test"}'
```

## 🎮 Frontend Angular

### Page de login
- URL : `http://localhost:4200/login`
- Style Tron Legacy cohérent
- Formulaire avec validation
- Gestion erreurs

### Service AuthService
```typescript
// Connexion
this.authService.login({username: 'admin', password: 'hackathon2025'})

// Vérifier l'état
this.authService.isAuthenticated$

// Obtenir utilisateur
this.authService.currentUser$

// Déconnexion
this.authService.logout()
```

### Interceptor automatique
- Injecte automatiquement `Authorization: Bearer <token>`
- Gère les erreurs 401 → redirection login
- Exclut les routes publiques

## 🔒 Sécurité mise en place

**Fonctionnalités actives :**
- ✅ **JWT tokens** : Expiration 24h, secret sécurisé
- ✅ **Routes protégées** : Actions sensibles (enregistrement équipes, démarrage challenges)
- ✅ **Gestion sessions** : localStorage + état réactif
- ✅ **Redirections automatiques** : Login/logout/401
- ✅ **Validation tokens** : Backend + frontend

**Permissions système :**
- Rôle `admin` → Tous les droits sur challenges, équipes, emails
- Token JWT → Accès API sécurisé 24h
- Routes publiques → Consultation sans authentification

Le système d'authentification JWT est maintenant **complètement opérationnel** ! 🎯🔐
