# Architecture

Browser/mobile camera → FastAPI upload endpoint → image validation → calibrated PyTorch classifier → uncertainty gate → severity heuristic + Grad-CAM → source-backed recommendation engine → JSON response/UI.

## Components
- `frontend/`: responsive HTML/CSS/JS, camera-capable file input
- `backend/`: FastAPI and recommendation engine
- `ml/data/`: class definitions and dataset loading
- `ml/preprocessing/`: augmentation and quality checks
- `ml/models/`: backbone factory
- `ml/training/`: shared training helpers
- `ml/evaluation/`: metrics, temperature scaling, threshold selection
- `ml/inference/`: prediction, Grad-CAM, severity
- `knowledge_base/`: recommendations and language strings
- `scripts/`: download, prepare, train, evaluate, tests
- `artifacts/`: generated model and metrics

No farmer images are persisted by the application. A database can be added later for opt-in case history; omitting one now reduces privacy and operational complexity.
