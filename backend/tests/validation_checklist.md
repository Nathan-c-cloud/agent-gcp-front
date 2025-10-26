# Checklist de validation du Backend Alert Engine

## ✅ Prérequis de déploiement

### Configuration environnement
- [ ] Variables d'environnement définies
  - [ ] `GCP_PROJECT` configuré
  - [ ] `ALERT_ENGINE_URL` configuré avec l'URL correcte
  - [ ] Service `alert-engine` déployé et accessible
- [ ] Permissions IAM configurées
  - [ ] Backend Service Account → `roles/run.invoker` sur alert-engine
  - [ ] Backend Service Account → `roles/datastore.user` pour Firestore
  - [ ] alert-engine Service Account → `roles/datastore.user` pour Firestore
- [ ] Firestore configuré
  - [ ] Collections `tasks`, `alerts`, `_meta` accessibles
  - [ ] Index sur `received_at` pour collection `alerts` (optionnel pour performance)

---

## 🧪 Tests fonctionnels de base

### 1. Health Check
```bash
curl https://votre-backend-url/health
```
- [ ] Retourne `200 OK`
- [ ] JSON avec `{"status": "healthy", "timestamp": ...}`

### 2. Endpoint /alerts - Comportement de base
```bash
curl https://votre-backend-url/alerts
```
- [ ] Retourne `200 OK`
- [ ] Structure JSON correcte avec `alerts[]`, `triggered`, `trigger_mode`, `metadata`
- [ ] Premier appel: `triggered: true`
- [ ] Deuxième appel immédiat: `triggered: false` (dans TTL)

### 3. Modes de déclenchement

#### Mode background (défaut)
```bash
curl https://votre-backend-url/alerts
```
- [ ] Réponse rapide (< 2 secondes)
- [ ] `trigger_mode: "background"`
- [ ] Pas de `scan_result` dans la réponse
- [ ] Logs backend montrent appel async vers alert-engine

#### Mode synchrone
```bash
curl "https://votre-backend-url/alerts?sync=true"
```
- [ ] Réponse plus lente (attendre alert-engine)
- [ ] `trigger_mode: "sync"`
- [ ] `scan_result` présent dans la réponse
- [ ] Logs montrent appel synchrone

### 4. TTL et throttling
```bash
# Force le déclenchement
curl "https://votre-backend-url/alerts?ttl_override=0"

# Appel immédiat suivant (devrait être throttled)
curl https://votre-backend-url/alerts
```
- [ ] TTL override fonctionne (`triggered: true`)
- [ ] Appel suivant respecte le nouveau TTL (`triggered: false`)
- [ ] `metadata.time_since_refresh` reflète les vrais intervalles
- [ ] Document `_meta/alerts_refresh` mis à jour dans Firestore

---

## 📊 Tests avec données

### 5. Seed des données de test
```bash
cd backend/scripts/
export GCP_PROJECT="votre-project-id"
python seed_test_tasks.py
```
- [ ] 4 tâches créées dans collection `tasks`
- [ ] Tâches avec échéances variées (3, 7, 15, 30 jours)
- [ ] Pas d'erreurs dans les logs

### 6. Génération d'alertes
```bash
curl "https://votre-backend-url/alerts?sync=true"
```
- [ ] alert-engine traite les tâches
- [ ] Alertes créées dans collection `alerts`
- [ ] `alert_id` format correct: `{taskId}_D-{delta}_{due_date}`
- [ ] Pas de doublons pour même `alert_id`

### 7. Récupération des alertes
```bash
curl https://votre-backend-url/alerts
```
- [ ] Alertes retournées dans `alerts[]`
- [ ] Tri par `received_at` desc
- [ ] Limite respectée (`MAX_ALERTS`)
- [ ] Chaque alerte a un `id` (document ID)

---

## 🔄 Tests d'idempotence

### 8. Appels multiples
```bash
# Appeler plusieurs fois de suite
for i in {1..3}; do
  curl "https://votre-backend-url/alerts?ttl_override=0&sync=true"
  sleep 1
done
```
- [ ] Pas de doublons d'alertes créés
- [ ] Même `alert_id` pour même task + delta
- [ ] `scan_result` cohérent entre les appels

### 9. Concurrent calls (optionnel)
```bash
# Test de charge simple
for i in {1..5}; do
  curl https://votre-backend-url/alerts &
done
wait
```
- [ ] Pas d'erreurs de concurrence
- [ ] `last_refresh_ts` cohérent
- [ ] Performances acceptables

