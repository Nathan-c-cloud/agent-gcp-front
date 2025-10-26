# Modules Backend Agent GCP

Ce dossier contient les modules spécialisés du backend.

## Structure

- `alerts.py` - Module de gestion des alertes (Firestore + Alert-engine)
- `settings.py` - Module des paramètres utilisateur (à implémenter)
- `procedures.py` - Module de gestion des démarches (à implémenter)
- `watch.py` - Module de veille réglementaire (à implémenter)

## Comment ajouter un nouveau module

1. **Créer le fichier** `modules/votre_module.py`

```python
from flask import Blueprint, request, jsonify
import logging

# Créer le blueprint
votre_module_bp = Blueprint('votre_module', __name__)
logger = logging.getLogger(__name__)

@votre_module_bp.route('/', methods=['GET'])
def get_data():
    """Endpoint principal de votre module"""
    return jsonify({"message": "Votre module fonctionne !"})

@votre_module_bp.route('/test', methods=['GET'])
def test_endpoint():
    """Endpoint de test"""
    return jsonify({"status": "ok"})
```

2. **L'importer dans `app_generalist.py`**

```python
from modules.votre_module import votre_module_bp
app.register_blueprint(votre_module_bp, url_prefix='/votre_module')
```

3. **Tester**

```bash
curl http://localhost:8080/votre_module/
curl http://localhost:8080/votre_module/test
```

## Bonnes pratiques

- ✅ Utilisez des blueprints Flask
- ✅ Préfixez vos routes avec le nom du module  
- ✅ Gérez vos erreurs localement dans le module
- ✅ Utilisez le logger pour le debugging
- ✅ Documentez vos endpoints
- ✅ Testez avant de commit

## Modules disponibles

- ✅ **alerts** - Prêt et fonctionnel
- ⏳ **settings** - À implémenter
- ⏳ **procedures** - À implémenter  
- ⏳ **watch** - À implémenter