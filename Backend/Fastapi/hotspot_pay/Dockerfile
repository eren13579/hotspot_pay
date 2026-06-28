FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8444

CMD ["python", "-c", "\
import os; \
port = os.getenv('PORT', '8444'); \
import uvicorn; \
uvicorn.run('app.main:app', host='0.0.0.0', port=int(port), log_level='info')"]
