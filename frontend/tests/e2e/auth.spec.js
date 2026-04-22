/**
 * Tests E2E - Authentification
 * Nati Fenua - Inscription, Connexion, Déconnexion
 */
const { test, expect } = require('@playwright/test');
const { testData, selectors } = require('./utils/test-helpers');

test.describe('Authentification', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Page d\'accueil se charge correctement', async ({ page }) => {
    // Vérifie que la page se charge
    await expect(page).toHaveTitle(/Nati Fenua/i);
    
    // Vérifie la présence du bouton de connexion ou du feed
    const loginVisible = await page.locator('text=Connexion, text=Se connecter').first().isVisible().catch(() => false);
    const feedVisible = await page.locator('[data-testid="feed"], [data-testid="post-card"]').first().isVisible().catch(() => false);
    
    expect(loginVisible || feedVisible).toBeTruthy();
  });

  test('Inscription d\'un nouvel utilisateur', async ({ page }) => {
    // Générer des données uniques
    const email = testData.generateEmail();
    const username = testData.generateUsername();
    
    // Cliquer sur inscription
    await page.click('text=Inscription, text=S\'inscrire, text=Créer un compte').catch(async () => {
      // Peut-être déjà sur la page d'inscription
      await page.goto('/register');
    });
    
    await page.waitForLoadState('networkidle');
    
    // Remplir le formulaire
    await page.fill('input[name="username"], input[placeholder*="nom"]', username);
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"]', testData.password);
    
    // Confirmer le mot de passe si le champ existe
    const confirmPassword = page.locator('input[name="confirmPassword"], input[name="password_confirm"]');
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(testData.password);
    }
    
    // Accepter les conditions si présentes
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }
    
    // Soumettre
    await page.click('button[type="submit"]');
    
    // Attendre la réponse
    await page.waitForLoadState('networkidle');
    
    // Vérifier le succès (redirection ou message)
    const success = await Promise.race([
      page.waitForURL('**/feed**', { timeout: 10000 }).then(() => true).catch(() => false),
      page.waitForURL('**/profile**', { timeout: 10000 }).then(() => true).catch(() => false),
      page.waitForSelector('text=Bienvenue, text=Compte créé', { timeout: 10000 }).then(() => true).catch(() => false),
    ]);
    
    expect(success).toBeTruthy();
    
    console.log(`✅ Utilisateur créé: ${username} (${email})`);
  });

  test('Connexion avec compte existant', async ({ page }) => {
    // Aller sur la page de connexion
    await page.click('text=Connexion, text=Se connecter').catch(async () => {
      await page.goto('/login');
    });
    
    await page.waitForLoadState('networkidle');
    
    // Utiliser le compte admin de test
    await page.fill('input[type="email"], input[name="email"]', 'admin@natifenua.pf');
    await page.fill('input[type="password"]', 'NatiFenua2025!');
    
    // Soumettre
    await page.click('button[type="submit"]');
    
    // Attendre la connexion
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'on est connecté (présence du profil ou feed)
    const loggedIn = await Promise.race([
      page.waitForURL('**/feed**', { timeout: 10000 }).then(() => true).catch(() => false),
      page.waitForSelector('[data-testid="user-avatar"], [data-testid="nav-profile"]', { timeout: 10000 }).then(() => true).catch(() => false),
    ]);
    
    expect(loggedIn).toBeTruthy();
    console.log('✅ Connexion réussie');
  });

  test('Connexion échoue avec mauvais mot de passe', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@natifenua.pf');
    await page.fill('input[type="password"]', 'MauvaisMotDePasse123!');
    
    await page.click('button[type="submit"]');
    
    // Attendre un message d'erreur
    const errorMessage = await page.waitForSelector('text=Erreur, text=incorrect, text=invalide, [role="alert"]', { timeout: 5000 }).catch(() => null);
    
    expect(errorMessage).not.toBeNull();
    console.log('✅ Erreur de connexion détectée correctement');
  });

  test('Déconnexion fonctionne', async ({ page }) => {
    // D'abord se connecter
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@natifenua.pf');
    await page.fill('input[type="password"]', 'NatiFenua2025!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Trouver et cliquer sur déconnexion
    await page.click('[data-testid="nav-profile"], text=Profil').catch(() => {});
    await page.click('[data-testid="logout-button"], text=Déconnexion, text=Se déconnecter');
    
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'on est déconnecté
    const loginButton = await page.waitForSelector('text=Connexion, text=Se connecter', { timeout: 5000 }).catch(() => null);
    
    expect(loginButton).not.toBeNull();
    console.log('✅ Déconnexion réussie');
  });
});
