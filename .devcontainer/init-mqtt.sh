#!/bin/bash

# =================================================================
# Script d'initialisation MQTT pour le Hackathon MQTT Race
# =================================================================

echo "🚀 Initialisation du serveur MQTT pour le hackathon..."

# Créer les répertoires nécessaires pour Mosquitto
echo "📁 Création des répertoires de données MQTT..."
mkdir -p .devcontainer/mosquitto/data
mkdir -p .devcontainer/mosquitto/log
mkdir -p .devcontainer/mosquitto/config

# Définir les permissions appropriées pour mosquitto (UID/GID 1883)
echo "🔒 Configuration des permissions MQTT..."
sudo chown -R 1883:1883 .devcontainer/mosquitto/data
sudo chown -R 1883:1883 .devcontainer/mosquitto/log
chmod -R 755 .devcontainer/mosquitto/

# Créer un fichier de log initial avec les bonnes permissions
sudo touch .devcontainer/mosquitto/log/mosquitto.log
sudo chown 1883:1883 .devcontainer/mosquitto/log/mosquitto.log

echo "✅ Initialisation terminée!"
echo ""
echo "📊 Services disponibles:"
echo "  🔌 MQTT Broker TCP    : localhost:1883"
echo "  🌐 MQTT WebSocket     : localhost:9001"
echo "  🖥️  MQTT Web Client   : http://localhost:8080"
echo "  🚀 Backend API        : http://localhost:3000"
echo "  📱 Frontend Angular   : http://localhost:4200"
echo ""
echo "💡 Pour tester la connexion MQTT:"
echo "  mosquitto_pub -h localhost -t 'hackathon/test' -m 'Hello MQTT!'"
echo "  mosquitto_sub -h localhost -t 'hackathon/test'"
echo ""
echo "🔧 Persistence MQTT activée dans /mosquitto/data/"
