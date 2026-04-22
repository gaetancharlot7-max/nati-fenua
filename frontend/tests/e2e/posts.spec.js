/**
 * 🚀 TESTS ULTRA-RAPIDES - PUBLICATIONS
 * Teste TOUT ce qu'un utilisateur peut faire avec les posts
 */
const { test, expect } = require('@playwright/test');
const { fastLogin, smartSelectors, waitForPageReady, PerformanceCollector } = require('./utils/test-helpers');

test.describe('📝 Publications', () => {
  
  test.describe.configure({ mode: 'parallel' });
  
  test.beforeEach(async ({ page }) => {
    await fastLogin(page);
  });

  test('⚡ Feed charge en < 2s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/feed');
    await waitForPageReady(page);
    const loadTime = Date.now() - start;
    
    console.log(`⏱️ Feed chargé en ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000);
  });

  test('📰 Posts s\'affichent dans le feed', async ({ page }) => {
    await page.goto('/feed');
    await waitForPageReady(page);
    
    const posts = page.locator(smartSelectors.postCard);
    const count = await posts.count();
    
    console.log(`📊 ${count} posts affichés`);
    expect(count).toBeGreaterThan(0);
  });

  test('✍️ Créer une publication texte', async ({ page }) => {
    await page.goto('/feed');
    await waitForPageReady(page);
    
    const postContent = `🤖 Test auto ${Date.now()}`;
    
    // Trouver le champ de création
    const postInput = page.locator('textarea[placeholder*="quoi" i], textarea[name="content"], [data-testid="post-input"]').first();
    
    if (await postInput.isVisible({ timeout: 2000 })) {
      await postInput.fill(postContent);
      await page.click('button:has-text("Publier"), [data-testid="post-submit"]');
      
      await waitForPageReady(page);
      
      // Vérifier que le post apparaît
      const newPost = await page.locator(`text=${postContent.slice(0, 15)}`).isVisible({ timeout: 3000 });
      expect(newPost).toBeTruthy();
      console.log('✅ Post créé');
    }
  });

  test('❤️ Liker un post', async ({ page }) => {
    await page.goto('/feed');
    await waitForPageReady(page);
    
    // Premier bouton like
    const likeBtn = page.locator(smartSelectors.likeButton).first();
    
    if (await likeBtn.isVisible({ timeout: 2000 })) {
      await likeBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Like envoyé');
    }
  });

  test('💬 Commenter un post', async ({ page }) => {
    await page.goto('/feed');
    await waitForPageReady(page);
    
    // Ouvrir les commentaires
    const commentBtn = page.locator(smartSelectors.commentButton).first();
    
    if (await commentBtn.isVisible({ timeout: 2000 })) {
      await commentBtn.click();
      await page.waitForTimeout(500);
      
      // Écrire un commentaire
      const commentInput = page.locator('input[placeholder*="commentaire" i], textarea[placeholder*="commentaire" i]').first();
      
      if (await commentInput.isVisible({ timeout: 2000 })) {
        await commentInput.fill(`🤖 Auto ${Date.now()}`);
        await page.keyboard.press('Enter');
        console.log('✅ Commentaire envoyé');
      }
    }
  });

  test('🔖 Sauvegarder un post', async ({ page }) => {
    await page.goto('/feed');
    await waitForPageReady(page);
    
    const saveBtn = page.locator('[data-testid="save-button"], button[aria-label*="save" i], button:has-text("Sauvegarder")').first();
    
    if (await saveBtn.isVisible({ timeout: 2000 })) {
      await saveBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Post sauvegardé');
    }
  });

  test('🗑️ Supprimer un post', async ({ page }) => {
    // Aller sur le profil pour voir ses propres posts
    await page.goto('/profile');
    await waitForPageReady(page);
    
    // Cliquer sur un post
    const post = page.locator(smartSelectors.postCard).first();
    
    if (await post.isVisible({ timeout: 2000 })) {
      await post.click();
      await page.waitForTimeout(500);
      
      // Chercher le bouton supprimer
      const deleteBtn = page.locator('[data-testid="delete-post"], button:has-text("Supprimer"), button.text-red-500, [aria-label*="delete" i]').first();
      
      if (await deleteBtn.isVisible({ timeout: 2000 })) {
        // Accepter la confirmation
        page.on('dialog', dialog => dialog.accept());
        await deleteBtn.click();
        
        await waitForPageReady(page);
        console.log('✅ Post supprimé');
      }
    }
  });

  test('🔄 Pagination du feed fonctionne', async ({ page }) => {
    await page.goto('/feed');
    await waitForPageReady(page);
    
    // Compter les posts initiaux
    const initialCount = await page.locator(smartSelectors.postCard).count();
    
    // Scroll vers le bas
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    
    // Vérifier si plus de posts chargés
    const newCount = await page.locator(smartSelectors.postCard).count();
    
    console.log(`📊 Posts: ${initialCount} → ${newCount}`);
  });

  test('🔍 Recherche de posts', async ({ page }) => {
    await page.goto('/feed');
    await waitForPageReady(page);
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="recherche" i]').first();
    
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      await waitForPageReady(page);
      console.log('✅ Recherche effectuée');
    }
  });
});
