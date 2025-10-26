FROM python:3.11-slim

WORKDIR /app

# Copier les requirements et installer les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY app.py .

# Exposer le port
EXPOSE 8080

# Variables d'environnement par défaut
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Commande de démarrage
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app