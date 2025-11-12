import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header class="app-header">
        <div class="header-content">
          <h1>🧙‍♂️ WizardConsole</h1>
          <p class="tagline">MQTT Race Hackathon Platform</p>
        </div>
      </header>

      <main class="app-main">
        <router-outlet></router-outlet>
      </main>

      <footer class="app-footer">
        <p>&copy; {{ currentYear }} LIC-SN - Hackathon MQTT Race</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .app-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
    }

    .app-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .tagline {
      margin: 0;
      opacity: 0.9;
      font-size: 1.1rem;
    }

    .app-main {
      flex: 1;
      background: #f8f9fa;
    }

    .app-footer {
      background: #2d3748;
      color: #a0aec0;
      text-align: center;
      padding: 1rem;
    }

    .app-footer p {
      margin: 0;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .app-header {
        padding: 1rem;
      }
      
      .app-header h1 {
        font-size: 1.5rem;
      }
      
      .tagline {
        font-size: 1rem;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    console.log('🚀 WizardConsole Frontend démarré');
  }
}