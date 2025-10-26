"""
Backend généraliste pour Agent GCP Frontend
Chaque module gère sa partie spécifique
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging

# Import des modules spécialisés
from modules.alerts import alerts_bp
# from modules.settings import settings_bp  # À ajouter par l'ami qui fait settings
# from modules.procedures import procedures_bp  # À ajouter par l'ami qui fait procedures
# from modules.watch import watch_bp  # À ajouter par l'ami qui fait watch

app = Flask(__name__)
CORS(app)

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration générale
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# ============================================================================
# ROUTES GÉNÉRALES (communes à tous les modules)
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check global de l'API"""
    return jsonify({
        "status": "healthy",
        "timestamp": int(__import__('time').time()),
        "modules": {
            "alerts": "active",
            "settings": "pending",  # À changer quand le module sera ajouté
            "procedures": "pending",
            "watch": "pending"
        }
    })

@app.route('/', methods=['GET'])
def api_info():
    """Information sur l'API disponible"""
    return jsonify({
        "name": "Agent GCP Backend API",
        "version": "1.0.0",
        "endpoints": {
            "/health": "Health check global",
            "/alerts/*": "Module des alertes (actif)",
            "/settings/*": "Module des paramètres (à venir)",
            "/procedures/*": "Module des démarches (à venir)", 
            "/watch/*": "Module de veille (à venir)"
        },
        "documentation": "Voir README.md pour les détails"
    })

# ============================================================================
# ENREGISTREMENT DES MODULES (blueprints)
# ============================================================================

# Module Alertes (déjà implémenté)
app.register_blueprint(alerts_bp, url_prefix='/alerts')

# Modules à ajouter par les autres développeurs :
# app.register_blueprint(settings_bp, url_prefix='/settings')
# app.register_blueprint(procedures_bp, url_prefix='/procedures')  
# app.register_blueprint(watch_bp, url_prefix='/watch')

# ============================================================================
# GESTION D'ERREURS GLOBALE
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint non trouvé",
        "message": "Vérifiez l'URL et le module demandé",
        "available_endpoints": ["/health", "/alerts"]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Erreur interne: {error}")
    return jsonify({
        "error": "Erreur interne du serveur",
        "message": "Consultez les logs pour plus de détails"
    }), 500

# ============================================================================
# DÉMARRAGE DE L'APPLICATION
# ============================================================================

if __name__ == '__main__':
    # Variables d'environnement communes
    port = int(os.getenv('PORT', 8080))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    
    logger.info("🚀 Démarrage du Backend Agent GCP")
    logger.info("=" * 50)
    logger.info(f"Mode: {'Debug' if debug else 'Production'}")
    logger.info(f"Port: {port}")
    logger.info("Modules actifs:")
    logger.info("  ✅ /alerts - Système d'alertes")
    logger.info("  ⏳ /settings - À implémenter")
    logger.info("  ⏳ /procedures - À implémenter")
    logger.info("  ⏳ /watch - À implémenter")
    logger.info("=" * 50)
    
    app.run(host='0.0.0.0', port=port, debug=debug)