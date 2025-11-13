#!/bin/bash

# =================================================================
# Script d'entrée pour Mosquitto MQTT avec persistance
# Assure que les permissions sont correctes au démarrage
# =================================================================

set -e

echo "🚀 Démarrage du broker MQTT avec persistance..."

# S'assurer que les répertoires existent avec les bonnes permissions
echo "📁 Vérification des répertoires de données..."
mkdir -p /mosquitto/data /mosquitto/log

# Vérifier les permissions sur les volumes montés
if [ -d "/mosquitto/data" ]; then
    echo "🔒 Ajustement des permissions pour /mosquitto/data"
    chown -R mosquitto:mosquitto /mosquitto/data
    chmod -R 755 /mosquitto/data
fi

if [ -d "/mosquitto/log" ]; then
    echo "🔒 Ajustement des permissions pour /mosquitto/log"  
    chown -R mosquitto:mosquitto /mosquitto/log
    chmod -R 755 /mosquitto/log
fi

# Créer le fichier de base de données s'il n'existe pas
if [ ! -f "/mosquitto/data/mosquitto.db" ]; then
    echo "💾 Création du fichier de base de données MQTT..."
    touch /mosquitto/data/mosquitto.db
    chown mosquitto:mosquitto /mosquitto/data/mosquitto.db
fi

# Créer le fichier de log s'il n'existe pas
if [ ! -f "/mosquitto/log/mosquitto.log" ]; then
    echo "📝 Création du fichier de log MQTT..."
    touch /mosquitto/log/mosquitto.log
    chown mosquitto:mosquitto /mosquitto/log/mosquitto.log
fi

echo "✅ Configuration des permissions terminée"
echo "🔌 Démarrage du broker MQTT sur les ports 1883 (TCP) et 9001 (WebSocket)..."

# Passer à l'utilisateur mosquitto et exécuter la commande
exec su-exec mosquitto "$@"