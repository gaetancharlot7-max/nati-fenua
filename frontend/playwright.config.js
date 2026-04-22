// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration Playwright pour Nati Fenua
 * Tests End-to-End automatisés
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  
  // Timeout par test
  timeout: 60 * 1000,
  
  // Nombre de retries en cas d'échec
  retries: 1,
  
  // Reporter pour les résultats
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['list']
  ],
  
  // Configuration globale
  use: {
    // URL de base de l'application
    baseURL: process.env.TEST_URL || 'https://nati-fenua-frontend.onrender.com',
    
    // Screenshots en cas d'échec
    screenshot: 'only-on-failure',
    
    // Vidéo en cas d'échec
    video: 'retain-on-failure',
    
    // Traces pour debug
    trace: 'retain-on-failure',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  // Projets de test (différents navigateurs)
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
