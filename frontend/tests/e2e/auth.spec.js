/**
 * 🚀 TESTS ULTRA-RAPIDES - AUTHENTIFICATION
 * Plus rapide et plus complet qu'un testeur humain
 */
const { test, expect } = require('@playwright/test');
const { fastLogin, smartSelectors, waitForPageReady, ADMIN_ACCOUNT, generateTestEmail, generateTestUsername, TEST_PASSWORD } = require('./utils/test-helpers');

test.describe('🔐 Authentification', () => {
  
  test.describe.configure({ mode: 'parallel' }); // Tests en parallèle

  test('⚡ Page accueil charge en < 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await waitForPageReady(page);
    const loadTime = Date.now() - start;
    
    console.log(`⏱️ Temps de chargement: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('✅ Connexion admin réussie', async ({ page }) => {
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill(smartSelectors.emailInput, ADMIN_ACCOUNT.email);
    await page.fill(smartSelectors.passwordInput, ADMIN_ACCOUNT.password);
    await page.click(smartSelectors.submitButton);
    
    // Vérification rapide
    await expect(page).toHaveURL(/feed|profile|home/, { timeout: 5000 });
  });

  test('❌ Connexion échoue avec mauvais password', async ({ page }) => {
    await page.goto('/login');
    await page.fill(smartSelectors.emailInput, ADMIN_ACCOUNT.email);
    await page.fill(smartSelectors.passwordInput, 'WrongPassword123!');
    await page.click(smartSelectors.submitButton);
    
    // Doit afficher une erreur
    const error = await page.locator('text=/erreur|incorrect|invalid/i').isVisible({ timeout: 3000 });
    expect(error).toBeTruthy();
  });

  test('❌ Connexion échoue avec email invalide', async ({ page }) => {
    await page.goto('/login');
    await page.fill(smartSelectors.emailInput, 'not-an-email');
    await page.fill(smartSelectors.passwordInput, 'Password123!');
    await page.click(smartSelectors.submitButton);
    
    // Doit afficher une erreur ou ne pas soumettre
    await page.waitForTimeout(1000);
    const stillOnLogin = page.url().includes('login');
    expect(stillOnLogin).toBeTruthy();
  });

  test('📝 Inscription nouvel utilisateur', async ({ page }) => {
    const email = generateTestEmail();
    const username = generateTestUsername();
    
    await page.goto('/register');
    await waitForPageReady(page);
    
    // Remplir le formulaire
    await page.fill('input[name="username"], input[placeholder*="nom" i]', username);
    await page.fill(smartSelectors.emailInput, email);
    await page.fill(smartSelectors.passwordInput, TEST_PASSWORD);
    
    // Confirmer password si présent
    const confirmField = page.locator('input[name="confirmPassword"], input[name="password_confirm"]');
    if (await confirmField.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmField.fill(TEST_PASSWORD);
    }
    
    // Accepter les conditions
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
      await checkbox.check();
    }
    
    await page.click(smartSelectors.submitButton);
    
    // Vérifier succès
    const success = await Promise.race([
      page.waitForURL(/feed|profile|welcome/, { timeout: 8000 }).then(() => true),
      page.locator('text=/bienvenue|compte créé|succès/i').isVisible({ timeout: 8000 }),
    ]).catch(() => false);
    
    expect(success).toBeTruthy();
    console.log(`✅ Créé: ${username} (${email})`);
  });

  test('🚪 Déconnexion fonctionne', async ({ page }) => {
    // Connexion rapide
    await fastLogin(page);
    
    // Trouver et cliquer déconnexion
    await page.click('[data-testid="nav-profile"], a[href="/profile"]').catch(() => {});
    await page.click('text=/déconnexion|logout|se déconnecter/i');
    
    await waitForPageReady(page);
    
    // Vérifier déconnecté
    const loginVisible = await page.locator(smartSelectors.loginButton).isVisible({ timeout: 3000 });
    expect(loginVisible).toBeTruthy();
  });

  test('🔒 Page protégée redirige vers login', async ({ page }) => {
    // Essayer d'accéder au profil sans être connecté
    await page.goto('/profile');
    
    // Devrait rediriger vers login
    await page.waitForURL(/login|auth/, { timeout: 5000 }).catch(() => {});
    expect(page.url()).toMatch(/login|auth|\/$/);
  });

  test('💾 Session persiste après refresh', async ({ page }) => {
    await fastLogin(page);
    
    // Refresh la page
    await page.reload();
    await waitForPageReady(page);
    
    // Doit toujours être connecté
    const isLoggedIn = await page.locator('[data-testid="user-avatar"], [data-testid="nav-profile"]')
      .isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(isLoggedIn).toBeTruthy();
  });
});
