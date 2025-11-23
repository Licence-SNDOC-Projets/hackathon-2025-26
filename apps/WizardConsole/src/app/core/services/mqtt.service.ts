import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

/**
 * Interface pour le statut MQTT
 */
export interface MqttStatus {
  isRunning: boolean;
  uptime?: number;
  version?: string;
  port?: number;
  connections?: number;
}

/**
 * Interface pour la réponse API MQTT
 */
export interface MqttResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

/**
 * Interface pour les informations de santé
 */
export interface MqttHealth {
  status: string;
  details?: any;
}

/**
 * Service Angular pour gérer le serveur MQTT
 *
 * Permet aux admins de:
 * - Démarrer/arrêter/redémarrer le serveur MQTT
 * - Voir le statut du serveur
 * - Gérer la configuration
 */
@Injectable({
  providedIn: 'root'
})
export class MqttService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/mqtt';

  /**
   * Démarre le serveur MQTT
   */
  startServer(): Observable<MqttResponse> {
    return this.http.post<MqttResponse>(`${this.baseUrl}/start`, {})
      .pipe(
        tap(response => {
          console.log('🚀 Serveur MQTT:', response.message);
        }),
        catchError(error => {
          console.error('❌ Erreur démarrage MQTT:', error);
          throw error;
        })
      );
  }

  /**
   * Arrête le serveur MQTT
   */
  stopServer(): Observable<MqttResponse> {
    return this.http.post<MqttResponse>(`${this.baseUrl}/stop`, {})
      .pipe(
        tap(response => {
          console.log('🛑 Serveur MQTT:', response.message);
        }),
        catchError(error => {
          console.error('❌ Erreur arrêt MQTT:', error);
          throw error;
        })
      );
  }

  /**
   * Redémarre le serveur MQTT
   */
  restartServer(): Observable<MqttResponse> {
    return this.http.post<MqttResponse>(`${this.baseUrl}/restart`, {})
      .pipe(
        tap(response => {
          console.log('🔄 Serveur MQTT:', response.message);
        }),
        catchError(error => {
          console.error('❌ Erreur redémarrage MQTT:', error);
          throw error;
        })
      );
  }

  /**
   * Recharge la configuration MQTT
   */
  reloadConfig(): Observable<MqttResponse> {
    return this.http.post<MqttResponse>(`${this.baseUrl}/reload`, {})
      .pipe(
        tap(response => {
          console.log('♻️ Configuration MQTT:', response.message);
        }),
        catchError(error => {
          console.error('❌ Erreur rechargement config:', error);
          throw error;
        })
      );
  }

  /**
   * Obtient le statut du serveur MQTT
   */
  getStatus(): Observable<MqttResponse<MqttStatus>> {
    return this.http.get<MqttResponse<MqttStatus>>(`${this.baseUrl}/status`)
      .pipe(
        catchError(error => {
          console.error('❌ Erreur récupération statut:', error);
          throw error;
        })
      );
  }

  /**
   * Obtient la configuration MQTT
   */
  getConfig(): Observable<MqttResponse<{ config: string }>> {
    return this.http.get<MqttResponse<{ config: string }>>(`${this.baseUrl}/config`)
      .pipe(
        catchError(error => {
          console.error('❌ Erreur récupération config:', error);
          throw error;
        })
      );
  }

  /**
   * Met à jour la configuration MQTT
   */
  updateConfig(config: string): Observable<MqttResponse> {
    return this.http.put<MqttResponse>(`${this.baseUrl}/config`, { config })
      .pipe(
        tap(response => {
          console.log('💾 Configuration MQTT mise à jour:', response.message);
        }),
        catchError(error => {
          console.error('❌ Erreur mise à jour config:', error);
          throw error;
        })
      );
  }

  /**
   * Obtient les informations de santé du service MQTT
   */
  getHealth(): Observable<MqttResponse<MqttHealth>> {
    return this.http.get<MqttResponse<MqttHealth>>(`${this.baseUrl}/health`)
      .pipe(
        catchError(error => {
          console.error('❌ Erreur health check:', error);
          throw error;
        })
      );
  }

  /**
   * Obtient la liste des endpoints disponibles
   */
  getEndpoints(): Observable<MqttResponse> {
    return this.http.get<MqttResponse>(`${this.baseUrl}/endpoints`)
      .pipe(
        catchError(error => {
          console.error('❌ Erreur récupération endpoints:', error);
          throw error;
        })
      );
  }
}
