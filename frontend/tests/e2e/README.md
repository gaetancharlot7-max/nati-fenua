# Tests E2E Nati Fenua - Playwright

## Installation

```bash
cd frontend
npm install @playwright/test
npx playwright install
```

## Exécuter les tests

### Tous les tests
```bash
npx playwright test
```

### Un fichier spécifique
```bash
npx playwright test tests/e2e/auth.spec.js
```

### Mode interactif (voir le navigateur)
```bash
npx playwright test --headed
```

### Mode debug
```bash
npx playwright test --debug
```

### Rapport HTML
```bash
npx playwright show-report
```

## Structure des tests

```
tests/e2e/
├── utils/
│   └── test-helpers.js    # Helpers et données de test
├── auth.spec.js           # Inscription, Connexion, Déconnexion
├── posts.spec.js          # Publications, Likes, Commentaires
├── messages.spec.js       # Messagerie
├── map.spec.js            # Carte interactive
└── profile.spec.js        # Profil utilisateur
```

## Variables d'environnement

- `TEST_URL` : URL de l'application à tester (défaut: https://nati-fenua-frontend.onrender.com)

```bash
TEST_URL=http://localhost:3000 npx playwright test
```

## GitHub Actions

Les tests peuvent être exécutés automatiquement à chaque push.
Voir `.github/workflows/playwright.yml` pour la configuration.

## Résultats

Les résultats sont sauvegardés dans :
- `test-results/` - Screenshots et vidéos
- `test-results/html-report/` - Rapport HTML interactif
