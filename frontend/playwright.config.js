// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration Playwright ULTRA-OPTIMISÉE pour Nati Fenua
 * Plus rapide qu'un testeur humain
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  
  // ⚡ PARALLÉLISATION MAXIMALE
  fullyParallel: true,
  workers: process.env.CI ? 4 : 6, // 6 tests en parallèle en local
  
  // ⏱️ Timeouts optimisés
  timeout: 30 * 1000, // 30 sec max par test
  expect: {
    timeout: 5000, // 5 sec pour les assertions
  },
  
  // 🔄 Retry intelligent
  retries: process.env.CI ? 2 : 0,
  
  // 📊 Reporters multiples
  reporter: [
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
    // Rapport GitHub Actions
    ...(process.env.CI ? [['github']] : []),
  ],
  
  // ⚡ Configuration globale optimisée
  use: {
    baseURL: process.env.TEST_URL || 'https://nati-fenua-frontend.onrender.com',
    
    // 📸 Captures intelligentes
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // 🖥️ Viewport standard
    viewport: { width: 1280, height: 720 },
    
    // ⚡ OPTIMISATIONS DE VITESSE
    actionTimeout: 10000, // Actions rapides
    navigationTimeout: 15000, // Navigation rapide
    
    // 🚀 Ignorer les ressources non essentielles
    bypassCSP: true,
    ignoreHTTPSErrors: true,
    
    // 📱 User agent réaliste
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Playwright-NatiFenua-Bot',
  },

  // 📱 Tests multi-appareils en parallèle
  projects: [
    {
      name: 'Desktop-Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']
        }
      },
    },
    {
      name: 'Mobile-iOS',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Mobile-Android',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro 11'] },
    },
  ],

  // 🌐 Serveur de dev local (optionnel)
  webServer: process.env.LOCAL_TEST ? {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  } : undefined,
});
