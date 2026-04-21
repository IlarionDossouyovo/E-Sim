# 🚀 E-Sim By ELECTRON

Plateforme eSIM pour la connectivité mondiale - Achetez des forfaits eSIM pour 150+ pays.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Actif-green)

## 📋 Description

E-Sim By ELECTRON est une plateforme e-commerce complète pour la vente de forfaits eSIM internationaux. Le projet inclut un site web frontend moderne ainsi qu'une API backend.

## 🌟 Fonctionnalités

### Frontend
- 🛒 Panier d'achat
- 🔐 Authentification utilisateur
- 💬 Chat en direct
- 📦 Suivi de commande
- 🗺️ Carte de couverture mondiale
- 📱 Vérificateur de compatibilité
- 🧮 Calculateur de prix
- ❓ FAQ interactive
- ⭐ Avis clients
- ⚖️ Comparateur de forfaits
- 📧 Newsletter
- 🍪 Consentement cookies (RGPD)
- 🌐 Multi-langues (FR/EN/ES/DE)
- 📱 Design responsive
- 🎨 Thème switcher
- ♿ Accessibilité

### Backend API
- Authentification JWT
- Gestion des produits
- Gestion des commandes
- Génération de codes QR eSIM
- Intégration paiement Stripe
- Dashboard utilisateur
- Panel administrateur

## 🚀 Installation

### Prérequis
- Node.js 18+
- npm ou yarn

### Backend

```bash
cd backend
cp .env.example .env
# Modifier les variables d'environnement
npm install
npm start
```

Le serveur API sera disponible sur `http://localhost:3000`

### Frontend

Le frontend est déjà inclus dans le projet et sert automatiquement via le backend sur `http://localhost:3000`

Pour utiliser le frontend单独的:

```bash
# Servir avec n'importe quel serveur statique
npx serve public
```

## 📁 Structure du Projet

```
E-Sim/
├── public/                  # Fichiers frontend
│   ├── index.html         # Page principale
│   ├── dashboard.html      # Dashboard utilisateur
│   ├── admin.html          # Panel admin
│   ├── js/
│   │   └── api.js         # Client API
│   ├── css/
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service Worker
├── backend/               # API Backend
│   ├── server.js         # Serveur principal
│   ├── routes/           # Routes API
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── esim.js
│   │   └── payment.js
│   ├── models/
│   │   └── database.js   # Base de données (en mémoire)
│   └── .env.example
├── brand-assets/          # Assets de marque
│   └── logo.svg
└── README.md
```

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur actuel

### Produits
- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détails produit

### Commandes
- `POST /api/orders` - Créer une commande
- `GET /api/users/orders` - Liste des commandes

### eSIM
- `POST /api/esim/generate` - Générer eSIM
- `GET /api/esim` - Liste des eSIM
- `POST /api/esim/:id/activate` - Activer eSIM
- `POST /api/esim/:id/topup` - Recharger data

### Paiement
- `POST /api/payment/create-session` - Créer session Stripe
- `POST /api/payment/verify` - Vérifier paiement

## 🔧 Technologies

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Base de données**: In-memory (demo), PostgreSQL/MySQL (production)
- **Auth**: JWT
- **Paiements**: Stripe
- **eSIM**: QR Code generation

## 📱 PWA

Le site est installable comme application mobile:

1. Ajouter à l'écran d'accueil (iOS/Android)
2. Fonctionne hors-ligne
3. Notifications push (à configurer)

## 🔐 Sécurité

- ✅ Authentification JWT
- ✅ Hash des mots de passe (bcrypt)
- ✅ CORS configuré
- ✅ Validation des entrées
- ✅ HTTPS recommandé pour production

## 🚢 Déploiement

### Production

1. Configurer les variables d'environnement
2. Installer les dépendances: `npm install`
3. Build du frontend (si nécessaire)
4. Démarrer le serveur: `npm start`

### Docker (optionnel)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📄 Licence

MIT License - Voir LICENSE pour plus de détails.

## 👤 Auteur

**E-Sim By ELECTRON**

---

⭐ N'hésitez pas à contributeur ou signaler des bugs!