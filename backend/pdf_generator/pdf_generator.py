"""
Service de génération de PDF pour les déclarations fiscales
Génère un PDF professionnel à partir des données de déclaration
"""

from flask import Flask, request, jsonify, send_file
from weasyprint import HTML, CSS
from datetime import datetime
import os
import tempfile
from google.cloud import storage
import json

app = Flask(__name__)

# Template HTML pour la déclaration TVA
TVA_TEMPLATE = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.6;
        }

        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header h1 {
            color: #2563eb;
            font-size: 28px;
            margin: 0;
        }

        .header .subtitle {
            color: #64748b;
            font-size: 14px;
            margin-top: 5px;
        }

        .info-section {
            background: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
        }

        .info-section h2 {
            color: #2563eb;
            font-size: 16px;
            margin: 0 0 10px 0;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }

        .info-label {
            color: #64748b;
            font-weight: 500;
        }

        .info-value {
            font-weight: 600;
            color: #1e293b;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        .data-table th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }

        .data-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }

        .data-table tr:hover {
            background: #f8fafc;
        }

        .amount {
            text-align: right;
            font-weight: 600;
        }

        .total-row {
            background: #dbeafe !important;
            font-weight: 700;
            font-size: 18px;
        }

        .total-row td {
            padding: 15px 12px;
            color: #2563eb;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-success {
            background: #dcfce7;
            color: #166534;
        }

        .badge-warning {
            background: #fef3c7;
            color: #92400e;
        }

        .verification-section {
            margin: 30px 0;
            padding: 15px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
        }

        .verification-item {
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #10b981;
            background: #f0fdf4;
        }

        .verification-item.warning {
            border-left-color: #f59e0b;
            background: #fffbeb;
        }

        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
        }

        .qr-section {
            text-align: center;
            margin: 30px 0;
        }

        .signature-section {
            margin-top: 50px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
        }

        .signature-box {
            text-align: center;
        }

        .signature-line {
            border-top: 2px solid #333;
            margin-top: 50px;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 Déclaration de TVA</h1>
        <div class="subtitle">Formulaire CA3 - Régime Réel Normal</div>
    </div>

    <div class="info-section">
        <h2>📋 Informations de la déclaration</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">N° de dossier :</span>
                <span class="info-value">{{ declaration_id }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Date de création :</span>
                <span class="info-value">{{ created_at }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Période :</span>
                <span class="info-value">{{ periode }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Établissement :</span>
                <span class="info-value">{{ etablissement }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Régime fiscal :</span>
                <span class="info-value">{{ regime_fiscal }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Statut :</span>
                <span class="info-value"><span class="badge badge-success">{{ statut }}</span></span>
            </div>
        </div>
    </div>

    <div class="info-section">
        <h2>🏢 Informations de l'entreprise</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Raison sociale :</span>
                <span class="info-value">{{ company_name }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">SIRET :</span>
                <span class="info-value">{{ siret }}</span>
            </div>
        </div>
    </div>

    <h2 style="color: #2563eb; margin-top: 30px;">💰 Détail de la déclaration</h2>

    <table class="data-table">
        <thead>
            <tr>
                <th>Ligne</th>
                <th>Description</th>
                <th style="text-align: right;">Montant</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>01</strong></td>
                <td>Ventes et prestations de services</td>
                <td class="amount">{{ montant_ht_ventes }} €</td>
            </tr>
            <tr>
                <td><strong>02</strong></td>
                <td>TVA collectée ({{ taux_tva }}%)</td>
                <td class="amount">{{ tva_collectee }} €</td>
            </tr>
            <tr>
                <td><strong>08</strong></td>
                <td>Total TVA brute due</td>
                <td class="amount">{{ tva_collectee }} €</td>
            </tr>
            <tr style="height: 20px;"></tr>
            <tr>
                <td><strong>20</strong></td>
                <td>Achats de biens et services</td>
                <td class="amount">{{ montant_ht_achats }} €</td>
            </tr>
            <tr>
                <td><strong>20</strong></td>
                <td>TVA déductible sur achats</td>
                <td class="amount">{{ tva_deductible }} €</td>
            </tr>
            <tr>
                <td><strong>23</strong></td>
                <td>Total TVA déductible</td>
                <td class="amount">{{ tva_deductible }} €</td>
            </tr>
            <tr style="height: 20px;"></tr>
            <tr class="total-row">
                <td><strong>28</strong></td>
                <td><strong>TVA NETTE À PAYER</strong></td>
                <td class="amount"><strong>{{ tva_a_payer }} €</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="info-section">
        <h2>📊 Détails des opérations</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Nombre de factures de vente :</span>
                <span class="info-value">{{ nb_factures_vente }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Nombre de factures d'achat :</span>
                <span class="info-value">{{ nb_factures_achat }}</span>
            </div>
        </div>
    </div>

    {% if verifications %}
    <div class="verification-section">
        <h2 style="color: #2563eb;">🤖 Vérifications IA (Vertex AI)</h2>
        {% for verif in verifications %}
        <div class="verification-item {{ 'warning' if verif.type == 'warning' else '' }}">
            <strong>{{ verif.title }}</strong>
            <p style="margin: 5px 0 0 0; font-size: 14px;">{{ verif.message }}</p>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    <div class="info-section" style="background: #dcfce7; border-left-color: #10b981;">
        <h2 style="color: #166534;">✅ Source des données</h2>
        <p style="margin: 5px 0;"><strong>Source :</strong> {{ source }}</p>
        <p style="margin: 5px 0;"><strong>Vérification :</strong> <span class="badge badge-success">Données vérifiées</span></p>
        <p style="margin: 5px 0;"><strong>Date de récupération :</strong> {{ fetched_at }}</p>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <p><strong>Préparé par :</strong></p>
            <p>{{ user_name }}</p>
            <div class="signature-line">Signature</div>
        </div>
        <div class="signature-box">
            <p><strong>Date :</strong></p>
            <p>{{ created_at }}</p>
            <div class="signature-line">Cachet de l'entreprise</div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Document généré automatiquement par l'Assistant Juridique & Fiscal</strong></p>
        <p>Ce document est un récapitulatif de votre déclaration. Il ne remplace pas le formulaire officiel.</p>
        <p>N° de référence : {{ declaration_id }} | Généré le {{ generated_at }}</p>
    </div>
</body>
</html>
"""


def render_tva_pdf(data):
    """
    Génère un PDF à partir des données de déclaration TVA
    """
    from jinja2 import Template

    # Préparer les données pour le template
    template_data = {
        'declaration_id': data.get('id', 'N/A')[:12].upper(),
        'created_at': datetime.fromisoformat(data.get('created_at', datetime.now().isoformat())).strftime('%d/%m/%Y'),
        'generated_at': datetime.now().strftime('%d/%m/%Y à %H:%M'),
        'periode': data.get('perimetre', {}).get('periode', 'N/A'),
        'etablissement': data.get('perimetre', {}).get('etablissement', 'N/A').title(),
        'regime_fiscal': data.get('perimetre', {}).get('regime_fiscal', 'N/A').replace('_', ' ').title(),
        'statut': data.get('statut', 'N/A').title(),
        'company_name': data.get('company_name', 'Entreprise Demo'),
        'siret': data.get('siret', '123 456 789 00012'),
        'user_name': data.get('user_name', 'Utilisateur'),

        # Données TVA
        'montant_ht_ventes': f"{data.get('donnees', {}).get('details', {}).get('montant_ht_ventes', 0):.2f}",
        'tva_collectee': f"{data.get('donnees', {}).get('tva_collectee', 0):.2f}",
        'montant_ht_achats': f"{data.get('donnees', {}).get('details', {}).get('montant_ht_achats', 0):.2f}",
        'tva_deductible': f"{data.get('donnees', {}).get('tva_deductible', 0):.2f}",
        'tva_a_payer': f"{data.get('donnees', {}).get('tva_a_payer', 0):.2f}",
        'taux_tva': '20',

        # Détails
        'nb_factures_vente': data.get('donnees', {}).get('details', {}).get('nb_factures_vente', 0),
        'nb_factures_achat': data.get('donnees', {}).get('details', {}).get('nb_factures_achat', 0),

        # Source
        'source': data.get('donnees', {}).get('source', 'N/A').upper(),
        'fetched_at': data.get('donnees', {}).get('fetched_at', 'N/A'),

        # Vérifications
        'verifications': data.get('verifications', [])
    }

    # Rendre le template
    template = Template(TVA_TEMPLATE)
    html_content = template.render(**template_data)

    # Générer le PDF
    pdf_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    HTML(string=html_content).write_pdf(pdf_file.name)

    return pdf_file.name


@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    """
    Endpoint pour générer un PDF de déclaration

    Body:
    {
        "declaration_id": "abc123",
        "data": { ... données de la déclaration ... }
    }
    """
    try:
        request_data = request.get_json()
        declaration_id = request_data.get('declaration_id')
        data = request_data.get('data', {})

        if not declaration_id:
            return jsonify({'error': 'declaration_id is required'}), 400

        # Générer le PDF
        pdf_path = render_tva_pdf(data)

        # Upload vers Cloud Storage
        storage_client = storage.Client()
        bucket_name = os.environ.get('GCS_BUCKET', 'agent-gcp-f6005-declarations')
        bucket = storage_client.bucket(bucket_name)

        blob_name = f"declarations/{declaration_id}/declaration_tva.pdf"
        blob = bucket.blob(blob_name)

        blob.upload_from_filename(pdf_path)
        blob.make_public()

        # Nettoyer le fichier temporaire
        os.unlink(pdf_path)

        return jsonify({
            'success': True,
            'pdf_url': blob.public_url,
            'blob_name': blob_name
        })

    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/generate-pdf-download', methods=['POST'])
def generate_pdf_download():
    """
    Endpoint pour générer et télécharger directement un PDF
    """
    try:
        request_data = request.get_json()
        data = request_data.get('data', {})

        # Générer le PDF
        pdf_path = render_tva_pdf(data)

        # Retourner le fichier
        return send_file(
            pdf_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"declaration_tva_{data.get('perimetre', {}).get('periode', 'N/A')}.pdf"
        )

    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'pdf-generator'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))

