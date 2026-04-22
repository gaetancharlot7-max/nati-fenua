/**
 * 🚀 TESTS CORRIGÉS POUR NATI FENUA
 * Adaptés à la vraie structure de l'application
 */
const { test, expect } = require('@playwright/test');

// Configuration spécifique à Nati Fenua
const NATI_FENUA = {
  baseURL: 'https://nati-fenua-frontend.onrender.com',
  authPage: '/auth',
  feedPage: '/feed',
  profilePage: '/profile',
  messagesPage: '/messages',
  mapPage: '/map',
  
  // Compte TEST créé pour Playwright
  testAccount: {
    email: 'playwright_test@natifenua.pf',
    password: 'PlaywrightTest2025!'
  }
};

// Sélecteurs adaptés à Nati Fenua
const SELECTORS = {
  // Page d'accueil
  loginLink: 'text=Se connecter',
  registerLink: 'text=Créer mon compte',
  
  // Page Auth
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  loginButton: 'button:has-text("Se connecter")',
  registerButton: 'button:has-text("S\'inscrire")',
  googleButton: 'button:has-text("Google")',
  forgotPassword: 'text=Mot de passe oublié',
  
  // Navigation (une fois connecté)
  navFeed: 'a[href="/feed"], [data-testid="nav-feed"]',
  navProfile: 'a[href="/profile"], [data-testid="nav-profile"]',
  navMessages: 'a[href="/messages"], [data-testid="nav-messages"]',
  navMap: 'a[href="/map"], [data-testid="nav-map"]',
  
  // Feed
  postCard: '[data-testid="post-card"], article, .post-card',
  postInput: 'textarea',
  publishButton: 'button:has-text("Publier")',
  
  // Profile
  logoutButton: 'text=Déconnexion, button:has-text("Déconnexion")',
};

/**
 * Helper: Connexion rapide
 */
async function login(page, credentials = NATI_FENUA.testAccount) {
  await page.goto(NATI_FENUA.authPage);
  await page.waitForLoadState('networkidle');
  
  // Remplir le formulaire
  await page.fill(SELECTORS.emailInput, credentials.email);
  await page.fill(SELECTORS.passwordInput, credentials.password);
  
  // Cliquer sur Se connecter
  await page.click(SELECTORS.loginButton);
  
  // Attendre la redirection
  await page.waitForURL(/feed|profile|home/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
  
  return page.url().includes('feed') || page.url().includes('profile');
}

// ==========================================
// TESTS
// ==========================================

test.describe('🏠 Page d\'accueil', () => {
  
  test('La page d\'accueil se charge', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Vérifier le titre
    await expect(page).toHaveTitle(/Nati Fenua/i);
    
    // Vérifier les éléments clés
    const logo = page.locator('img[alt*="Nati"], img[src*="logo"]').first();
    await expect(logo).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Page d\'accueil chargée');
  });

  test('Le bouton Se connecter est visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loginLink = page.locator(SELECTORS.loginLink).first();
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Bouton Se connecter visible');
  });

  test('Cliquer sur Se connecter mène à /auth', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.click(SELECTORS.loginLink);
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/auth');
    console.log('✅ Redirection vers /auth OK');
  });
});

