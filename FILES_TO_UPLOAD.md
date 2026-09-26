# 📋 Liste complète des fichiers à uploader sur GitHub

## ⚡ DÉMARRAGE RAPIDE

L'application fonctionne **immédiatement en mode démo** (sans Firebase) !
Vous pouvez la tester tout de suite après le déploiement.

### Comptes de démonstration :
| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Super Admin | `admin@arena.com` | `password123` |
| Admin IT | `it@arena.com` | `password123` |
| Utilisateur | `marie@arena.com` | `password123` |

---

## 📁 FICHIERS À UPLOADER SUR GITHUB

### Racine du projet
```
.env.example              ← Template des variables Firebase
.gitignore                ← Fichiers ignorés par Git
index.html                ← Point d'entrée HTML
package.json              ← Dépendances npm
package-lock.json         ← Lock file (IMPORTANT: à committer)
README.md                 ← Documentation
GUIDE.md                  ← Guide de configuration détaillé
tsconfig.json             ← Configuration TypeScript
vite.config.js            ← Configuration Vite
```

### Dossier .github/workflows/
```
.github/workflows/deploy.yml   ← Workflow de déploiement automatique
```

### Dossier src/
```
src/main.tsx                   ← Point d'entrée React
src/App.tsx                    ← Routeur principal (HashRouter)
src/index.css                  ← Styles Tailwind CSS
src/vite-env.d.ts             ← Types Vite
```

### Dossier src/config/
```
src/config/firebase.ts         ← Configuration Firebase
src/config/dataService.ts      ← Service de données (démo + Firebase)
```

### Dossier src/contexts/
```
src/contexts/AuthContext.tsx   ← Contexte d'authentification
```

### Dossier src/components/
```
src/components/Layout.tsx          ← Layout principal (Sidebar + Navbar)
src/components/ProtectedRoute.tsx  ← Protection des routes
```

### Dossier src/pages/
```
src/pages/Login.tsx       ← Page de connexion
src/pages/Dashboard.tsx   ← Tableau de bord
src/pages/Assets.tsx      ← Gestion des actifs/inventaire
src/pages/Tickets.tsx     ← Système de tickets helpdesk
src/pages/Users.tsx       ← Gestion des utilisateurs
```

---

## 🚀 COMMANDES POUR UPLOADER SUR GITHUB

```bash
# 1. Initialiser Git (si pas déjà fait)
git init

# 2. Ajouter tous les fichiers
git add .

# 3. Premier commit
git commit -m "🎉 Initial commit - Groupe ARENA Helpdesk"

# 4. Renommer la branche en main
git branch -M main

# 5. Ajouter le remote GitHub (remplacez VOTRE_USERNAME et VOTRE_REPO)
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git

# 6. Pousser le code
git push -u origin main
```

---

## ✅ VÉRIFICATION APRÈS UPLOAD

1. Allez sur votre repo GitHub
2. Vérifiez que tous les fichiers sont présents
3. Allez dans **Settings > Pages**
4. Source : **GitHub Actions**
5. Allez dans l'onglet **Actions** et vérifiez que le workflow se lance
6. Attendez 1-2 minutes
7. Accédez à votre site : `https://VOTRE_USERNAME.github.io/VOTRE_REPO/`

---

## 🔧 CONFIGURATION FIREBASE (OPTIONNEL)

Pour passer en mode production avec Firebase :

1. Créez un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activez Authentication (Email/Password)
3. Créez Firestore Database
4. Récupérez les clés de configuration
5. Remplacez les valeurs dans `src/config/firebase.ts`
6. Ajoutez les secrets dans GitHub (Settings > Secrets > Actions) :
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

**Guide détaillé** : Consultez [GUIDE.md](./GUIDE.md)

---

## 🎯 FONCTIONNALITÉS

✅ **Mode Démo** : Fonctionne immédiatement sans configuration  
✅ **Dashboard** : Stats et tickets récents  
✅ **Inventaire** : Gestion des actifs (CRUD)  
✅ **Tickets** : Système de helpdesk complet  
✅ **Utilisateurs** : Gestion des rôles (Super Admin)  
✅ **Responsive** : Mobile et desktop  
✅ **GitHub Pages** : Déploiement automatique  
✅ **Firebase Ready** : Prêt pour la production  

---

## 📝 NOTES IMPORTANTES

- Le fichier `package-lock.json` est **essentiel** pour le build
- Ne commitez **JAMAIS** le fichier `.env` (seulement `.env.example`)
- Le workflow GitHub Actions se lance automatiquement à chaque push sur `main`
- Les chemins sont relatifs (`./assets/...`) pour fonctionner sur GitHub Pages
- L'application utilise `HashRouter` pour éviter les erreurs 404

---

**Prêt à déployer !** 🚀
