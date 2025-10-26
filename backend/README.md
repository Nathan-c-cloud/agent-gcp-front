# Backend Alert Engine

Ce backend Flask fournit une API pour gérer les alertes en intégration avec le service `alert-engine` déployé sur Cloud Run.

## Architecture

```
Frontend React → Backend Flask → alert-engine (Cloud Run) → Firestore
                      ↓
                  Firestore (lectures alertes)
```

## Structure du projet

```
backend/
├── app.py                    # Application Flask principale
├── requirements.txt          # Dépendances Python
├── Dockerfile               # Configuration Docker
├── scripts/
│   ├── deploy.sh            # Script de déploiement Cloud Run
│   ├── seed_test_tasks.py   # Création de données de test
│   └── test_api.sh          # Tests automatisés de l'API
├── tests/
│   └── validation_checklist.md  # Checklist de validation
└── README.md               # Cette documentation
```

## Configuration

### Variables d'environnement requises

```bash
export GCP_PROJECT="votre-project-id"
export ALERT_ENGINE_URL="https://votre-alert-engine-url"
```

### Variables d'environnement optionnelles

```bash
export ALERT_REFRESH_TTL=300      # TTL en secondes (défaut: 5 min)
export MAX_ALERTS=50              # Nombre max d'alertes (défaut: 50)
export CALL_TIMEOUT_SECONDS=30    # Timeout appels HTTP (défaut: 30s)
export PORT=8080                  # Port du serveur (défaut: 8080)
```

## Installation locale

### Prérequis
- Python 3.11+
- Accès à un projet GCP avec Firestore activé
- Service `alert-engine` déployé sur Cloud Run

### Installation

```bash
cd backend/
pip install -r requirements.txt
```

### Lancement en développement

```bash
# Configurer les variables d'environnement
export GCP_PROJECT="votre-project-id"
export ALERT_ENGINE_URL="https://votre-alert-engine-url"

# Lancer l'application
python app.py
```

Le serveur sera accessible sur `http://localhost:8080`

## Déploiement sur Cloud Run

### Méthode automatique

```bash
cd backend/

# Configurer les variables
export GCP_PROJECT="votre-project-id"
export ALERT_ENGINE_URL="https://votre-alert-engine-url"

# Déployer
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Méthode manuelle

```bash
# Build de l'image
gcloud builds submit --tag gcr.io/$GCP_PROJECT/alert-backend

# Déploiement
gcloud run deploy alert-backend \
    --image gcr.io/$GCP_PROJECT/alert-backend \
    --platform managed \
    --region europe-west1 \
    --allow-unauthenticated \
    --set-env-vars "GCP_PROJECT=$GCP_PROJECT,ALERT_ENGINE_URL=$ALERT_ENGINE_URL"
```

## API Endpoints

### `GET /health`

Health check du service.

**Réponse:**
```json
{
  "status": "healthy",
  "timestamp": 1698765432
}
```

### `GET /alerts`

Endpoint principal pour récupérer les alertes.

**Paramètres de query:**
- `sync` (boolean, défaut: false) - Mode synchrone vs background
- `ttl_override` (int, optionnel) - Override du TTL en secondes

**Exemples:**
```bash
# Mode background (défaut)
GET /alerts

# Mode synchrone  
GET /alerts?sync=true

# Force le refresh
GET /alerts?ttl_override=0

# Combinaison
GET /alerts?sync=true&ttl_override=60
```

**Réponse:**
```json
{
  "alerts": [
    {
      "id": "task_123_D-7_2024-11-02",
      "task_id": "task_123",
      "alert_type": "deadline_approaching",
      "message": "Task due in 7 days",
      "received_at": "2024-10-26T10:00:00Z",
      "priority": "high"
    }
  ],
  "triggered": true,
  "trigger_mode": "background",
  "metadata": {
    "count": 1,
    "last_refresh": 1698765432,
    "time_since_refresh": 125,
    "ttl": 300,
    "timestamp": 1698765557
  },
  "scan_result": {
    "status": "success",
    "message": "Scan completed"
  }
}
```

## Logique de fonctionnement

### TTL et déclenchement

1. **Vérification TTL**: Chaque appel vérifie `now - last_refresh >= TTL`
2. **Mise à jour optimiste**: Si déclenchement nécessaire, `last_refresh_ts` est mis à jour immédiatement
3. **Mode background**: `alert-engine` appelé en thread séparé (non-bloquant)
4. **Mode sync**: Attendre la réponse de `alert-engine` avant de répondre

### Authentification

- **ID Tokens**: Génération automatique pour appels vers `alert-engine`
- **Service Account**: Le backend doit avoir `roles/run.invoker` sur `alert-engine`
- **Audience**: Utilise l'URL de `alert-engine` comme audience pour l'ID token

### Gestion d'erreur

- Si `alert-engine` inaccessible, le backend retourne quand même les alertes existantes
- Logs détaillés pour debug (triggered/skipped, erreurs réseau)
- Timeouts configurables pour éviter les blocages

## Tests

### Données de test

```bash
cd backend/scripts/

