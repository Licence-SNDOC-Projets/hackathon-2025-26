# 🔧 Fichiers de Configuration - WizardConsole

## 🐳 Docker Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  # MQTT Broker
  mosquitto:
    build: ./docker/mosquitto
    container_name: mqtt_broker
    ports:
      - "1883:1883"      # MQTT
      - "9001:9001"      # WebSocket
    volumes:
      - mqtt_data:/mosquitto/data
      - mqtt_logs:/mosquitto/log
    restart: unless-stopped

  # Backend NestJS
  backend:
    build: 
      context: .
      dockerfile: ./docker/backend/Dockerfile
    container_name: wizard_backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MQTT_BROKER_URL=mqtt://mosquitto:1883
      - BACKUP_INTERVAL=30000
      - JWT_SECRET=hackathon-mqtt-race-2024
    volumes:
      - ./packages/backend:/app
      - /app/node_modules
      - backup_data:/app/backups
    depends_on:
      - mosquitto
    restart: unless-stopped

  # Frontend Angular + Nginx
  frontend:
    build: 
      context: .
      dockerfile: ./docker/frontend/Dockerfile
    container_name: wizard_frontend
    ports:
      - "4200:80"
    volumes:
      - ./packages/frontend/dist:/usr/share/nginx/html
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mqtt_data:
  mqtt_logs:
  backup_data:
```

### docker/mosquitto/Dockerfile
```dockerfile
FROM eclipse-mosquitto:latest

# Copier la configuration personnalisée
COPY ./mosquitto.conf /mosquitto/config/mosquitto.conf

# Créer les répertoires nécessaires
RUN mkdir -p /mosquitto/data /mosquitto/log

# Permissions
RUN chown -R mosquitto:mosquitto /mosquitto

EXPOSE 1883 9001
```

### docker/mosquitto/mosquitto.conf
```ini
# Configuration MQTT standard
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/

# WebSocket support pour le frontend
listener 9001
protocol websockets
allow_anonymous true

# Logging détaillé pour le développement
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
log_type error
log_type warning
log_type notice
log_type information
log_type debug

# Sécurité (pour production future)
# password_file /mosquitto/config/passwd
# acl_file /mosquitto/config/acl

# Paramètres de performance
max_connections 100
max_inflight_messages 20
max_queued_messages 1000
message_size_limit 8192
```

### docker/backend/Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY packages/backend ./packages/backend/
COPY packages/shared ./packages/shared/

# Build du projet
RUN npx nx build backend --prod

# Créer le répertoire de sauvegarde
RUN mkdir -p /app/backups

# Exposer le port
EXPOSE 3000

# Démarrer l'application
CMD ["node", "dist/packages/backend/main.js"]
```

### docker/frontend/Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY packages/frontend ./packages/frontend/
COPY packages/shared ./packages/shared/

# Build de production
RUN npx nx build frontend --prod

# Production stage
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=build /app/dist/packages/frontend /usr/share/nginx/html

