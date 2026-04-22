// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  fullyParallel: true,
  workers: 2,
  retries: 0,
  
  // Reporter CORRIGÉ - pas de conflit de dossiers
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  
  // Output folder séparé
  outputDir: 'test-output',
  
  use: {
    baseURL: 'https://nati-fenua-frontend.onrender.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'Desktop-Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
