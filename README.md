
# Alert Detail Page

This is a code bundle for Alert Detail Page. The original project is available at https://www.figma.com/design/Rs0awLlAsyTpDQ3nPzOGqm/Alert-Detail-Page.

## Table des matières

- [Installation](#installation)
- [Développement local](#développement-local)
- [Déploiement sur Firebase](#déploiement-sur-firebase)
- [Configuration](#configuration)

## Installation

Installez les dépendances du projet :

```bash
npm install
```

## Développement local

Lancez le serveur de développement :

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173` (ou un autre port si celui-ci est occupé).

## Déploiement sur Firebase

### Prérequis

1. Un compte Google/Firebase
2. Firebase CLI installé globalement

Si vous n'avez pas encore installé Firebase CLI, exécutez :

```bash
npm install -g firebase-tools
```

### Première configuration

1. **Connectez-vous à Firebase :**

```bash
firebase login
```

2. **Initialisez Firebase dans votre projet (si ce n'est pas déjà fait) :**

```bash
firebase init
```

Sélectionnez :
- **Hosting** : Configure files for Firebase Hosting
- Choisissez un projet Firebase existant ou créez-en un nouveau
- **Public directory** : `build` (déjà configuré dans firebase.json)
- **Configure as a single-page app** : `Yes`
- **Set up automatic builds and deploys with GitHub** : `No` (ou `Yes` si vous le souhaitez)

### Build et déploiement

1. **Créez le build de production :**

```bash
npm run build
```

Cela générera les fichiers optimisés dans le dossier `build/`.

2. **Déployez sur Firebase Hosting :**

```bash
firebase deploy
```

Ou pour déployer uniquement l'hosting :

```bash
firebase deploy --only hosting
```

3. **Votre application sera accessible à l'URL fournie par Firebase :**

```
https://votre-projet.web.app
https://votre-projet.firebaseapp.com
```

### Commandes utiles

- **Tester le build localement avant déploiement :**

```bash
firebase serve
```

- **Voir les déploiements précédents :**

```bash
firebase hosting:channel:list
```

- **Déployer sur un canal de prévisualisation :**

```bash
firebase hosting:channel:deploy preview
```

- **Annuler le dernier déploiement :**

```bash
firebase hosting:rollback
```

### Configuration Firebase (firebase.json)

Le fichier `firebase.json` est déjà configuré :

```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Cette configuration :
- Sert les fichiers depuis le dossier `build/`
- Redirige toutes les routes vers `index.html` (pour le routing côté client React)
- Ignore les fichiers inutiles lors du déploiement

## Technologies utilisées

- **React 18** - Bibliothèque UI
- **TypeScript** - Langage
- **Vite** - Build tool
- **Radix UI** - Composants UI accessibles
- **Tailwind CSS** - Framework CSS
- **Firebase Hosting** - Hébergement

## Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Crée le build de production
- `npm run preview` - Prévisualise le build de production localement

## Support

Pour toute question concernant le déploiement Firebase, consultez la [documentation officielle](https://firebase.google.com/docs/hosting).
  