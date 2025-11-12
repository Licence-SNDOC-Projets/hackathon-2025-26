import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';

/**
 * Interface pour les credentials de login
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Interface pour la réponse de login
 */
export interface LoginResponse {
  access_token: string;
  user: {
    username: string;
    role: string;
  };
  expires_in: string;
}

/**
 * Interface pour l'utilisateur connecté
 */
export interface User {
  username: string;
  role: string;
  permissions?: string[];
}

/**
 * Interface pour la réponse API
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Service d'authentification Angular
 *
 * Gère l'authentification côté frontend avec :
 * - Login/logout
 * - Stockage du token JWT
 * - État de connexion réactif
 * - Injection automatique du token dans les requêtes
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/auth';
  private readonly TOKEN_KEY = 'hackathon_jwt_token';
  private readonly USER_KEY = 'hackathon_user_data';

  // État de connexion
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  // Observables publics
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.initializeAuthState();
  }

  /**
   * Initialise l'état d'authentification au démarrage
   */
  private initializeAuthState() {
    const token = this.getStoredToken();
    const user = this.getStoredUser();

    if (token && user) {
      // Vérifier la validité du token
      this.verifyToken().subscribe({
        next: (isValid) => {
          if (isValid) {
            this.isAuthenticatedSubject.next(true);
            this.currentUserSubject.next(user);
            console.log('✅ Session restaurée pour:', user.username);
          } else {
            this.clearAuthState();
          }
        },
        error: () => {
          this.clearAuthState();
        }
      });
    }
  }

  /**
   * Authentifie un utilisateur avec login/mot de passe
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.access_token) {
            // Stocker le token et les données utilisateur
            this.setStoredToken(response.access_token);
            this.setStoredUser(response.user);

            // Mettre à jour l'état
            this.isAuthenticatedSubject.next(true);
            this.currentUserSubject.next(response.user);

            console.log('✅ Connexion réussie:', response.user.username);
          }
        }),
        catchError(error => {
          console.error('❌ Erreur de connexion:', error);
          this.clearAuthState();
          throw error;
        })
      );
  }

  /**
   * Demande un magic link par email pour les étudiants
   */
  requestMagicLink(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/magic-link`, { email })
      .pipe(
        tap(response => {
          console.log('📧 Magic link demandé pour:', email);
        }),
        catchError(error => {
          console.error('❌ Erreur demande magic link:', error);
          throw error;
        })
      );
  }

  /**
   * Vérifie un magic link token et authentifie l'utilisateur
   */
  verifyMagicLinkToken(token: string): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.baseUrl}/verify-magic-link?token=${token}`)
      .pipe(
        tap(response => {
          if (response.access_token) {
            // Stocker le token et les données utilisateur
            this.setStoredToken(response.access_token);
            this.setStoredUser(response.user);

            // Mettre à jour l'état
            this.isAuthenticatedSubject.next(true);
            this.currentUserSubject.next(response.user);

            console.log('✅ Magic link validé:', response.user.username);
          }
        }),
        catchError(error => {
          console.error('❌ Erreur validation magic link:', error);
          this.clearAuthState();
          throw error;
        })
      );
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): Observable<any> {
    const token = this.getStoredToken();

    if (token) {
      // Appeler l'endpoint de logout backend
      return this.http.post(`${this.baseUrl}/logout`, {})
        .pipe(
          tap(() => {
            console.log('✅ Déconnexion réussie');
          }),
          catchError(error => {
            console.warn('⚠️ Erreur lors de la déconnexion backend:', error);
            return of(null);
          }),
          tap(() => {
            this.clearAuthState();
          })
        );
    } else {
      this.clearAuthState();
      return of(null);
    }
  }

  /**
   * Vérifie la validité du token actuel
   */
  verifyToken(): Observable<boolean> {
    const token = this.getStoredToken();

    if (!token) {
      return of(false);
    }

    return this.http.get<ApiResponse>(`${this.baseUrl}/verify`)
      .pipe(
        map(response => {
          const isValid = !!(response.success && response.data?.valid);
          if (isValid) {
            console.log('✅ Token valide');
          }
          return isValid;
        }),
        catchError(error => {
          console.warn('⚠️ Token invalide:', error);
          this.clearAuthState();
          return of(false);
        })
      );
  }

  /**
   * Obtient le profil utilisateur
   */
  getProfile(): Observable<User | null> {
    return this.http.get<ApiResponse<{ user: User }>>(`${this.baseUrl}/profile`)
      .pipe(
        map(response => {
          if (response.success && response.data?.user) {
            this.currentUserSubject.next(response.data.user);
            this.setStoredUser(response.data.user);
            return response.data.user;
          }
          return null;
        }),
        catchError(error => {
          console.error('❌ Erreur récupération profil:', error);
          return of(null);
        })
      );
  }

  /**
   * Obtient le token JWT stocké
   */
  getToken(): string | null {
    return this.getStoredToken();
  }

  /**
   * Obtient l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * Vérifie si l'utilisateur est admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  /**
   * Gestion du localStorage
   */
  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  private setStoredToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private getStoredUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.USER_KEY);
      try {
        return userData ? JSON.parse(userData) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private setStoredUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  private clearAuthState() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }

    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);

    console.log('🧹 État d\'authentification effacé');
  }

  /**
   * Obtient les informations de configuration auth
   */
  getAuthConfig(): Observable<any> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/config`)
      .pipe(
        tap(response => response.data),
        catchError(error => {
          console.error('❌ Erreur config auth:', error);
          return of(null);
        })
      );
  }

  /**
   * Vérifie l'état de santé du service auth
   */
  checkAuthHealth(): Observable<any> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/health`)
      .pipe(
        tap(response => response.data),
        catchError(error => {
          console.error('❌ Erreur health check auth:', error);
          return of(null);
        })
      );
  }
}
