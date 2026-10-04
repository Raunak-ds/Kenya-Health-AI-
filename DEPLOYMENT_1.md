# Deployment

## Local
`python run.py` and open port 8000.

## Docker
```bash
docker compose up --build
```
Mount or copy a trained `artifacts/best_model.pt` into the deployment.

## Production notes
Use HTTPS, a reverse proxy, upload size limits, request rate limiting, health checks, and a GPU only if throughput requires it. Do not retain uploaded farm images without explicit consent and a privacy policy. Validate the model on Kenyan field data before production claims.
