const axios = require('axios');

// Configuration de base
const BASE_URL = 'http://localhost:3000/api';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'hackathon2025'
};

let authToken = '';

async function authenticate() {
  try {
    console.log('🔐 Authentification...');
    const response = await axios.post(`${BASE_URL}/auth/admin-login`, ADMIN_CREDENTIALS);
    authToken = response.data.access_token;
    console.log('✅ Authentification réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error.response?.data || error.message);
    return false;
  }
}

async function testMqttEndpoints() {
  if (!authToken) {
    console.error('❌ Token d\'authentification manquant');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  const endpoints = [
    { method: 'GET', path: '/mqtt/endpoints', description: 'Liste des endpoints' },
    { method: 'GET', path: '/mqtt/health', description: 'Santé du service MQTT' },
    { method: 'GET', path: '/mqtt/status', description: 'Statut du serveur MQTT' },
    { method: 'GET', path: '/mqtt/config', description: 'Configuration MQTT' }
  ];

  console.log('\n🧪 Test des endpoints MQTT...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`📋 Test: ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);

      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${BASE_URL}${endpoint.path}`, { headers });
      } else if (endpoint.method === 'POST') {
        response = await axios.post(`${BASE_URL}${endpoint.path}`, {}, { headers });
      }

      console.log(`✅ Statut: ${response.status}`);
      console.log(`📄 Réponse: ${endpoint.path === '/mqtt/config' ?
        'Configuration récupérée (contenu masqué)' :
        JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
      console.log('');

    } catch (error) {
      console.error(`❌ Erreur: ${error.response?.status} - ${error.response?.statusText}`);
      if (error.response?.data) {
        console.error(`📄 Détails: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      console.log('');
    }
  }

  // Test des endpoints d'action (avec précaution)
  console.log('🛠️  Test des endpoints d\'action (statut seulement)...\n');

  const actionEndpoints = [
    { method: 'POST', path: '/mqtt/start', description: 'Démarrer MQTT', safe: true },
    { method: 'POST', path: '/mqtt/stop', description: 'Arrêter MQTT', safe: false }, // Ne pas exécuter automatiquement
    { method: 'POST', path: '/mqtt/restart', description: 'Redémarrer MQTT', safe: false },
    { method: 'POST', path: '/mqtt/reload', description: 'Recharger config', safe: false }
  ];

  for (const endpoint of actionEndpoints) {
    console.log(`🔧 Endpoint disponible: ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
    if (!endpoint.safe) {
      console.log('⚠️  (Non testé automatiquement pour éviter les interruptions)');
    }
    console.log('');
  }
}

async function main() {
  console.log('🚀 Test des fonctionnalités MQTT du backend\n');

  try {
    // Vérifier si le serveur est accessible
    await axios.get(`${BASE_URL}/`);
    console.log('✅ Serveur backend accessible');
  } catch (error) {
    console.error('❌ Serveur backend non accessible:', error.message);
    console.log('💡 Assurez-vous que le backend est démarré avec: npx nx serve backend');
    return;
  }

  // S'authentifier
  const isAuthenticated = await authenticate();
  if (!isAuthenticated) return;

  // Tester les endpoints
  await testMqttEndpoints();

  console.log('\n🎉 Tests terminés!');
  console.log('\n📝 Résumé des fonctionnalités ajoutées:');
  console.log('  • Service MQTT pour gérer le serveur Mosquitto');
  console.log('  • Contrôleur avec 9 endpoints sécurisés');
  console.log('  • Gestion des configurations via variables d\'environnement');
  console.log('  • Commandes Docker pour start/stop/restart/reload');
  console.log('  • Lecture/écriture de la configuration mosquitto.conf');
  console.log('  • Authentification JWT requise pour tous les endpoints');
}

// Gestion d'erreur globale
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error.message);
});

main();
