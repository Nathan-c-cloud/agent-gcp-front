"""
Template pour un nouveau module
Copiez ce fichier et remplacez 'template' par le nom de votre module
"""

from flask import Blueprint, request, jsonify
import logging
import os

# Créer le blueprint pour votre module
# Remplacez 'template' par le nom de votre module (ex: settings, procedures, watch)
template_bp = Blueprint('template', __name__)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION MODULE (adaptez selon vos besoins)
# ============================================================================

# Variables d'environnement spécifiques à votre module
YOUR_CONFIG_VAR = os.getenv('YOUR_CONFIG_VAR', 'default_value')

# ============================================================================
# FONCTIONS UTILITAIRES (si nécessaire)
# ============================================================================

def your_helper_function():
    """Fonction utilitaire pour votre module"""
    pass

# ============================================================================
# ENDPOINTS DE VOTRE MODULE
# ============================================================================

@template_bp.route('/', methods=['GET'])
def get_main():
    """Endpoint principal de votre module"""
    try:
        # Votre logique ici
        return jsonify({
            "message": "Module template opérationnel",
            "status": "success",
            "data": {}
        })
    except Exception as e:
        logger.error(f"Erreur dans /{template_bp.name}: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@template_bp.route('/health', methods=['GET'])
def template_health():
    """Health check spécifique à votre module"""
    return jsonify({
        "module": "template",
        "status": "healthy",
        "timestamp": int(__import__('time').time()),
        "configuration": {
            "config_var": YOUR_CONFIG_VAR is not None
        }
    })

@template_bp.route('/config', methods=['GET'])
def template_config():
    """Configuration actuelle de votre module"""
    return jsonify({
        "module": "template", 
        "version": "1.0.0",
        "settings": {
            "your_config_var": YOUR_CONFIG_VAR
        }
    })

# Ajoutez d'autres endpoints selon vos besoins :
# @template_bp.route('/list', methods=['GET'])
# @template_bp.route('/create', methods=['POST']) 
# @template_bp.route('/update/<id>', methods=['PUT'])
# @template_bp.route('/delete/<id>', methods=['DELETE'])

# ============================================================================
# INSTRUCTIONS POUR INTÉGRER VOTRE MODULE
# ============================================================================

"""
1. Copiez ce fichier vers modules/votre_module.py
2. Remplacez 'template' par le nom de votre module partout
3. Implémentez vos endpoints
4. Dans app_generalist.py, ajoutez :
   
   from modules.votre_module import votre_module_bp
   app.register_blueprint(votre_module_bp, url_prefix='/votre_module')
   
5. Testez avec :
   curl http://localhost:8080/votre_module/
   curl http://localhost:8080/votre_module/health
"""