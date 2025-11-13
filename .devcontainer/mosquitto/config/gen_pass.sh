# Déterminer le chemin absolu du répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Générer automatiquement les utilisateurs Mosquitto à partir de secrets.txt
while IFS=': ' read -r user pass; do
    docker run --rm -v "$SCRIPT_DIR/passwd:/mosquitto/config/passwd" eclipse-mosquitto:1.6 \
        mosquitto_passwd -b /mosquitto/config/passwd "$user" "$pass"
done < <(grep -v '^#' "$SCRIPT_DIR/secrets.txt")
