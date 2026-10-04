# Deployment Guide: Kenya Crop Health Management Platform

## 1. Local Development (Windows / Linux / macOS)
The system requires only Python 3.11+. By default, it uses SQLite for a zero-config setup.

```cmd
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the application
python run.py
```
Visit `http://localhost:8000` (or `http://127.0.0.1:8000`).

---

## 2. Production Deployment (PostgreSQL + Gunicorn/Uvicorn)

### A. Environment Configuration (`.env`)
```bash
DATABASE_URL=postgresql://crop_admin:StrongPassword@localhost:5432/crophealth_prod
SECRET_KEY=generate_with_openssl_rand_hex_32
MODEL_PATH=artifacts/best_model.pt
UPLOAD_DIR=/var/data/crophealth/uploads
MAX_UPLOAD_SIZE_MB=10
DEFAULT_LANGUAGE=en
DEBUG=false
```

### B. Systemd Service Unit (`/etc/systemd/system/crophealth.service`)
```ini
[Unit]
Description=Kenya Crop Health Platform FastAPI Service
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/crop-health-ai
EnvironmentFile=/var/www/crop-health-ai/.env
ExecStart=/var/www/crop-health-ai/.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers
Restart=always

[Install]
WantedBy=multi-user.target
```

### C. Nginx Reverse Proxy Configuration
```nginx
server {
    listen 80;
    server_name crophealth.kenya.example;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crophealth.kenya.example;

    ssl_certificate /etc/letsencrypt/live/crophealth.kenya.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crophealth.kenya.example/privkey.pem;

    client_max_body_size 12M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 3. Docker Deployment
```bash
docker compose up -d --build
```
Ensure `artifacts/best_model.pt` is mounted into the container volume.
