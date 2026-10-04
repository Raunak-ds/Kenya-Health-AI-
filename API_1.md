# API

## GET `/health`
Returns application status and whether a trained model is present.

## POST `/api/analyze`
Multipart form fields:
- `file`: JPEG, PNG, or WebP; max 10 MB
- `crop`: optional `tomato`, `maize`, or `potato`
- `lang`: `en` or `sw`

Statuses in JSON:
- `ok`: confident supported prediction
- `uncertain`: confidence/entropy rejection
- `invalid_image`: quality rejection
- `model_missing`: training has not produced `artifacts/best_model.pt`

An `ok` response includes confidence, calibrated threshold, severity heuristic, top-3 probabilities, Grad-CAM data URI, and recommendation/source data.
