/**
 * Helpers pour les tests Nati Fenua
 */

// Génère un email unique pour les tests
function generateTestEmail() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test_${timestamp}_${random}@natifenua-test.com`;
}

// Génère un nom d'utilisateur unique
function generateTestUsername() {
  const timestamp = Date.now();
  return `TestUser_${timestamp}`;
}

// Mot de passe de test sécurisé
const TEST_PASSWORD = 'TestNatiFenua2025!';

// Données de test
const testData = {
  generateEmail: generateTestEmail,
  generateUsername: generateTestUsername,
  password: TEST_PASSWORD,
  
  // Compte de test permanent (pour tests rapides)
  permanentTestAccount: {
    email: 'playwright_test@natifenua.pf',
    password: 'PlaywrightTest2025!',
    username: 'PlaywrightBot'
  }
};

// Sélecteurs communs
const selectors = {
  // Navigation
  navHome: '[data-testid="nav-home"]',
  navProfile: '[data-testid="nav-profile"]',
  navMessages: '[data-testid="nav-messages"]',
  navMap: '[data-testid="nav-map"]',
  
  // Auth
  loginButton: '[data-testid="login-button"]',
  registerButton: '[data-testid="register-button"]',
  emailInput: 'input[type="email"], input[name="email"]',
  passwordInput: 'input[type="password"], input[name="password"]',
  usernameInput: 'input[name="username"]',
  submitButton: 'button[type="submit"]',
  
  // Posts
  createPostButton: '[data-testid="create-post-button"]',
  postContent: 'textarea[name="content"], textarea[placeholder*="quoi de neuf"]',
  postSubmit: '[data-testid="post-submit"]',
  postCard: '[data-testid="post-card"]',
  deletePostButton: '[data-testid="delete-post"]',
  
  // Messages
  conversationItem: '[data-testid="conversation-item"]',
  messageInput: 'input[name="message"], textarea[name="message"]',
  sendMessageButton: '[data-testid="send-message"]',
  
  // Common
  toast: '[data-testid="toast"], .toast, [role="alert"]',
  loader: '[data-testid="loader"], .loader, .loading',
  modal: '[data-testid="modal"], [role="dialog"]',
};

module.exports = {
  testData,
  selectors,
  generateTestEmail,
  generateTestUsername,
  TEST_PASSWORD
};