# Créer des tâches de test
python seed_test_tasks.py

# Nettoyer les données de test
python seed_test_tasks.py --clean
```

### Tests automatisés

```bash
cd backend/scripts/

# Tests locaux
./test_api.sh http://localhost:8080

# Tests sur Cloud Run
./test_api.sh https://votre-service-url
```

### Tests manuels

```bash
# Health check
curl https://votre-service-url/health

# Récupérer les alertes
curl https://votre-service-url/alerts

# Mode synchrone
curl "https://votre-service-url/alerts?sync=true"

# Force refresh
curl "https://votre-service-url/alerts?ttl_override=0"
```

## Monitoring

### Logs Cloud Run

```bash
# Logs en temps réel
gcloud run logs tail alert-backend --region europe-west1

# Logs des dernières heures
gcloud run logs read alert-backend --region europe-west1 --limit 100
```

### Métriques importantes

- **Triggered calls**: Nombre d'appels qui déclenchent `alert-engine`
- **Response time**: Temps de réponse (background vs sync)
- **Error rate**: Taux d'erreur des appels vers `alert-engine`
- **TTL effectiveness**: Respect du throttling

### Firestore Collections

- **`tasks`**: Tâches sources pour les alertes
- **`alerts`**: Alertes générées par `alert-engine`
- **`_meta/alerts_refresh`**: Timestamp du dernier refresh

## Dépannage

### Erreurs communes

1. **"Missing GCP_PROJECT"**: Définir `export GCP_PROJECT=votre-project-id`
2. **"Missing ALERT_ENGINE_URL"**: Définir l'URL du service alert-engine
3. **403 Forbidden**: Vérifier les permissions IAM du Service Account
4. **Timeout errors**: Augmenter `CALL_TIMEOUT_SECONDS`
5. **No alerts returned**: Vérifier que des tâches existent dans Firestore

### Debug étapes

1. **Vérifier health**: `curl /health`
2. **Vérifier variables**: Logs de démarrage
3. **Vérifier Firestore**: Console Firebase
4. **Vérifier alert-engine**: Appel direct
5. **Vérifier IAM**: Permissions Service Account

## Sécurité

### Permissions GCP requises

**Service Account du backend**:
- `roles/run.invoker` sur le service `alert-engine`
- `roles/datastore.user` pour accès Firestore

**Service Account alert-engine**:
- `roles/datastore.user` pour écriture Firestore

### Authentification

- ID Tokens générés automatiquement
- Pas de clés API en dur
- Utilisation des Service Accounts GCP

## Performance

### Optimisations

- **Background calls**: Non-bloquant par défaut
- **TTL throttling**: Évite les appels inutiles
- **Firestore queries**: Index sur `received_at` pour tri
- **Connexions persistantes**: Réutilisation clients HTTP

### Limits recommandées

- `MAX_ALERTS=50`: Limite les réponses volumineuses  
- `ALERT_REFRESH_TTL=300`: Balance fraîcheur/performance
- `CALL_TIMEOUT_SECONDS=30`: Évite les timeouts Cloud Run

## Intégration Frontend

### Appel depuis React

```typescript
// Service pour appeler le backend
const AlertService = {
  async getAlerts(syncMode = false, ttlOverride?: number) {
    const params = new URLSearchParams();
    if (syncMode) params.set('sync', 'true');
    if (ttlOverride !== undefined) params.set('ttl_override', ttlOverride.toString());
    
    const response = await fetch(`/api/alerts?${params}`);
    return response.json();
  }
};

// Utilisation dans un composant
const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    AlertService.getAlerts()
      .then(data => {
        setAlerts(data.alerts);
        setLoading(false);
      });
  }, []);
  
  return (
    <div>
      {loading ? <Spinner /> : <AlertList alerts={alerts} />}
    </div>
  );
};
```

### Proxy de développement

Dans `vite.config.ts` :

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```