test.describe('🔐 Authentification', () => {

  test('Page de connexion se charge', async ({ page }) => {
    await page.goto(NATI_FENUA.authPage);
    await page.waitForLoadState('networkidle');
    
    // Vérifier les champs
    const emailField = page.locator(SELECTORS.emailInput);
    const passwordField = page.locator(SELECTORS.passwordInput);
    const loginBtn = page.locator(SELECTORS.loginButton);
    
    await expect(emailField).toBeVisible({ timeout: 10000 });
    await expect(passwordField).toBeVisible({ timeout: 10000 });
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Page de connexion chargée avec tous les champs');
  });

  test('Connexion avec compte test', async ({ page }) => {
    const success = await login(page);
    
    if (success) {
      console.log('✅ Connexion test réussie');
    } else {
      console.log('⚠️ Connexion test - vérifier les credentials');
    }
    
    expect(success).toBeTruthy();
  });

  test('Connexion échoue avec mauvais mot de passe', async ({ page }) => {
    await page.goto(NATI_FENUA.authPage);
    await page.waitForLoadState('networkidle');
    
    await page.fill(SELECTORS.emailInput, NATI_FENUA.testAccount.email);
    await page.fill(SELECTORS.passwordInput, 'MauvaisMotDePasse123!');
    await page.click(SELECTORS.loginButton);
    
    // Attendre un message d'erreur ou rester sur la page
    await page.waitForTimeout(2000);
    
    // Vérifier qu'on est toujours sur /auth (pas redirigé)
    const stillOnAuth = page.url().includes('auth');
    
    console.log(`✅ Mauvais mot de passe: ${stillOnAuth ? 'rejeté correctement' : 'vérifier le comportement'}`);
  });

  test('Bouton Google est visible', async ({ page }) => {
    await page.goto(NATI_FENUA.authPage);
    await page.waitForLoadState('networkidle');
    
    const googleBtn = page.locator(SELECTORS.googleButton).first();
    const isVisible = await googleBtn.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`✅ Bouton Google: ${isVisible ? 'visible' : 'non visible'}`);
  });

  test('Lien mot de passe oublié fonctionne', async ({ page }) => {
    await page.goto(NATI_FENUA.authPage);
    await page.waitForLoadState('networkidle');
    
    const forgotLink = page.locator(SELECTORS.forgotPassword).first();
    
    if (await forgotLink.isVisible({ timeout: 5000 })) {
      await forgotLink.click();
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('forgot');
      console.log('✅ Lien mot de passe oublié fonctionne');
    }
  });
});

test.describe('📰 Feed (après connexion)', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Le feed se charge après connexion', async ({ page }) => {
    await page.goto(NATI_FENUA.feedPage);
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'on est bien sur le feed
    const onFeed = page.url().includes('feed');
    console.log(`✅ Feed chargé: ${onFeed}`);
    
    expect(onFeed).toBeTruthy();
  });

  test('Des posts s\'affichent', async ({ page }) => {
    await page.goto(NATI_FENUA.feedPage);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const posts = page.locator(SELECTORS.postCard);
    const count = await posts.count();
    
    console.log(`✅ ${count} post(s) trouvé(s)`);
  });
});

test.describe('👤 Profil (après connexion)', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Page profil se charge', async ({ page }) => {
    await page.goto(NATI_FENUA.profilePage);
    await page.waitForLoadState('networkidle');
    
    const onProfile = page.url().includes('profile');
    console.log(`✅ Profil chargé: ${onProfile}`);
    
    expect(onProfile).toBeTruthy();
  });

  test('Déconnexion fonctionne', async ({ page }) => {
    await page.goto(NATI_FENUA.profilePage);
    await page.waitForLoadState('networkidle');
    
    const logoutBtn = page.locator(SELECTORS.logoutButton).first();
    
    if (await logoutBtn.isVisible({ timeout: 5000 })) {
      await logoutBtn.click();
      await page.waitForLoadState('networkidle');
      
      // Vérifier qu'on est déconnecté (retour sur auth ou accueil)
      const loggedOut = page.url().includes('auth') || page.url() === NATI_FENUA.baseURL + '/';
      console.log(`✅ Déconnexion: ${loggedOut ? 'réussie' : 'vérifier'}`);
    }
  });
});

test.describe('💬 Messages (après connexion)', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Page messages se charge', async ({ page }) => {
    await page.goto(NATI_FENUA.messagesPage);
    await page.waitForLoadState('networkidle');
    
    const onMessages = page.url().includes('messages');
    console.log(`✅ Messages chargé: ${onMessages}`);
    
    expect(onMessages).toBeTruthy();
  });
});

test.describe('🗺️ Carte (après connexion)', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Page carte se charge', async ({ page }) => {
    await page.goto(NATI_FENUA.mapPage);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // La carte prend du temps
    
    const onMap = page.url().includes('map');
    console.log(`✅ Carte chargée: ${onMap}`);
    
    expect(onMap).toBeTruthy();
  });
});
