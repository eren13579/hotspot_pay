FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8444

# Le port est lu depuis la variable d'environnement PORT (défaut: 8444)
# Utilise le port du settings.py si pas de variable d'env, ou 8444 en fallback
CMD python -c "import os; port = os.getenv('PORT', '8444'); import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=int(port), log_level='info')"
