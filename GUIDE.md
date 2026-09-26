# 📘 Guide Complet de Configuration - Groupe ARENA Helpdesk

Ce guide vous accompagne de A à Z pour déployer l'application sur GitHub Pages avec Firebase.

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#1-prérequis)
2. [Structure des fichiers](#2-structure-des-fichiers)
3. [Configuration Firebase](#3-configuration-firebase)
4. [Configuration du Repository GitHub](#4-configuration-du-repository-github)
5. [Déploiement sur GitHub Pages](#5-déploiement-sur-github-pages)
6. [Création du premier Super Admin](#6-création-du-premier-super-admin)
7. [Vérification finale](#7-vérification-finale)
8. [Dépannage](#8-dépannage)

---

## 1. PRÉREQUIS

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte [Google](https://accounts.google.com/) (pour Firebase)
- ✅ Un compte [GitHub](https://github.com/) (gratuit)
- ✅ [Node.js](https://nodejs.org/) version 18 ou supérieure installé
- ✅ [Git](https://git-scm.com/) installé sur votre machine

Vérifiez vos installations :
```bash
node --version    # Doit afficher v18.x.x ou supérieur
npm --version     # Doit afficher 9.x.x ou supérieur
git --version     # Doit afficher git version 2.x.x
```

---

## 2. STRUCTURE DES FICHIERS

Voici la liste complète de tous les fichiers du projet et leur emplacement :

```
arena-helpdesk/                          ← Racine du projet
│
├── .env.example                         ← Template des variables d'environnement
├── .gitignore                           ← Fichiers ignorés par Git
├── index.html                           ← Point d'entrée HTML
├── package.json                         ← Dépendances npm
├── package-lock.json                    ← Lock file (généré automatiquement)
├── README.md                            ← Documentation principale
├── GUIDE.md                             ← Ce guide de configuration
├── tsconfig.json                        ← Configuration TypeScript
├── vite.config.js                       ← Configuration Vite (avec base './')
│
├── .github/
│   └── workflows/
│       └── deploy.yml                   ← Workflow GitHub Actions (déploiement auto)
│
├── public/                              ← Assets statiques (images, favicon...)
│   └── (vide pour l'instant)
│
├── src/                                 ← Code source
│   ├── main.tsx                         ← Point d'entrée React
│   ├── App.tsx                          ← Composant racine + Router (HashRouter)
│   ├── index.css                        ← Styles globaux Tailwind
│   ├── vite-env.d.ts                    ← Types Vite
│   │
│   ├── config/
│   │   └── firebase.ts                 ← Configuration Firebase (clés API)
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx             ← Contexte d'authentification (rôles, login/logout)
│   │
│   ├── components/
│   │   ├── Layout.tsx                  ← Layout principal (Sidebar + Navbar)
│   │   └── ProtectedRoute.tsx          ← Protection des routes par rôle
│   │
│   └── pages/
│       ├── Login.tsx                   ← Page de connexion
│       ├── Dashboard.tsx               ← Tableau de bord (stats, tickets récents)
│       ├── Assets.tsx                  ← Gestion des actifs/inventaire
│       ├── Tickets.tsx                 ← Système de tickets helpdesk
│       └── Users.tsx                   ← Gestion des utilisateurs (Super Admin)
│
└── dist/                                ← Dossier de build (généré par `npm run build`)
    ├── index.html
    └── assets/
        ├── index-XXXXX.js
        └── index-XXXXX.css
```

### Rôle de chaque fichier clé :

| Fichier | Rôle |
|---------|------|
| `vite.config.js` | Configure le build Vite avec `base: './'` pour GitHub Pages |
| `src/config/firebase.ts` | Contient les clés API Firebase (à remplacer par les vôtres) |
| `src/contexts/AuthContext.tsx` | Gère l'authentification et les rôles utilisateurs |
| `src/App.tsx` | Routeur principal avec `HashRouter` (compatible GitHub Pages) |
| `.github/workflows/deploy.yml` | Automatise le build et déploiement sur GitHub Pages |
| `.env.example` | Template pour les variables d'environnement Firebase |

---

## 3. CONFIGURATION FIREBASE

### Étape 3.1 : Créer un projet Firebase

1. Allez sur **[console.firebase.google.com](https://console.firebase.google.com/)**
2. Cliquez sur **"Ajouter un projet"** (bouton bleu)
3. Nom du projet : **`groupe-arena-helpdesk`** (ou ce que vous voulez)
4. Google Analytics : **Désactivez** (pas nécessaire pour ce projet)
5. Cliquez sur **"Créer le projet"**
6. Attendez quelques secondes, puis cliquez sur **"Continuer"**

### Étape 3.2 : Enregistrer l'application Web

1. Sur la page d'accueil du projet, cliquez sur l'icône **Web** `</>`
2. Nom de l'application : **`Arena Helpdesk`**
3. **NE cochez PAS** "Configurer également Firebase Hosting"
4. Cliquez sur **"Enregistrer l'application"**
5. **📋 COPIEZ la configuration** qui s'affiche (vous en aurez besoin après) :

```javascript
// Gardez ces valeurs précieusement !
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "groupe-arena-helpdesk.firebaseapp.com",
  projectId: "groupe-arena-helpdesk",
  storageBucket: "groupe-arena-helpdesk.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

6. Cliquez sur **"Continuer vers la console"**

### Étape 3.3 : Activer l'Authentification

1. Dans le menu latéral gauche, cliquez sur **"Créer"** > **"Authentication"**
   (ou allez directement dans le menu "Authentication")
2. Cliquez sur **"Commencer"**
3. Dans l'onglet **"Sign-in method"**, cliquez sur **"Email/Mot de passe"**
4. Activez le premier interrupteur **"Email/Mot de passe"**
5. Cliquez sur **"Enregistrer"**

### Étape 3.4 : Créer la base de données Firestore

1. Dans le menu latéral gauche, cliquez sur **"Créer"** > **"Firestore Database"**
2. Cliquez sur **"Créer une base de données"**
3. Emplacement : choisissez **`eur3 (europe-west)`** (le plus proche de la France)
4. Règles de sécurité : sélectionnez **"Démarrer en mode test"** (on les changera après)
5. Cliquez sur **"Activer"**
6. Attendez la création (quelques secondes)

### Étape 3.5 : Configurer les règles de sécurité Firestore

1. Dans Firestore, cliquez sur l'onglet **"Règles"**
2. Remplacez le contenu par ceci :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonction utilitaire pour vérifier le rôle
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isAdmin() {
      return getUserRole() in ['admin', 'super_admin'];
    }
    
    function isSuperAdmin() {
      return getUserRole() == 'super_admin';
    }
    
    // COLLECTION USERS - Gestion des profils utilisateurs
    match /users/{userId} {
      // Lecture : soi-même ou super_admin
      allow read: if request.auth != null && 
        (request.auth.uid == userId || isSuperAdmin());
      // Écriture : soi-même (inscription) ou super_admin
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && 
        (request.auth.uid == userId || isSuperAdmin());
    }
    
    // COLLECTION ASSETS - Inventaire
    match /assets/{assetId} {
      // Lecture : tous les utilisateurs authentifiés
      allow read: if request.auth != null;
      // Écriture : admins uniquement
      allow write: if request.auth != null && isAdmin();
    }
    
    // COLLECTION TICKETS - Helpdesk
    match /tickets/{ticketId} {
      // Lecture : créateur du ticket ou admins
      allow read: if request.auth != null && 
        (resource.data.createdBy == request.auth.uid || isAdmin());
      // Création : tous les authentifiés
      allow create: if request.auth != null;
      // Modification : créateur (commentaires) ou admins (statut, assignation)
      allow update: if request.auth != null;
      // Suppression : admins uniquement
      allow delete: if request.auth != null && isAdmin();
    }
  }
}
```

3. Cliquez sur **"Publier"**

---

## 4. CONFIGURATION DU REPOSITORY GITHUB

### Étape 4.1 : Créer le repository GitHub

1. Allez sur **[github.com/new](https://github.com/new)**
2. Nom du repository : **`arena-helpdesk`** (ou votre choix)
3. Description : **`Groupe ARENA - Helpdesk & Inventaire`**
4. Visibilité : **Public** (requis pour GitHub Pages gratuit) ou **Privé** (si vous avez GitHub Pro)
5. **NE cochez PAS** "Add a README file" (on a déjà le nôtre)
6. **NE cochez PAS** "Add .gitignore" (on a déjà le nôtre)
7. Cliquez sur **"Create repository"**

### Étape 4.2 : Initialiser le projet local et pousser le code

Ouvrez un terminal dans le dossier de votre projet :

```bash
# Aller dans le dossier du projet
cd chemin/vers/arena-helpdesk

# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "🎉 Initial commit - Groupe ARENA Helpdesk"

# Renommer la branche en main
git branch -M main

# Ajouter le remote GitHub
git remote add origin https://github.com/VOTRE_USERNAME/arena-helpdesk.git

# Pousser le code
git push -u origin main
```

> ⚠️ Remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub.

### Étape 4.3 : Configurer les secrets Firebase dans GitHub

Ces secrets permettent au workflow GitHub Actions d'accéder à votre projet Firebase lors du build.

1. Sur votre repo GitHub, allez dans **Settings** (onglet en haut à droite)
2. Dans le menu latéral gauche, cliquez sur **"Secrets and variables"** > **"Actions"**
3. Cliquez sur **"New repository secret"** pour chacun des 6 secrets :

| Nom du secret | Valeur (depuis Firebase Console) |
|---------------|----------------------------------|
| `VITE_FIREBASE_API_KEY` | `apiKey` de votre config Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` de votre config Firebase |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` de votre config Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` de votre config Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` de votre config Firebase |
| `VITE_FIREBASE_APP_ID` | `appId` de votre config Firebase |

Pour chaque secret :
- Collez le **Nom** exactement comme indiqué
- Collez la **Valeur** correspondante depuis la config Firebase (Étape 3.2)
- Cliquez sur **"Add secret"**

### Étape 4.4 : Activer GitHub Pages

1. Toujours dans **Settings** du repo GitHub
2. Dans le menu latéral gauche, cliquez sur **"Pages"**
3. Sous **"Source"**, sélectionnez **"GitHub Actions"**
   (pas "Deploy from a branch" !)
4. Sauvegardez

---

## 5. DÉPLOIEMENT SUR GITHUB PAGES

### Étape 5.1 : Lancer le déploiement

Le déploiement se lance **automatiquement** à chaque push sur `main`. Pour le forcer manuellement :

1. Allez dans l'onglet **"Actions"** de votre repo GitHub
2. Cliquez sur le workflow **"Deploy to GitHub Pages"** dans la liste à gauche
3. Cliquez sur **"Run workflow"** (bouton à droite)
4. Sélectionnez la branche **main** et cliquez sur **"Run workflow"**

### Étape 5.2 : Suivre le déploiement

1. Dans l'onglet **Actions**, vous verrez le workflow en cours d'exécution
2. Cliquez dessus pour voir les détails des jobs (build + deploy)
3. Attendez que les deux jobs soient verts ✅ (environ 1-2 minutes)

### Étape 5.3 : Accéder à votre application

Une fois le déploiement terminé, votre application est accessible à :

```
https://VOTRE_USERNAME.github.io/arena-helpdesk/
```

> ⚠️ Remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub.

---

## 6. CRÉATION DU PREMIER SUPER ADMIN

Le premier compte doit être créé manuellement car il n'y a pas encore d'admin.

### Étape 6.1 : Créer l'utilisateur dans Firebase Auth

1. Retournez sur **[console.firebase.google.com](https://console.firebase.google.com/)** > votre projet
2. Allez dans **Authentication** > onglet **"Users"**
3. Cliquez sur **"Ajouter un utilisateur"**
4. Entrez :
   - Email : `admin@arena.com` (ou votre email)
   - Mot de passe : minimum 6 caractères
5. Cliquez sur **"Ajouter un utilisateur"**
6. **Copiez l'UID** de l'utilisateur (cliquez sur les 3 points > "Copier l'UID")
   Exemple : `AbCdEfGhIjKlMnOpQrStUvWxYz01`

### Étape 6.2 : Créer le profil dans Firestore

1. Allez dans **Firestore Database**
2. Cliquez sur **"Commencer la collection"** (si c'est la première)
3. Nom de la collection : **`users`**
4. ID du document : **collez l'UID** copié à l'étape précédente
5. Ajoutez les champs suivants :

| Nom du champ | Type | Valeur |
|-------------|------|--------|
| `uid` | string | (l'UID copié) |
| `email` | string | `admin@arena.com` |
| `displayName` | string | `Admin ARENA` |
| `role` | string | `super_admin` |
| `createdAt` | string | `2024-01-01T00:00:00.000Z` |

6. Cliquez sur **"Enregistrer"**

### Étape 6.3 : Se connecter

1. Allez sur `https://VOTRE_USERNAME.github.io/arena-helpdesk/`
2. Connectez-vous avec l'email et le mot de passe créés
3. Vous avez maintenant accès à toutes les fonctionnalités ! 🎉

---

## 7. VÉRIFICATION FINALE

### Checklist de vérification :

- [ ] Firebase Auth activé avec Email/Mot de passe
- [ ] Firestore Database créée avec les bonnes règles
- [ ] Les 6 secrets Firebase configurés dans GitHub
- [ ] GitHub Pages activé avec source "GitHub Actions"
- [ ] Le workflow Actions s'est exécuté avec succès (✅ vert)
- [ ] Le site est accessible à l'URL GitHub Pages
- [ ] Le premier Super Admin est créé dans Firebase
- [ ] La connexion fonctionne
- [ ] Le Dashboard s'affiche correctement
- [ ] La page Actifs est accessible
- [ ] La page Tickets est accessible
- [ ] La page Utilisateurs est accessible (Super Admin uniquement)

### Créer des utilisateurs de test :

Une fois connecté en Super Admin :
1. Allez dans la page **"Utilisateurs"**
2. Cliquez sur **"Créer un compte"**
3. Créez un compte Admin (rôle : Administrateur)
4. Créez un compte Utilisateur (rôle : Utilisateur)
5. Testez la connexion avec chaque compte pour vérifier les permissions

---

## 8. DÉPANNAGE

### ❌ Erreur 404 sur GitHub Pages

**Cause** : Le `base` dans `vite.config.js` n'est pas correct.
**Solution** : Vérifiez que `base` est bien `'./'` en production dans `vite.config.js`.

### ❌ Erreur Firebase "Permission denied"

**Cause** : Les règles Firestore sont trop restrictives ou le profil utilisateur n'existe pas.
**Solution** : 
- Vérifiez que le document `users/{uid}` existe dans Firestore
- Vérifiez que le champ `role` est bien défini
- Vérifiez les règles dans l'onglet "Règles" de Firestore

### ❌ Erreur "auth/invalid-credential"

**Cause** : Email ou mot de passe incorrect.
**Solution** : Vérifiez les identifiants dans Firebase Authentication.

### ❌ Le workflow GitHub Actions échoue

**Causes possibles** :
- Secrets mal configurés → Vérifiez dans Settings > Secrets
- Le fichier `deploy.yml` est mal formé → Vérifiez la syntaxe YAML
- `npm ci` échoue → Vérifiez que `package-lock.json` est bien commité

**Solution** : Consultez les logs dans l'onglet Actions pour voir l'erreur exacte.

### ❌ Page blanche après déploiement

**Cause** : Les chemins des assets ne sont pas relatifs.
**Solution** : Vérifiez que `vite.config.js` contient `base: './'` en production.

### ❌ Les secrets ne sont pas pris en compte

**Cause** : Les variables d'environnement ne sont pas préfixées par `VITE_`.
**Solution** : Toutes les variables Firebase DOIVENT commencer par `VITE_` pour être accessibles côté client.

---

## 📞 Support

En cas de problème :
1. Vérifiez la console du navigateur (F12 > Console) pour les erreurs
2. Vérifiez les logs du workflow GitHub Actions
3. Vérifiez la console Firebase pour les erreurs de règles

---

*© 2024 Groupe ARENA - Guide de configuration*
