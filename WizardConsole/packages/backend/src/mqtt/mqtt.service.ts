import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client!: MqttClient;
  private retainedState = new Map<string, string>();

  async onModuleInit() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    console.log('📡 Connexion au broker MQTT:', brokerUrl);
    
    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId: 'wizard-console-backend',
        clean: true,
        reconnectPeriod: 1000,
      });

      this.client.on('connect', () => {
        console.log('✅ MQTT connecté avec succès');
        this.setupSubscriptions();
      });

      this.client.on('message', (topic, message) => {
        const payload = message.toString();
        console.log(`📨 MQTT: ${topic} = ${payload}`);
        
        // Stocker les messages retained
        if (payload) {
          this.retainedState.set(topic, payload);
        }
      });

      this.client.on('error', (error) => {
        console.error('❌ Erreur MQTT:', error);
      });

    } catch (error) {
      console.error('❌ Impossible de se connecter au broker MQTT:', error);
    }
  }

  async onModuleDestroy() {
    if (this.client && this.client.connected) {
      this.client.end(true);
      console.log('📡 MQTT déconnecté');
    }
  }

  private setupSubscriptions() {
    // S'abonner à tous les topics pour surveiller l'état
    const topics = [
      '/teams/+/status/+',
      '/teams/+/config/+', 
      '/teams/+/startchallenge',
      '/challenges/+/+/+',
      '/beacons/+/+'
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`❌ Erreur abonnement ${topic}:`, err);
        } else {
          console.log(`✅ Abonné à ${topic}`);
        }
      });
    });
  }

  // Publication avec retention pour l'état persistant
  async publishState(topic: string, payload: string): Promise<void> {
    if (!this.client || !this.client.connected) {
      console.warn('⚠️ MQTT non connecté, impossible de publier:', topic);
      return;
    }

    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, { retain: true }, (error) => {
        if (error) {
          console.error(`❌ Erreur publication retained ${topic}:`, error);
          reject(error);
        } else {
          this.retainedState.set(topic, payload);
          console.log(`📤 État publié: ${topic} = ${payload}`);
          resolve();
        }
      });
    });
  }

  // Publication transitoire pour les événements
  async publishEvent(topic: string, payload: string): Promise<void> {
    if (!this.client || !this.client.connected) {
      console.warn('⚠️ MQTT non connecté, impossible de publier:', topic);
      return;
    }

    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, { retain: false }, (error) => {
        if (error) {
          console.error(`❌ Erreur publication event ${topic}:`, error);
          reject(error);
        } else {
          console.log(`📨 Événement publié: ${topic} = ${payload}`);
          resolve();
        }
      });
    });
  }

  // Obtenir l'état complet retained
  getAllRetainedMessages(): Map<string, string> {
    return new Map(this.retainedState);
  }

  // Restaurer l'état depuis backup
  async restoreState(state: Map<string, string>): Promise<void> {
    console.log(`🔄 Restauration de ${state.size} topics MQTT...`);
    
    for (const [topic, payload] of state.entries()) {
      await this.publishState(topic, payload);
    }
    
    console.log('✅ État MQTT restauré');
  }

  // Vérifier la connexion
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  // Obtenir des stats
  getStats() {
    return {
      connected: this.isConnected(),
      retainedMessages: this.retainedState.size,
      uptime: process.uptime(),
    };
  }
}