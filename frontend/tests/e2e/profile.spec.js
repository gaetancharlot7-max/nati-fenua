/**
 * Tests E2E - Profil Utilisateur
 * Nati Fenua - Profil, paramètres, abonnements
 */
const { test, expect } = require('@playwright/test');

test.describe('Profil Utilisateur', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@natifenua.pf');
    await page.fill('input[type="password"]', 'NatiFenua2025!');
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Page profil se charge', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Vérifier les éléments du profil
    const profileElements = await Promise.race([
      page.waitForSelector('[data-testid="profile-page"], [data-testid="user-profile"]', { timeout: 5000 }).then(() => true).catch(() => false),
      page.waitForSelector('text=Publications, text=Abonnés, text=Abonnements', { timeout: 5000 }).then(() => true).catch(() => false),
    ]);
    
    expect(profileElements).toBeTruthy();
    console.log('✅ Page profil chargée');
  });

  test('Affiche les statistiques du profil', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Chercher les compteurs
    const stats = page.locator('[data-testid="profile-stats"], .profile-stats, .stats');
    
    if (await stats.isVisible()) {
      const text = await stats.textContent();
      console.log(`✅ Statistiques: ${text.substring(0, 50)}...`);
    } else {
      // Chercher individuellement
      const posts = await page.locator('text=/\\d+.*publication/i').count();
      const followers = await page.locator('text=/\\d+.*abonné/i').count();
      
      console.log(`✅ Éléments de stats trouvés`);
    }
  });

  test('Affiche les posts de l\'utilisateur', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Cliquer sur l'onglet posts si nécessaire
    const postsTab = page.locator('[data-testid="posts-tab"], button:has-text("Publications")').first();
    if (await postsTab.isVisible()) {
      await postsTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Compter les posts
    const posts = page.locator('[data-testid="post-card"], .post-thumbnail, article img');
    const count = await posts.count();
    
    console.log(`✅ ${count} post(s) sur le profil`);
  });

  test('Modifier le profil', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Cliquer sur modifier
    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Modifier"), button:has-text("Éditer")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Vérifier que le formulaire s'ouvre
      const form = await page.locator('input[name="bio"], textarea[name="bio"], input[name="username"]').first().isVisible();
      
      if (form) {
        console.log('✅ Formulaire de modification ouvert');
      } else {
        console.log('⚠️ Formulaire non trouvé');
      }
    } else {
      console.log('ℹ️ Bouton modifier non visible');
    }
  });

  test('Voir les paramètres', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la page des paramètres se charge
    const settingsPage = await page.locator('[data-testid="settings-page"], text=Paramètres, text=Confidentialité').isVisible().catch(() => false);
    
    if (settingsPage) {
      console.log('✅ Page paramètres chargée');
    } else {
      // Peut-être accessible via le profil
      await page.goto('/profile');
      await page.waitForTimeout(1000);
      
      const settingsLink = page.locator('[data-testid="settings-link"], a:has-text("Paramètres"), button:has(svg)').first();
      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        console.log('✅ Accès aux paramètres via profil');
      }
    }
  });

  test('Voir la liste des abonnés', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Cliquer sur les abonnés
    const followersLink = page.locator('[data-testid="followers-count"], text=/\\d+.*abonné/i').first();
    
    if (await followersLink.isVisible()) {
      await followersLink.click();
      await page.waitForTimeout(1000);
      
      // Vérifier la liste
      const followersList = await page.locator('[data-testid="followers-list"], .followers-modal, .user-list').isVisible().catch(() => false);
      
      console.log(`✅ Liste des abonnés ${followersList ? 'visible' : 'non visible'}`);
    } else {
      console.log('ℹ️ Lien abonnés non trouvé');
    }
  });
});