# Configuration nginx personnalisée
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker/nginx/nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    server {
        listen 80;
        server_name localhost;

        # Frontend Angular
        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
            try_files $uri $uri/ /index.html;
        }

        # Proxy vers l'API backend
        location /api/ {
            proxy_pass http://backend:3000/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket pour MQTT
        location /mqtt {
            proxy_pass http://mosquitto:9001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 📦 Configuration Nx

### nx.json
```json
{
  "extends": "nx/presets/npm.json",
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json",
      "!{projectRoot}/src/test-setup.ts"
    ],
    "sharedGlobals": []
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"]
    },
    "lint": {
      "inputs": [
        "default",
        "{workspaceRoot}/.eslintrc.json",
        "{workspaceRoot}/.eslintignore"
      ]
    }
  },
  "generators": {
    "@nx/angular": {
      "application": {
        "style": "scss",
        "linter": "eslint",
        "unitTestRunner": "jest",
        "e2eTestRunner": "cypress"
      },
      "component": {
        "style": "scss"
      },
      "library": {
        "linter": "eslint",
        "unitTestRunner": "jest"
      }
    }
  }
}
```

### package.json (root)
```json
{
  "name": "wizard-console",
  "version": "0.1.0",
  "license": "MIT",
  "scripts": {
    "build": "nx build",
    "test": "nx test",
    "lint": "nx workspace-lint && nx lint",
    "e2e": "nx e2e",
    "serve:backend": "nx serve backend",
    "serve:frontend": "nx serve frontend",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "mqtt:test": "mosquitto_sub -h localhost -p 1883 -t '#'"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "~17.0.0",
    "@angular/common": "~17.0.0",
    "@angular/compiler": "~17.0.0",
    "@angular/core": "~17.0.0",
    "@angular/forms": "~17.0.0",
    "@angular/platform-browser": "~17.0.0",
    "@angular/platform-browser-dynamic": "~17.0.0",
    "@angular/router": "~17.0.0",
    "@nestjs/common": "^10.0.2",
    "@nestjs/core": "^10.0.2",
    "@nestjs/platform-express": "^10.0.2",
    "@nestjs/websockets": "^10.0.2",
    "@nestjs/platform-socket.io": "^10.0.2",
    "mqtt": "^4.3.7",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "uuid": "^9.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "~17.0.0",
    "@angular-devkit/core": "~17.0.0",
    "@angular-devkit/schematics": "~17.0.0",
    "@angular-eslint/eslint-plugin": "~17.0.0",
    "@angular-eslint/eslint-plugin-template": "~17.0.0",
    "@angular-eslint/template-parser": "~17.0.0",
    "@angular/cli": "~17.0.0",
    "@angular/compiler-cli": "~17.0.0",
    "@angular/language-service": "~17.0.0",
    "@nestjs/schematics": "^10.0.1",
    "@nestjs/testing": "^10.0.2",
    "@nx/angular": "17.1.3",
    "@nx/cypress": "17.1.3",
    "@nx/eslint-plugin": "17.1.3",
    "@nx/jest": "17.1.3",
    "@nx/js": "17.1.3",
    "@nx/linter": "17.1.3",
    "@nx/nest": "17.1.3",
    "@nx/node": "17.1.3",
    "@nx/webpack": "17.1.3",
    "@nx/workspace": "17.1.3",
    "@types/jest": "^29.4.0",
    "@types/mqtt": "^2.5.0",
    "@types/node": "~18.7.1",
    "@types/uuid": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^6.9.1",
    "@typescript-eslint/parser": "^6.9.1",
    "cypress": "^13.0.0",
    "eslint": "~8.46.0",
    "eslint-config-prettier": "9.0.0",
    "jest": "^29.4.1",
    "jest-environment-jsdom": "^29.4.1",
    "jest-preset-angular": "~13.1.4",
    "nx": "17.1.3",
    "prettier": "^2.6.2",
    "ts-jest": "^29.1.0",
    "ts-node": "10.9.1",
    "typescript": "~5.2.2"
  }
}
```

## 🗂️ Structure des Projets

### packages/backend/project.json
```json
{
  "name": "backend",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/backend/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack",
      "outputs": ["{options.outputPath}"],
      "defaultConfiguration": "production",
      "options": {
        "target": "node",
        "compiler": "tsc",
        "outputPath": "dist/packages/backend",
        "main": "packages/backend/src/main.ts",
        "tsConfig": "packages/backend/tsconfig.app.json",
        "assets": ["packages/backend/src/assets"]
      },
      "configurations": {
        "development": {},
        "production": {
          "optimization": true,
          "extractLicenses": true,
          "inspect": false,
          "fileReplacements": [
            {
              "replace": "packages/backend/src/environments/environment.ts",
              "with": "packages/backend/src/environments/environment.prod.ts"
            }
          ]
        }
      }
    },
    "serve": {
      "executor": "@nx/js:node",
      "defaultConfiguration": "development",
      "options": {
        "buildTarget": "backend:build"
      },
      "configurations": {
        "development": {
          "buildTarget": "backend:build:development"
        },
        "production": {
          "buildTarget": "backend:build:production"
        }
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "packages/backend/jest.config.ts"
      }
    }
  },
  "tags": ["scope:backend", "type:app"]
}
```

### packages/frontend/project.json
```json
{
  "name": "frontend",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "prefix": "app",
  "sourceRoot": "packages/frontend/src",
  "targets": {
    "build": {
      "executor": "@angular-devkit/build-angular:browser",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/frontend",
        "index": "packages/frontend/src/index.html",
        "main": "packages/frontend/src/main.ts",
        "polyfills": ["zone.js"],
        "tsConfig": "packages/frontend/tsconfig.app.json",
        "assets": [
          "packages/frontend/src/favicon.ico",
          "packages/frontend/src/assets"
        ],
        "styles": [
          "packages/frontend/src/styles.scss"
        ],
        "scripts": []
      },
      "configurations": {
        "production": {
          "budgets": [
            {
              "type": "initial",
              "maximumWarning": "500kb",
              "maximumError": "1mb"
            },
            {
              "type": "anyComponentStyle",
              "maximumWarning": "2kb",
              "maximumError": "4kb"
            }
          ],
          "outputHashing": "all"
        },
        "development": {
          "buildOptimizer": false,
          "optimization": false,
          "vendorChunk": true,
          "extractLicenses": false,
          "sourceMap": true,
          "namedChunks": true
        }
      },
      "defaultConfiguration": "production"
    },
    "serve": {
      "executor": "@angular-devkit/build-angular:dev-server",
      "configurations": {
        "production": {
          "buildTarget": "frontend:build:production"
        },
        "development": {
          "buildTarget": "frontend:build:development"
        }
      },
      "defaultConfiguration": "development",
      "options": {
        "proxyConfig": "packages/frontend/proxy.conf.json"
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "packages/frontend/jest.config.ts"
      }
    }
  },
  "tags": ["scope:frontend", "type:app"]
}
```

## 🔗 Scripts et Commandes Utiles

### Développement
```bash
# Démarrage complet avec Docker
npm run docker:up

# Développement backend seul
npm run serve:backend

# Développement frontend seul
npm run serve:frontend

# Tests
npm test

# Build production
npm run build

# Monitoring MQTT
npm run mqtt:test
```

### Debug MQTT
```bash
# Écouter tous les messages
mosquitto_sub -h localhost -p 1883 -t "#" -v

# Publier un message test
mosquitto_pub -h localhost -p 1883 -t "/teams/alpha/status/connection" -m "online"

# Tester le WebSocket
wscat -c ws://localhost:9001