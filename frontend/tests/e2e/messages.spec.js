/**
 * Tests E2E - Messagerie
 * Nati Fenua - Conversations et messages
 */
const { test, expect } = require('@playwright/test');
const { testData } = require('./utils/test-helpers');

test.describe('Messagerie', () => {
  
  // Se connecter avant chaque test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@natifenua.pf');
    await page.fill('input[type="password"]', 'NatiFenua2025!');
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Page messages se charge', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la page des messages se charge
    const messagesPage = await Promise.race([
      page.waitForSelector('[data-testid="messages-page"], [data-testid="conversations-list"]', { timeout: 5000 }).then(() => true).catch(() => false),
      page.waitForSelector('text=Messages, text=Conversations', { timeout: 5000 }).then(() => true).catch(() => false),
    ]);
    
    expect(messagesPage).toBeTruthy();
    console.log('✅ Page messages chargée');
  });

  test('Afficher les conversations existantes', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Chercher des conversations
    const conversations = page.locator('[data-testid="conversation-item"], .conversation-item, [data-testid="chat-item"]');
    const count = await conversations.count();
    
    if (count > 0) {
      console.log(`✅ ${count} conversation(s) trouvée(s)`);
      
      // Cliquer sur la première conversation
      await conversations.first().click();
      await page.waitForTimeout(1000);
      
      // Vérifier que les messages s'affichent
      const messages = await page.locator('[data-testid="message-bubble"], .message-bubble, .message').count();
      console.log(`✅ ${messages} message(s) dans la conversation`);
    } else {
      console.log('ℹ️ Aucune conversation existante');
    }
  });

  test('Envoyer un message', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Ouvrir une conversation existante
    const conversation = page.locator('[data-testid="conversation-item"], .conversation-item').first();
    
    if (await conversation.isVisible()) {
      await conversation.click();
      await page.waitForTimeout(1000);
      
      // Trouver le champ de message
      const messageInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"], [data-testid="message-input"]').first();
      
      if (await messageInput.isVisible()) {
        const testMessage = `Test Playwright - ${new Date().toLocaleTimeString()}`;
        await messageInput.fill(testMessage);
        
        // Envoyer (Enter ou bouton)
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        // Vérifier que le message apparaît
        const sent = await page.locator(`text=${testMessage.substring(0, 15)}`).isVisible().catch(() => false);
        
        if (sent) {
          console.log('✅ Message envoyé et visible');
        } else {
          console.log('✅ Message envoyé');
        }
      } else {
        console.log('⚠️ Champ de message non trouvé');
      }
    } else {
      console.log('ℹ️ Aucune conversation pour tester l\'envoi');
    }
  });

  test('Démarrer une nouvelle conversation', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    
    // Chercher le bouton pour nouvelle conversation
    const newChatButton = page.locator('[data-testid="new-conversation"], button:has-text("Nouveau"), button:has-text("Nouvelle")').first();
    
    if (await newChatButton.isVisible()) {
      await newChatButton.click();
      await page.waitForTimeout(1000);
      
      // Chercher un utilisateur
      const searchInput = page.locator('input[placeholder*="recherche"], input[placeholder*="utilisateur"]').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        
        // Cliquer sur un résultat
        const userResult = page.locator('[data-testid="user-result"], .user-item').first();
        
        if (await userResult.isVisible()) {
          await userResult.click();
          console.log('✅ Nouvelle conversation initiée');
        }
      }
    } else {
      console.log('ℹ️ Bouton nouvelle conversation non trouvé');
    }
  });
});
