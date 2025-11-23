import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MqttService, MqttStatus, MqttResponse } from '../../../core/services/mqtt.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

/**
 * Composant de contrôle du serveur MQTT (Admin uniquement)
 *
 * Permet de:
 * - Démarrer/arrêter/redémarrer le serveur MQTT
 * - Voir le statut en temps réel
 * - Rafraîchir automatiquement le statut
 */
@Component({
  selector: 'app-mqtt-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mqtt-control.component.html',
  styleUrls: ['./mqtt-control.component.scss']
})
export class MqttControlComponent implements OnInit {
  private mqttService = inject(MqttService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // État du composant
  status = signal<MqttStatus | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  lastMessage = signal<string | null>(null);
  isAdmin = signal<boolean>(false);

  // Timer pour rafraîchissement automatique
  private refreshInterval: any;

  ngOnInit() {
    // Vérifier les droits admin
    this.isAdmin.set(this.authService.isAdmin());

    if (!this.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }

    // Charger le statut initial
    this.refreshStatus();

    // Rafraîchir toutes les 5 secondes
    this.refreshInterval = setInterval(() => {
      this.refreshStatus(true);
    }, 5000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Rafraîchit le statut du serveur MQTT
   */
  refreshStatus(silent = false) {
    if (!silent) {
      this.loading.set(true);
    }
    this.error.set(null);

    this.mqttService.getStatus().subscribe({
      next: (response) => {
        this.status.set(response.data || null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Impossible de récupérer le statut du serveur');
        this.loading.set(false);
        console.error('Erreur statut MQTT:', err);
      }
    });
  }

  /**
   * Démarre le serveur MQTT
   */
  startServer() {
    this.loading.set(true);
    this.error.set(null);

    this.mqttService.startServer().subscribe({
      next: (response) => {
        this.lastMessage.set(response.message);
        setTimeout(() => this.refreshStatus(), 2000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur lors du démarrage');
        this.loading.set(false);
      }
    });
  }

  /**
   * Arrête le serveur MQTT
   */
  stopServer() {
    this.loading.set(true);
    this.error.set(null);

    this.mqttService.stopServer().subscribe({
      next: (response) => {
        this.lastMessage.set(response.message);
        setTimeout(() => this.refreshStatus(), 2000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur lors de l\'arrêt');
        this.loading.set(false);
      }
    });
  }

  /**
   * Redémarre le serveur MQTT
   */
  restartServer() {
    this.loading.set(true);
    this.error.set(null);

    this.mqttService.restartServer().subscribe({
      next: (response) => {
        this.lastMessage.set(response.message);
        setTimeout(() => this.refreshStatus(), 2000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur lors du redémarrage');
        this.loading.set(false);
      }
    });
  }

  /**
   * Recharge la configuration
   */
  reloadConfig() {
    this.loading.set(true);
    this.error.set(null);

    this.mqttService.reloadConfig().subscribe({
      next: (response) => {
        this.lastMessage.set(response.message);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur lors du rechargement');
        this.loading.set(false);
      }
    });
  }

  /**
   * Formate le temps d'activité en format lisible
   */
  formatUptime(seconds: number | undefined): string {
    if (!seconds) return 'N/A';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}
