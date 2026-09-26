# 🏢 Groupe ARENA - Helpdesk & Inventaire

Application web de gestion de parc informatique et de helpdesk pour le Groupe ARENA.

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

## 🎨 Couleurs

- Bleu corporate : `#19283E`
- Or principal : `#C9A125`
- Gris clair : `#E1E4EA`
- Blanc : `#FFFFFF`

## 🔧 Configuration Firebase

### Étape 1 : Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Nommez-le "Groupe ARENA" (ou autre)
4. Activez ou non Google Analytics (optionnel)

### Étape 2 : Configurer l'authentification

1. Dans le menu latéral, allez dans **Authentication**
2. Cliquez sur **Commencer**
3. Activez la méthode **Email/Mot de passe**

### Étape 3 : Créer la base Firestore

1. Dans le menu latéral, allez dans **Firestore Database**
2. Cliquez sur **Créer une base de données**
3. Choisissez le mode **Production** (ou Test pour commencer)
4. Sélectionnez la région la plus proche

### Étape 4 : Configurer les règles Firestore

Dans l'onglet **Règles** de Firestore, collez ceci :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utilisateurs - seuls les authentifiés peuvent lire leurs propres données
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin');
      allow write: if request.auth != null && (request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin');
    }
    
    // Actifs - lecture pour tous les authentifiés, écriture pour admins
    match /assets/{assetId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
    }
    
    // Tickets - lecture selon le rôle, écriture pour tous les authentifiés
    match /tickets/{ticketId} {
      allow read: if request.auth != null && (
        resource.data.createdBy == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin']
      );
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.createdBy == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin']
      );
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
    }
  }
}
```

### Étape 5 : Récupérer la configuration

1. Allez dans **Paramètres du projet** (⚙️)
2. Descendez jusqu'à "Vos applications"
3. Cliquez sur l'icône Web (</>)
4. Enregistrez l'application
5. Copiez l'objet `firebaseConfig`

### Étape 6 : Configurer l'application

Remplacez les valeurs dans `src/config/firebase.ts` par vos clés Firebase :

```typescript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "XXXXXXXXXXX",
  appId: "X:XXXXXXXXXXX:web:XXXXXXXXXXXX"
};
```

### Étape 7 : Créer le premier Super Admin

Après le déploiement, vous devez créer le premier compte Super Admin manuellement :

1. Allez dans **Authentication > Utilisateurs** dans Firebase Console
2. Cliquez sur **Ajouter un utilisateur**
3. Entrez l'email et le mot de passe
4. Dans Firestore, créez un document dans la collection `users` avec l'UID de cet utilisateur :

```json
{
  "uid": "L_UID_DE_L_UTILISATEUR",
  "email": "admin@arena.com",
  "displayName": "Admin ARENA",
  "role": "super_admin",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 📦 Déploiement sur GitHub Pages

### Configuration automatique (recommandé)

Le projet est déjà configuré pour un déploiement automatique via **GitHub Actions** :

1. **Créez un repository GitHub** pour votre projet
2. **Poussez le code** sur la branche `main` :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
   git push -u origin main
   ```

3. **Activez GitHub Pages** dans les paramètres du repository :
   - Allez dans **Settings** > **Pages**
   - Sous **Source**, sélectionnez **GitHub Actions**
   - Le workflow va automatiquement se déclencher à chaque push sur `main`

4. **Accédez à votre site** :
   - URL : `https://VOTRE_USERNAME.github.io/VOTRE_REPO/`
   - Le déploiement prend environ 1-2 minutes

### Configuration manuelle

Si vous préférez déployer manuellement :

```bash
# Build de production
npm run build

# Le dossier dist/ contient tous les fichiers statiques
# Uploadez son contenu sur GitHub Pages ou tout autre hébergeur statique
```

### Configuration des secrets Firebase

Pour que le déploiement automatique fonctionne, vous devez configurer les variables Firebase dans GitHub :

1. Allez dans **Settings** > **Secrets and variables** > **Actions**
2. Cliquez sur **New repository secret**
3. Ajoutez les secrets suivants (valeurs disponibles dans Firebase Console > Paramètres du projet) :
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### Notes importantes

- **HashRouter** est utilisé pour éviter les erreurs 404 lors du rafraîchissement
- Les chemins des assets sont **relatifs** (`./assets/...`) pour fonctionner quel que soit le nom du repo
- Le workflow GitHub Actions est dans `.github/workflows/deploy.yml`
- Les variables Firebase sont injectées via les secrets GitHub lors du build
- Pour le développement local, créez un fichier `.env` basé sur `.env.example`

## 🛠️ Stack technique

- **Frontend** : React 18 + TypeScript + Vite
- **Styling** : Tailwind CSS 4
- **Backend** : Firebase (Auth + Firestore)
- **Routing** : React Router (HashRouter pour compatibilité statique)
- **Icônes** : Lucide React
- **Notifications** : React Hot Toast

## 📁 Structure du projet

```
src/
├── config/
│   └── firebase.ts          # Configuration Firebase
├── contexts/
│   └── AuthContext.tsx       # Contexte d'authentification
├── components/
│   ├── Layout.tsx            # Layout principal (Sidebar + Navbar)
│   └── ProtectedRoute.tsx    # Protection des routes
├── pages/
│   ├── Login.tsx             # Page de connexion
│   ├── Dashboard.tsx         # Tableau de bord
│   ├── Assets.tsx            # Gestion des actifs
│   ├── Tickets.tsx           # Système de tickets
│   └── Users.tsx             # Gestion des utilisateurs
├── App.tsx                   # Point d'entrée avec routeur
├── main.tsx                  # Montage React
└── index.css                 # Styles globaux
```

## 🔐 Sécurité

- Les règles Firestore garantissent que seuls les utilisateurs autorisés peuvent accéder aux données
- Le rôle `super_admin` est le seul à pouvoir gérer les comptes utilisateurs
- Les utilisateurs standards ne voient que leurs propres tickets
- Les admins voient tous les tickets et peuvent les gérer

## 📝 Licence

© 2024 Groupe ARENA - Tous droits réservés
