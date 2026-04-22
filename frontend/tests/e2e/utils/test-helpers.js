/**
 * HELPERS ULTRA-OPTIMISÉS pour tests Nati Fenua
 * Plus rapide et plus complet qu'un testeur humain
 */

// ⚡ Cache pour éviter les re-calculs
const cache = new Map();

// Génère un email unique
function generateTestEmail() {
  return `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.nf`;
}

// Génère un nom d'utilisateur unique
function generateTestUsername() {
  return `Bot_${Date.now().toString(36)}`;
}

// Mot de passe sécurisé
const TEST_PASSWORD = 'BotTest2025!Secure';

// Compte admin pour tests rapides
const ADMIN_ACCOUNT = {
  email: 'admin@natifenua.pf',
  password: 'NatiFenua2025!'
};

/**
 * 🚀 LOGIN RAPIDE - Réutilise la session
 */
async function fastLogin(page, account = ADMIN_ACCOUNT) {
  // Vérifier si déjà connecté
  const isLoggedIn = await page.locator('[data-testid="user-avatar"], [data-testid="nav-profile"]')
    .isVisible({ timeout: 2000 }).catch(() => false);
  
  if (isLoggedIn) return true;
  
  await page.goto('/login');
  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.password);
  await page.click('button[type="submit"]');
  
  // Attendre connexion (max 5 sec)
  await page.waitForURL(/feed|profile|home/, { timeout: 5000 }).catch(() => {});
  return true;
}

/**
 * 🎯 SÉLECTEURS INTELLIGENTS - Trouve automatiquement les éléments
 */
const smartSelectors = {
  // Trouve le bouton login peu importe le texte
  loginButton: 'button:has-text("Connexion"), button:has-text("Se connecter"), button:has-text("Login"), [data-testid="login-btn"]',
  
  // Trouve le champ email
  emailInput: 'input[type="email"], input[name="email"], input[placeholder*="email" i]',
  
  // Trouve le champ password
  passwordInput: 'input[type="password"], input[name="password"]',
  
  // Bouton submit
  submitButton: 'button[type="submit"], button:has-text("Valider"), button:has-text("Envoyer")',
  
  // Posts
  postCard: '[data-testid="post-card"], article, .post-card, .post-item',
  likeButton: '[data-testid="like-button"], button[aria-label*="like" i], button:has(svg[class*="heart"])',
  commentButton: '[data-testid="comment-button"], button[aria-label*="comment" i]',
  shareButton: '[data-testid="share-button"], button[aria-label*="share" i]',
  
  // Navigation
  navHome: '[data-testid="nav-home"], a[href="/"], a[href="/feed"]',
  navProfile: '[data-testid="nav-profile"], a[href="/profile"]',
  navMessages: '[data-testid="nav-messages"], a[href="/messages"]',
  navMap: '[data-testid="nav-map"], a[href="/map"]',
  
  // Messages
  conversationItem: '[data-testid="conversation-item"], .conversation-item, .chat-item',
  messageInput: 'input[placeholder*="message" i], textarea[placeholder*="message" i]',
  
  // Toasts et alertes
  successToast: '[data-testid="toast-success"], .toast-success, [role="alert"]:has-text("succès")',
  errorToast: '[data-testid="toast-error"], .toast-error, [role="alert"]:has-text("erreur")',
  
  // Loader
  loader: '[data-testid="loader"], .loader, .loading, .spinner',
};

/**
 * ⏳ ATTENTE INTELLIGENTE - Attend que la page soit prête
 */
async function waitForPageReady(page, options = {}) {
  const { timeout = 10000, waitForNetwork = true } = options;
  
  // Attendre que le DOM soit stable
  await page.waitForLoadState('domcontentloaded', { timeout });
  
  // Attendre les requêtes réseau si demandé
  if (waitForNetwork) {
    await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  }
  
  // Attendre que les loaders disparaissent
  await page.locator(smartSelectors.loader).waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
}

/**
 * 📊 COLLECTEUR DE MÉTRIQUES - Mesure les performances
 */
class PerformanceCollector {
  constructor() {
    this.metrics = [];
  }
  
  async measureAction(page, actionName, actionFn) {
    const start = Date.now();
    await actionFn();
    const duration = Date.now() - start;
    
    this.metrics.push({ action: actionName, duration, timestamp: new Date().toISOString() });
    
    return duration;
  }
  
  getReport() {
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const avg = total / this.metrics.length || 0;
    
    return {
      totalTests: this.metrics.length,
      totalTime: total,
      averageTime: Math.round(avg),
      slowestAction: this.metrics.sort((a, b) => b.duration - a.duration)[0],
      fastestAction: this.metrics.sort((a, b) => a.duration - b.duration)[0],
    };
  }
}

/**
 * 🔍 VÉRIFICATEUR AUTOMATIQUE - Vérifie plusieurs conditions en parallèle
 */
async function verifyAny(page, conditions, timeout = 5000) {
  const promises = conditions.map(condition => 
    page.waitForSelector(condition, { timeout }).then(() => condition).catch(() => null)
  );
  
  const results = await Promise.race([
    Promise.any(promises),
    new Promise(resolve => setTimeout(() => resolve(null), timeout))
  ]);
  
  return results;
}

/**
 * 📸 SCREENSHOT INTELLIGENT - Capture avec contexte
 */
async function smartScreenshot(page, name, options = {}) {
  const { fullPage = false, highlight = null } = options;
  
  // Highlight un élément si demandé
  if (highlight) {
    await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      if (el) {
        el.style.outline = '3px solid red';
        el.style.outlineOffset = '2px';
      }
    }, highlight);
  }
  
  const screenshot = await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage,
  });
  
  return screenshot;
}

/**
 * 🧹 NETTOYAGE - Supprime les données de test
 */
async function cleanupTestData(page) {
  // Supprimer les posts de test créés
  // (À implémenter selon votre API)
}

module.exports = {
  generateTestEmail,
  generateTestUsername,
  TEST_PASSWORD,
  ADMIN_ACCOUNT,
  fastLogin,
  smartSelectors,
  waitForPageReady,
  PerformanceCollector,
  verifyAny,
  smartScreenshot,
  cleanupTestData,
};
