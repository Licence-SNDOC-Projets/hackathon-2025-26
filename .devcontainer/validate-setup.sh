#!/bin/bash

# =================================================================
# Script de validation de la configuration dev container
# Vérifie que MQTT et les permissions sont correctement configurés
# =================================================================

set -e

echo "🔍 Validation de la configuration dev container..."
echo ""

# Fonction pour afficher les résultats
check_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        return 1
    fi
}

# 1. Vérifier les permissions du workspace
echo "📁 Vérification des permissions du workspace..."
if [ -w "/workspace" ]; then
    check_result 0 "Permissions d'écriture sur /workspace"
else
    check_result 1 "Permissions d'écriture sur /workspace"
fi

# 2. Vérifier les volumes MQTT
echo "💾 Vérification des volumes MQTT..."
if [ -d "/workspace/.devcontainer/mosquitto/data" ]; then
    check_result 0 "Répertoire de données MQTT présent"
else
    check_result 1 "Répertoire de données MQTT manquant"
fi

if [ -d "/workspace/.devcontainer/mosquitto/log" ]; then
    check_result 0 "Répertoire de logs MQTT présent"
else
    check_result 1 "Répertoire de logs MQTT manquant"
fi

# 3. Vérifier la connectivité MQTT
echo "🔌 Test de connectivité MQTT..."
timeout 5 bash -c "</dev/tcp/mqtt/1883" 2>/dev/null && \
    check_result 0 "Connexion MQTT TCP (port 1883)" || \
    check_result 1 "Connexion MQTT TCP (port 1883)"

timeout 5 bash -c "</dev/tcp/mqtt/9001" 2>/dev/null && \
    check_result 0 "Connexion MQTT WebSocket (port 9001)" || \
    check_result 1 "Connexion MQTT WebSocket (port 9001)"

# 4. Tester npm install
echo "📦 Test d'installation des dépendances..."
if npm --version >/dev/null 2>&1; then
    check_result 0 "NPM disponible"
    
    # Test d'installation en mode dry-run
    cd /workspace
    if npm install --dry-run >/dev/null 2>&1; then
        check_result 0 "NPM install peut s'exécuter"
    else
        check_result 1 "NPM install échoue"
    fi
else
    check_result 1 "NPM non disponible"
fi

# 5. Vérifier les fichiers de configuration
echo "⚙️  Vérification des fichiers de configuration..."
if [ -f "/workspace/.devcontainer/mosquitto/config/mosquitto.conf" ]; then
    check_result 0 "Configuration MQTT présente"
else
    check_result 1 "Configuration MQTT manquante"
fi

# 6. Informations sur l'utilisateur
echo ""
echo "👤 Informations utilisateur:"
echo "   Utilisateur actuel: $(whoami)"
echo "   UID/GID: $(id)"
echo "   Répertoire home: $HOME"

# 7. Informations sur les volumes
echo ""
echo "💿 Informations sur les volumes Docker:"
if command -v docker >/dev/null 2>&1; then
    echo "   Volumes MQTT:"
    docker volume ls | grep -E "(mqtt_data|mqtt_log)" || echo "   Aucun volume MQTT trouvé"
fi

echo ""
echo "🏁 Validation terminée!"
echo ""
echo "📋 Services disponibles après démarrage:"
echo "  🔌 MQTT Broker TCP    : localhost:1883"
echo "  🌐 MQTT WebSocket     : localhost:9001"  
echo "  🖥️  MQTT Web Client   : http://localhost:8080"
echo "  🚀 Backend API        : http://localhost:3000"
echo "  📱 Frontend Angular   : http://localhost:4200"