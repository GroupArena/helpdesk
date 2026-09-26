# 🏢 Groupe ARENA - Helpdesk & Inventaire

Application web de gestion de parc informatique et de helpdesk pour le Groupe ARENA.  
Déployée sur **GitHub Pages** avec **Firebase** (Auth + Firestore).

> 📘 **Guide de configuration complet** : [GUIDE.md](./GUIDE.md)

---

## 🚀 Fonctionnalités

- **Authentification** : Login via Firebase Auth avec 3 niveaux de rôles
- **Dashboard** : Vue d'ensemble adaptée au rôle de l'utilisateur
- **Inventaire** : Gestion des actifs (ajout, modification, suppression)
- **Tickets** : Système de helpdesk avec création, suivi et commentaires
- **Gestion utilisateurs** : Réservée au Super Administrateur

## 👥 Rôles

| Rôle | Permissions |
|------|------------|
| **Super Administrateur** | Accès total, gestion des comptes, configuration |
| **Administrateur** | Gestion des actifs, gestion des tickets (assignation, statuts) |
| **Utilisateur** | Consultation des actifs, création de tickets, suivi personnel |

## 🎨 Design

- Bleu corporate : `#19283E`
- Or principal : `#C9A125`
- Gris clair : `#E1E4EA`
- Blanc : `#FFFFFF`
- Interface responsive (mobile + desktop)
- Icônes : Lucide React
- Notifications : React Hot Toast

## 🛠️ Stack technique

- **Frontend** : React 18 + TypeScript + Vite
- **Styling** : Tailwind CSS 4
- **Backend** : Firebase v9+ (Auth + Firestore)
- **Routing** : React Router (HashRouter pour compatibilité GitHub Pages)
- **Icônes** : Lucide React
- **Notifications** : React Hot Toast
- **CI/CD** : GitHub Actions

## 📦 Déploiement rapide

```bash
# 1. Cloner le projet
git clone https://github.com/VOTRE_USERNAME/arena-helpdesk.git
cd arena-helpdesk

# 2. Installer les dépendances
npm install

# 3. Configurer les variables Firebase
cp .env.example .env
# Éditer .env avec vos clés Firebase

# 4. Lancer en développement
npm run dev

# 5. Build pour production
npm run build
```

Pour le déploiement complet sur GitHub Pages, suivez le **[GUIDE.md](./GUIDE.md)**.

## 📁 Structure du projet

```
arena-helpdesk/
├── .github/workflows/deploy.yml   ← Déploiement automatique GitHub Pages
├── .env.example                   ← Template variables Firebase
├── .gitignore
├── index.html
├── package.json
├── vite.config.js                 ← Config Vite (base: './' pour GitHub Pages)
├── README.md
├── GUIDE.md                       ← Guide de configuration complet
│
└── src/
    ├── main.tsx                   ← Point d'entrée React
    ├── App.tsx                    ← Router principal (HashRouter)
    ├── index.css                  ← Styles Tailwind
    ├── config/firebase.ts         ← Configuration Firebase
    ├── contexts/AuthContext.tsx    ← Auth + rôles
    ├── components/
    │   ├── Layout.tsx             ← Sidebar + Navbar
    │   └── ProtectedRoute.tsx     ← Protection des routes
    └── pages/
        ├── Login.tsx              ← Page de connexion
        ├── Dashboard.tsx          ← Tableau de bord
        ├── Assets.tsx             ← Inventaire
        ├── Tickets.tsx            ← Helpdesk
        └── Users.tsx              ← Gestion utilisateurs
```

## 🔐 Sécurité

- Règles Firestore restrictives par rôle
- Variables Firebase stockées en secrets GitHub (jamais dans le code)
- HashRouter pour compatibilité avec l'hébergement statique

## 📝 Licence

© 2024 Groupe ARENA - Tous droits réservés
