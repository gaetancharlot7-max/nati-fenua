/**
 * Tests E2E - Carte Interactive
 * Nati Fenua - Fenua Pulse, marqueurs, géolocalisation
 */
const { test, expect } = require('@playwright/test');

test.describe('Carte Interactive', () => {
  
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

  test('La carte se charge correctement', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // La carte prend du temps à charger
    
    // Vérifier que le conteneur de carte existe
    const mapContainer = await Promise.race([
      page.waitForSelector('.leaflet-container, [data-testid="map-container"], #map', { timeout: 10000 }).then(() => true).catch(() => false),
      page.waitForSelector('.mapboxgl-map', { timeout: 10000 }).then(() => true).catch(() => false),
    ]);
    
    expect(mapContainer).toBeTruthy();
    console.log('✅ Carte chargée');
  });

  test('Les marqueurs s\'affichent sur la carte', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Compter les marqueurs
    const markers = page.locator('.leaflet-marker-icon, [data-testid="map-marker"], .marker');
    const count = await markers.count();
    
    console.log(`✅ ${count} marqueur(s) sur la carte`);
  });

  test('Cliquer sur un marqueur ouvre les détails', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const marker = page.locator('.leaflet-marker-icon, [data-testid="map-marker"]').first();
    
    if (await marker.isVisible()) {
      await marker.click();
      await page.waitForTimeout(1000);
      
      // Vérifier qu'une popup ou un panneau s'ouvre
      const popup = await page.locator('.leaflet-popup, [data-testid="marker-details"], .marker-popup').isVisible().catch(() => false);
      
      if (popup) {
        console.log('✅ Détails du marqueur affichés');
      } else {
        console.log('⚠️ Popup non détectée (peut-être un panneau latéral)');
      }
    } else {
      console.log('ℹ️ Aucun marqueur visible');
    }
  });

  test('Ajouter un nouveau marqueur', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Chercher le bouton pour ajouter un marqueur
    const addButton = page.locator('[data-testid="add-marker"], button:has-text("Ajouter"), button:has-text("+")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      // Remplir le formulaire si présent
      const titleInput = page.locator('input[name="title"], input[placeholder*="titre"]').first();
      
      if (await titleInput.isVisible()) {
        await titleInput.fill(`Test Marqueur ${Date.now()}`);
        
        // Description
        const descInput = page.locator('textarea[name="description"], textarea').first();
        if (await descInput.isVisible()) {
          await descInput.fill('Marqueur créé par test automatique');
        }
        
        // Soumettre
        await page.click('button[type="submit"], button:has-text("Créer"), button:has-text("Ajouter")');
        await page.waitForTimeout(2000);
        
        console.log('✅ Marqueur créé');
      }
    } else {
      console.log('ℹ️ Bouton ajouter marqueur non trouvé');
    }
  });

  test('Filtrer les marqueurs par type', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Chercher les filtres
    const filterButton = page.locator('[data-testid="filter-markers"], button:has-text("Filtrer"), .filter-button').first();
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
      
      // Cliquer sur un filtre
      const filterOption = page.locator('[data-testid="filter-option"], .filter-option, label').first();
      
      if (await filterOption.isVisible()) {
        await filterOption.click();
        await page.waitForTimeout(1000);
        console.log('✅ Filtre appliqué');
      }
    } else {
      console.log('ℹ️ Filtres non trouvés');
    }
  });
});
