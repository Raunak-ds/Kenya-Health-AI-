# Evaluation

Run:
```bash
python scripts/evaluate.py
```

The evaluator reports actual held-out test:
- Accuracy
- Macro precision
- Macro recall / sensitivity
- Macro specificity
- Macro F1
- Per-class precision, sensitivity, specificity, F1, FPR, FNR, support
- Confusion matrix
- Confidence-threshold coverage and accepted accuracy
- Mean inference milliseconds per image on the current device

## Results status in this packaged source
A full PlantVillage training run was **not executed during source packaging**, so this repository intentionally contains no fabricated accuracy number. After the user runs training/evaluation, the authoritative measured values are written to `artifacts/test_metrics.json` and plots to `artifacts/`.

A 90% target is a goal, not a guarantee. If a run falls below it, preserve the result and inspect `model_selection.json`, per-class metrics, confusion matrix, class imbalance, and field-domain gap before changing augmentation, class weighting, backbone, or data.