---

## 🚨 Tests de robustesse

### 10. alert-engine indisponible
```bash
# Temporairement modifier ALERT_ENGINE_URL vers URL invalide
# Redéployer et tester
curl https://votre-backend-url/alerts
```
- [ ] Endpoint `/alerts` fonctionne toujours
- [ ] Retourne les alertes existantes
- [ ] `triggered: false` ou erreur dans `scan_result`
- [ ] Logs montrent l'erreur mais pas de crash

### 11. Firestore indisponible/lent
- [ ] Timeouts gérés gracieusement
- [ ] Messages d'erreur appropriés
- [ ] Pas de crash de l'application

### 12. Paramètres invalides
```bash
curl "https://votre-backend-url/alerts?sync=invalid"
curl "https://votre-backend-url/alerts?ttl_override=abc"
```
- [ ] Paramètres invalides ignorés ou valeurs par défaut utilisées
- [ ] Pas d'erreurs 500
- [ ] Comportement prévisible

---

## 📈 Tests de performance

### 13. Temps de réponse
- [ ] Mode background: < 2 secondes
- [ ] Mode sync: < 30 secondes (selon timeout)
- [ ] Health check: < 500ms

### 14. Gestion de la charge
- [ ] Multiple requests simultanées gérées
- [ ] Pas de memory leaks évidents
- [ ] CPU/Memory usage raisonnable

---

## 🔍 Validation des logs

### 15. Logs informatifs
```bash
gcloud run logs tail alert-backend --region europe-west1
```
- [ ] Démarrages d'application visibles
- [ ] Messages "triggered scan" / "skipped trigger" clairs
- [ ] Erreurs réseau loggées avec détails
- [ ] Pas de spam de logs

### 16. Structured logging (bonus)
- [ ] Logs au format JSON (si implémenté)
- [ ] Niveaux de log appropriés (INFO, ERROR, WARNING)
- [ ] Context des requêtes dans les logs

---

## 🔐 Tests de sécurité

### 17. Authentification
- [ ] ID tokens générés correctement
- [ ] Headers `Authorization` bien formés
- [ ] Pas d'erreurs 401/403 dans communication avec alert-engine

### 18. Endpoints sécurisés
- [ ] Pas d'exposition de secrets dans réponses
- [ ] Gestion appropriée des erreurs d'auth
- [ ] Pas de leakage d'informations sensibles

---

## 🎯 Critères d'acceptation finaux

### Fonctionnalité core
- [ ] ✅ `GET /alerts` retourne <= `MAX_ALERTS` alertes
- [ ] ✅ Flag `triggered` correct selon TTL
- [ ] ✅ `last_refresh_ts` mis à jour quand trigger lancé
- [ ] ✅ alert-engine invoqué (visible dans logs Cloud Run)
- [ ] ✅ Pas de doublons pour même `alert_id` après relances

### Performance et UX
- [ ] ✅ Mode background non-bloquant pour UX fluide
- [ ] ✅ Mode sync disponible quand nécessaire
- [ ] ✅ TTL respecté pour éviter spam d'appels

### Robustesse et monitoring
- [ ] ✅ Gestion gracieuse des erreurs alert-engine
- [ ] ✅ Logs clairs pour debugging
- [ ] ✅ Métriques observables (via logs Cloud Run)

---

## 📋 Checklist de déploiement production

### Avant déploiement
- [ ] Tests de validation passés
- [ ] Variables d'environnement vérifiées
- [ ] Permissions IAM configurées
- [ ] alert-engine accessible et testé

### Après déploiement
- [ ] Health check fonctionne
- [ ] Tests API complets réussis
- [ ] Logs Cloud Run accessibles
- [ ] Métriques de performance satisfaisantes
- [ ] Documentation à jour

### Monitoring continu
- [ ] Alertes configurées sur erreurs
- [ ] Monitoring des performances
- [ ] Revue régulière des logs
- [ ] Backup/restore Firestore testé

---

## 🏁 Validation finale

**Date:** ___________  
**Validé par:** ___________  
**Environnement:** ___________  
**URL Backend:** ___________  
**URL alert-engine:** ___________  

**Notes additionnelles:**
```
```

**Prêt pour production:** ☐ OUI ☐ NON

**Points restants à adresser (si NON):**
- [ ] 
- [ ] 
- [ ]