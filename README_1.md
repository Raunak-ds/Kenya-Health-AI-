# Crop Health AI — Kenya-focused disease screening

End-to-end computer-vision project for tomato, maize and potato leaf screening. It downloads a real public dataset, prepares leakage-aware splits, compares three transfer-learning backbones, calibrates confidence, selects an uncertainty threshold on validation data, evaluates once on the held-out test set, and serves a mobile-friendly FastAPI application with Grad-CAM and source-backed recommendations.

## Supported classes
- Maize: Gray Leaf Spot, Common Rust, Northern Leaf Blight, Healthy
- Potato: Early Blight, Late Blight, Healthy
- Tomato: Bacterial Spot, Early Blight, Late Blight, Healthy

Unknown/uncertain is an explicit inference outcome; it is not a trained disease class.

## Requirements
Python 3.11 recommended. A GPU is strongly recommended for full training but CPU works.

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

## 1) Dataset setup
```bash
python scripts/download_dataset.py
python scripts/prepare_dataset.py
```
The training command also performs these automatically if data is missing.

## 2) Train
```bash
python scripts/train.py
```
This compares MobileNetV3-Small, ResNet-18 and EfficientNet-B0 using validation macro recall, then retrains the selected backbone, fits temperature scaling, and chooses a confidence threshold on the validation set. Outputs go to `artifacts/`.

## 3) Evaluate
```bash
python scripts/evaluate.py
```
Creates `artifacts/test_metrics.json`, `confusion_matrix.png`, and `training_curves.png`. The held-out test set is not used for model selection or threshold tuning.

## 4) Run
```bash
python run.py
```
Open `http://localhost:8000`.

## 5) Test
```bash
pytest -q
```

## Important safety/validity notes
- This is decision support, not a laboratory diagnosis.
- PlantVillage is largely controlled-background imagery; field generalization must be validated before production use.
- Severity is a project-defined image heuristic because the training dataset has no validated severity labels.
- Chemical dosage is intentionally absent. Recommendations point users toward IPM and label/local-extension guidance.
- No accuracy is hard-coded. Test metrics only appear after the actual train/evaluate commands run.

See `DATASET.md`, `MODEL.md`, `EVALUATION.md`, `ARCHITECTURE.md`, `API.md`, `DEPLOYMENT.md`, and `LIMITATIONS.md`.
