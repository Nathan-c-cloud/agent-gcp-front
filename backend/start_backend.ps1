# Script de démarrage du backend Flask pour PowerShell
# Usage: .\start_backend.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Demarrage Backend Agent GCP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "app.py")) {
    Write-Host "ERREUR: app.py non trouve" -ForegroundColor Red
    Write-Host "Veuillez executer ce script depuis le dossier backend" -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Configuration des variables d'environnement
Write-Host "Configuration des variables d'environnement..." -ForegroundColor Yellow
$env:GCP_PROJECT = "agent-gcp-f6005"
$env:AGENT_FISCAL_URL = "https://us-west1-agent-gcp-f6005.cloudfunctions.net/agent-fiscal-v2"
$env:ALERT_ENGINE_URL = "https://us-west1-agent-gcp-f6005.cloudfunctions.net/alert-engine"
$env:PORT = "8080"
$env:FLASK_DEBUG = "false"
$env:ALERT_REFRESH_TTL = "300"

Write-Host ""
Write-Host "Variables configurees:" -ForegroundColor Green
Write-Host "  - GCP_PROJECT: $env:GCP_PROJECT"
Write-Host "  - PORT: $env:PORT"
Write-Host ""

# Vérifier l'authentification GCP (non bloquant)
Write-Host "Verification de l'authentification GCP..." -ForegroundColor Yellow
try {
    $null = gcloud auth application-default print-access-token 2>$null
    Write-Host "  [OK] Authentification GCP active" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] Authentification GCP non detectee" -ForegroundColor Yellow
    Write-Host "  Si necessaire: gcloud auth application-default login" -ForegroundColor Yellow
}
Write-Host ""

# Démarrer le serveur
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Demarrage du serveur Flask" -ForegroundColor Cyan
Write-Host "  Port: $env:PORT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Lancer Python
try {
    python app.py
} catch {
    Write-Host ""
    Write-Host "ERREUR lors du demarrage:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

Write-Host ""
Read-Host "Appuyez sur Entree pour quitter"

