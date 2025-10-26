import os
import datetime
import requests
from flask import Flask, request, jsonify
from google.cloud import firestore
import google.auth.transport.requests
import google.oauth2.id_token

app = Flask(__name__)
db = firestore.Client()

# --- URLs de vos agents (à remplir) ---
# Assurez-vous d'utiliser les URL des services Cloud Run/Function
AGENT_FISCAL_URL = os.environ.get("https://us-west1-agent-gcp-f6005.cloudfunctions.net/agent-fiscal-v2")  # Ex: https://agent-fiscal-....run.app
SAAS_API_URL = os.environ.get("https://saas-integrations-api-478570587937.us-west1.run.app")  # Ex: https://saas-integrations-api-....run.app


def get_auth_token(url: str) -> str:
    """Obtient un token d'identité pour appeler un service GCP sécurisé."""
    auth_req = google.auth.transport.requests.Request()
    id_token = google.oauth2.id_token.fetch_id_token(auth_req, url)
    return id_token


def get_user_id_from_auth_header():
    """
    Simule la récupération de l'ID utilisateur à partir du token d'authentification.
    Dans une vraie app, vous décoderiez le token JWT (ex: Firebase Auth).
    """
    # TODO: À remplacer par votre vraie logique d'authentification
    return "test_user"


@app.route("/demarches", methods=["POST"])
def creer_demarche():
    """
    Point d'entrée : Crée une nouvelle déclaration.
    Exemple Body: { "type": "declaration_tva" }
    """
    user_id = get_user_id_from_auth_header()
    data = request.get_json()
    demarche_type = data.get("type")

    if not demarche_type:
        return jsonify({"error": "Type de démarche manquant"}), 400

    # Créer le document dans Firestore
    doc_ref = db.collection("declarations").document()
    demarche_id = doc_ref.id

    new_demarche = {
        "id": demarche_id,
        "userId": user_id,
        "companyId": "demo_company",  # TODO: Récupérer du profil
        "type": demarche_type,
        "status": "en_cours",
        "etape_actuelle": "perimetre",  # La 1ère étape de votre maquette
        "cree_le": datetime.datetime.now(datetime.timezone.utc),
        "data": {}
    }

    doc_ref.set(new_demarche)

    return jsonify(new_demarche), 201


@app.route("/demarches/<declaration_id>/etape/donnees", methods=["POST"])
def etape_donnees_tva(declaration_id):
    """
    Étape 2 : Récupère les données SaaS et appelle l'agent fiscal pour le calcul.
    Body: { "periode": "Octobre 2025", "regime": "reel_normal" }
    """
    user_id = get_user_id_from_auth_header()

    # 1. Charger la démarche depuis Firestore (et vérifier les droits)
    doc_ref = db.collection("declarations").document(declaration_id)
    demarche = doc_ref.get().to_dict()

    if not demarche or demarche.get("userId") != user_id:
        return jsonify({"error": "Démarche non trouvée ou non autorisée"}), 404

    # 2. Mettre à jour avec les données de l'étape "Périmètre"
    perimetre_data = request.get_json()
    demarche["data"].update(perimetre_data)

    # 3. Appeler l'API SaaS pour les données brutes
    try:
        print(f"Appel de saas-integrations-api pour les données de TVA...")
        saas_token = get_auth_token(SAAS_API_URL)
        saas_response = requests.get(
            f"{SAAS_API_URL}/data",
            headers={"Authorization": f"Bearer {saas_token}"},
            params={"type": "tva", "periode": perimetre_data.get("periode"), "userId": user_id}
        )
        saas_response.raise_for_status()  # Lève une exception si 4xx/5xx
        donnees_brutes = saas_response.json()  # Ex: { "ventes": [...], "achats": [...] }

    except Exception as e:
        print(f"Erreur appel SAAS API: {e}")
        return jsonify({"error": "Impossible de récupérer les données Odoo/SaaS"}), 500

    # 4. Appeler l'Agent Fiscal pour le calcul
    try:
        print(f"Appel de agent-fiscal pour la tâche 'calculate_tva'...")
        fiscal_token = get_auth_token(AGENT_FISCAL_URL)
        fiscal_response = requests.post(
            f"{AGENT_FISCAL_URL}/query",
            headers={"Authorization": f"Bearer {fiscal_token}"},
            json={
                "task": "calculate_tva",
                "raw_data": donnees_brutes
            }
        )
        fiscal_response.raise_for_status()
        calculs_tva = fiscal_response.json()  # Ex: { "tva_collectee": 12450, ... }

    except Exception as e:
        print(f"Erreur appel AGENT FISCAL: {e}")
        return jsonify({"error": "L'agent fiscal n'a pas pu calculer la TVA"}), 500

    # 5. Sauvegarder et renvoyer
    demarche["data"].update(calculs_tva)
    demarche["etape_actuelle"] = "donnees"  # Mettre à jour l'étape
    doc_ref.set(demarche)

    return jsonify(demarche), 200


@app.route("/demarches/<declaration_id>/etape/verifications", methods=["POST"])
def etape_verifications_tva(declaration_id):
    """
    Étape 3 : Appelle l'agent fiscal pour les vérifications IA.
    """
    user_id = get_user_id_from_auth_header()
    doc_ref = db.collection("declarations").document(declaration_id)
    demarche = doc_ref.get().to_dict()

    if not demarche or demarche.get("userId") != user_id:
        return jsonify({"error": "Démarche non trouvée ou non autorisée"}), 404

    # TODO: Récupérer les données historiques (TVA du mois précédent)
    donnees_historiques = {"tva_collectee_prev": 10500}  # Données factices

    # 1. Appeler l'Agent Fiscal pour la vérification
    try:
        print(f"Appel de agent-fiscal pour la tâche 'verify_tva'...")
        fiscal_token = get_auth_token(AGENT_FISCAL_URL)
        fiscal_response = requests.post(
            f"{AGENT_FISCAL_URL}/query",
            headers={"Authorization": f"Bearer {fiscal_token}"},
            json={
                "task": "verify_tva",
                "current_data": demarche.get("data"),
                "historical_data": donnees_historiques
            }
        )
        fiscal_response.raise_for_status()
        verifications_ia = fiscal_response.json()  # Ex: { "verifications": [...] }

    except Exception as e:
        print(f"Erreur appel AGENT FISCAL (verify): {e}")
        return jsonify({"error": "L'agent fiscal n'a pas pu vérifier les données"}), 500

    # 2. Sauvegarder et renvoyer
    demarche["data"].update(verifications_ia)
    demarche["etape_actuelle"] = "verifications"
    doc_ref.set(demarche)

    return jsonify(demarche), 200


# (Ajoutez ici les endpoints pour /etape/pieces et /etape/validation)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))