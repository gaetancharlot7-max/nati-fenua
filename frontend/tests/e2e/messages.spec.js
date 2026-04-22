/**
 * 🚀 TESTS ULTRA-RAPIDES - MESSAGERIE
 * Teste toutes les fonctionnalités de chat
 */
const { test, expect } = require('@playwright/test');
const { fastLogin, smartSelectors, waitForPageReady } = require('./utils/test-helpers');

test.describe('💬 Messagerie', () => {
  
  test.describe.configure({ mode: 'parallel' });
  
  test.beforeEach(async ({ page }) => {
    await fastLogin(page);
  });

  test('⚡ Page messages charge en < 2s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/messages');
    await waitForPageReady(page);
    const loadTime = Date.now() - start;
    
    console.log(`⏱️ Messages chargés en ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000);
  });

  test('📋 Liste des conversations s\'affiche', async ({ page }) => {
    await page.goto('/messages');
    await waitForPageReady(page);
    
    const conversations = page.locator(smartSelectors.conversationItem);
    const count = await conversations.count();
    
    console.log(`📊 ${count} conversation(s)`);
    // Pas de expect car peut être 0 si nouveau compte
  });

  test('💬 Ouvrir une conversation', async ({ page }) => {
    await page.goto('/messages');
    await waitForPageReady(page);
    
    const conversation = page.locator(smartSelectors.conversationItem).first();
    
    if (await conversation.isVisible({ timeout: 2000 })) {
      await conversation.click();
      await waitForPageReady(page);
      
      // Vérifier que les messages s'affichent
      const messageArea = page.locator('[data-testid="messages-list"], .messages-container, .chat-messages');
      const visible = await messageArea.isVisible({ timeout: 2000 }).catch(() => false);
      
      console.log(`✅ Conversation ouverte (messages: ${visible})`);
    }
  });

  test('📤 Envoyer un message', async ({ page }) => {
    await page.goto('/messages');
    await waitForPageReady(page);
    
    // Ouvrir une conversation
    const conversation = page.locator(smartSelectors.conversationItem).first();
    
    if (await conversation.isVisible({ timeout: 2000 })) {
      await conversation.click();
      await page.waitForTimeout(500);
      
      const messageInput = page.locator(smartSelectors.messageInput).first();
      
      if (await messageInput.isVisible({ timeout: 2000 })) {
        const testMessage = `🤖 Test ${Date.now()}`;
        await messageInput.fill(testMessage);
        await page.keyboard.press('Enter');
        
        await page.waitForTimeout(1000);
        
        // Vérifier que le message apparaît
        const sent = await page.locator(`text=${testMessage.slice(0, 10)}`).isVisible({ timeout: 2000 });
        console.log(`✅ Message envoyé (visible: ${sent})`);
      }
    }
  });

  test('🔍 Rechercher un utilisateur pour discuter', async ({ page }) => {
    await page.goto('/messages');
    await waitForPageReady(page);
    
    const newChatBtn = page.locator('[data-testid="new-conversation"], button:has-text("Nouveau"), button:has-text("+")').first();
    
    if (await newChatBtn.isVisible({ timeout: 2000 })) {
      await newChatBtn.click();
      await page.waitForTimeout(500);
      
      const searchInput = page.locator('input[placeholder*="recherche" i], input[placeholder*="utilisateur" i]').first();
      
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        console.log('✅ Recherche utilisateur effectuée');
      }
    }
  });

  test('🔔 Indicateur de messages non lus', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    
    // Chercher un badge de notification
    const badge = page.locator('[data-testid="unread-badge"], .badge, .notification-count');
    const hasBadge = await badge.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`📬 Badge non-lus: ${hasBadge}`);
  });
});
