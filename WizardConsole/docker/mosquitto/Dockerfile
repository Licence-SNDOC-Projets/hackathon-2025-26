FROM eclipse-mosquitto:latest

# Copier la configuration personnalisée
COPY ./mosquitto.conf /mosquitto/config/mosquitto.conf

# Créer les répertoires nécessaires
RUN mkdir -p /mosquitto/data /mosquitto/log

# Permissions
RUN chown -R mosquitto:mosquitto /mosquitto

EXPOSE 1883 9001