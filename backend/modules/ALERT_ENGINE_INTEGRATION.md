# 🚀 Intégration Alert-Engine

## 📋 Vue d'ensemble

L'alert-engine est une Cloud Function qui scanne automatiquement les tasks dans Firestore et crée des alertes pour les échéances D-30, D-15 et D-7.

## 🔧 Architecture

```
Frontend (AlertsList.tsx)
    ↓
useAlerts() hook (auto-trigger)
    ↓
alertService.triggerAlertEngine()
    ↓
Backend Flask /alerts/trigger
    ↓
alert_engine.py (avec Google Auth)
    ↓
Cloud Function alert-engine
    ↓
Firestore (création d'alertes)
```

## 🎯 Fonctionnement

### 1. Déclenchement automatique

Quand l'utilisateur accède à la page **Alertes**:
1. Le hook `useAlerts(autoTrigger=true)` se monte
2. Il déclenche automatiquement `alertService.triggerAlertEngine()`
3. Le backend appelle la Cloud Function avec authentification Google
4. L'alert-engine scanne les tasks et crée les alertes
5. Les alertes sont rafraîchies automatiquement après 1 seconde

### 2. Modes de déclenchement

#### Mode Scan (défaut)
Scanne toutes les tasks dans Firestore:
```typescript
await alertService.triggerAlertEngine({ limit: 50 });
```

#### Mode Single Task
Traite une task spécifique:
```typescript
await alertService.triggerAlertEngine({
  taskId: 'task-123',
  task: {
    id: 'task-123',
    title: 'Déclaration TVA',
    due_date: '2025-11-04',
    status: 'open'
  }
});
```

#### Mode Dry Run (simulation)
Simule sans créer d'alertes:
```typescript
await alertService.triggerAlertEngine({ 
  limit: 10, 
  dryRun: true 
});
```

## 🔐 Authentification

L'authentification se fait automatiquement via:
1. **Backend → Cloud Function**: Token Google ID via `google.oauth2.id_token.fetch_id_token()`
2. Le token est automatiquement valide pour 1h
3. Pas besoin de gérer manuellement les tokens

### Configuration requise

Variable d'environnement dans le backend:
```bash
ALERT_ENGINE_URL=https://us-west1-agent-gcp-f6005.cloudfunctions.net/alert-engine
```

## 📡 Endpoints Backend

### POST /alerts/trigger
Déclenche l'alert-engine

**Query params:**
- `limit` (int, optionnel): Nombre max de tasks à traiter
- `dry_run` (bool, optionnel): Simulation sans création

**Body (optionnel pour single task):**
```json
{
  "task_id": "task-123",
  "task": {
    "id": "task-123",
    "title": "Déclaration TVA",
    "due_date": "2025-11-04",
    "status": "open",
    "org_id": "org_demo"
  }
}
```

**Réponse:**
```json
{
  "success": true,
  "mode": "scan",
  "result": {
    "status": "ok",
    "created_alerts": 3,
    "skipped_existing": 2,
    "errors": 0,
    "processed_tasks": 10,
    "elapsed_ms": 150
  },
  "timestamp": "2025-10-28T16:00:00Z"
}
```

## 🧪 Tests manuels

### Test depuis le terminal

```bash
# Obtenir un token
TOKEN=$(gcloud auth print-identity-token)

# Test mode scan
curl -X POST "http://localhost:8080/alerts/trigger?limit=10" \
  -H "Content-Type: application/json"

# Test mode single task
curl -X POST "http://localhost:8080/alerts/trigger" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "test-task-1",
    "task": {
      "id": "test-task-1",
      "title": "Test TVA",
      "due_date": "2025-11-04",
      "status": "open",
      "org_id": "org_demo"
    }
  }'

# Test dry run
curl -X POST "http://localhost:8080/alerts/trigger?dry_run=true&limit=5"
```

### Test depuis le frontend

Dans la console du navigateur:
```javascript
// Déclencher manuellement
await alertService.triggerAlertEngine({ limit: 10 });

// Voir le résultat
console.log('Alertes après trigger:', alerts);
```

## 🐛 Troubleshooting

### Erreur 401 Unauthorized
- Vérifier que les credentials Google Cloud sont configurés
- Vérifier que le service account a les permissions nécessaires

### Pas d'alertes créées
- Vérifier que les tasks ont un `due_date` dans le futur
- Vérifier que les tasks ont un `status` = "open" ou "in_progress"
- Les alertes sont idempotentes: si elles existent déjà, elles sont "skipped"

### Timeout
- L'alert-engine peut prendre du temps si beaucoup de tasks
- Utiliser le paramètre `limit` pour limiter le nombre de tasks

## 📊 Monitoring

Les logs du backend affichent:
```
🚀 Déclenchement alert-engine (scan mode) - limit=50
✅ Alert-engine scan terminé: 3 créées, 2 skipped, 10 tasks traitées
```

Les logs frontend affichent:
```
🚀 Déclenchement automatique de l'alert-engine...
✅ Alert-engine déclenché: {success: true, mode: 'scan', ...}
```

## 🔄 Cycle de vie

1. **Montage de AlertsList** → Déclenchement automatique
2. **Scan des tasks** → Création des alertes (30s - 1min)
3. **Rafraîchissement automatique** → Nouvelles alertes affichées
4. **Désactivation sur Dashboard** → `useAlerts(false)` pour éviter les déclenchements multiples

## 🎯 Bonnes pratiques

1. ✅ **Toujours utiliser autoTrigger=false sur Dashboard** pour éviter les appels inutiles
2. ✅ **Limiter le nombre de tasks** en production avec `limit`
3. ✅ **Utiliser dry_run** pour tester sans créer d'alertes
4. ✅ **Vérifier les logs** pour monitorer les performances
5. ❌ **Ne pas appeler triggerAlertEngine() en boucle** (risque de rate limiting)
