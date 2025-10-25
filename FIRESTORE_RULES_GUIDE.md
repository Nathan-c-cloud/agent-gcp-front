# 🔥 Guide : Configurer les Règles Firestore
## ⚠️ Problème actuel
L'erreur "due to access control checks" signifie que Firestore bloque vos requêtes car les règles de sécurité sont trop restrictives.
## ✅ Solution : Mettre à jour les règles Firestore
### Étape 1 : Ouvrir la Console Firebase
1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet : **agent-gcp-f6005**
### Étape 2 : Configurer Firestore Database
1. Dans le menu latéral gauche, cliquez sur **Firestore Database**
2. Si vous n'avez pas encore créé la base :
   - Cliquez sur **Create database**
   - Choisissez **Start in test mode** (pour le développement)
   - Sélectionnez une région (par exemple : europe-west1)
   - Cliquez sur **Enable**
### Étape 3 : Modifier les Règles
1. Une fois dans Firestore, cliquez sur l'onglet **Rules** (Règles) en haut
2. **COPIEZ ET COLLEZ** le contenu suivant :
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour la collection 'settings'
    match /settings/{companyId} {
      allow read, write: if true;
    }
    // Règles pour la collection 'integrations'
    match /integrations/{integrationId} {
      allow read, write: if true;
    }
    // Règles pour la collection 'declarations'
    match /declarations/{declarationId} {
      allow read, write: if true;
    }
    // Bloquer par défaut
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
3. Cliquez sur **Publish** (Publier)
### Étape 4 : Tester
1. Retournez dans votre application (http://localhost:5173)
2. Rechargez la page (Cmd/Ctrl + R)
3. Allez dans **Paramètres**
4. Remplissez les champs
5. Cliquez sur **Enregistrer les modifications**
6. ✅ Ça devrait fonctionner !
## 🔒 Pour la production
Remplacez `if true` par `if request.auth != null` pour sécuriser l'accès.
## 📝 Vérifier que ça fonctionne
Dans la console Firebase, allez dans **Firestore Database** → onglet **Data**
Vous devriez voir une collection "settings" avec vos données après avoir cliqué sur Enregistrer.
