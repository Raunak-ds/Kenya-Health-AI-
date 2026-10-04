# Model Provenance & Benchmark Architecture

## 1. Active Trained Model
- **Architecture:** EfficientNet-B0 (`artifacts/best_model.pt`, ~16.4 MB)
- **Input Resolution:** 224 × 224 pixels (RGB, ImageNet normalized)
- **Classes:** 11 categories covering Maize, Irish Potato, and Tomato (4 maize, 3 potato, 4 tomato classes)
- **Training Source Distribution:** PlantVillage-derived curated dataset (`data/plantvillage_selected`)
- **Temperature Scaling Parameter:** $T = 0.6887$
- **Confidence Decision Threshold:** $\tau = 0.70$
- **Entropy Rejection Threshold:** $H_{\text{norm}} \le 0.78$

---

## 2. Held-Out Evaluation Benchmark
The following metrics are derived strictly from the evaluated held-out test split (2,533 test images) recorded in `artifacts/test_metrics.json`:

| Metric | Score | Notes |
| :--- | :--- | :--- |
| **Overall Test Accuracy** | **99.05%** | Evaluated on held-out test distribution |
| **Accepted Prediction Accuracy** | **99.25%** | Accuracy for predictions passing confidence threshold |
| **Coverage at Threshold (0.70)** | **99.53%** | Fraction of test images accepted by uncertainty gate |
| **Macro Precision** | **98.69%** | Unweighted average across 11 classes |
| **Macro Recall / Sensitivity** | **98.54%** | Unweighted average across 11 classes |
| **Macro Specificity** | **99.90%** | Average true negative rate |
| **Macro F1 Score** | **98.60%** | Harmonic mean of precision and recall |
| **Inference Latency** | **~2.4 ms / image** | Measured on CPU/GPU hardware |

### Per-Class Test Performance
- **Maize Common Rust:** Precision 100%, Recall 100%, F1 1.00
- **Maize Gray Leaf Spot:** Precision 100%, Recall 94.17%, F1 0.97
- **Maize Northern Leaf Blight:** Precision 97.04%, Recall 100%, F1 0.985
- **Maize Healthy:** Precision 100%, Recall 100%, F1 1.00
- **Potato Early Blight:** Precision 100%, Recall 100%, F1 1.00
- **Potato Late Blight:** Precision 97.98%, Recall 97.00%, F1 0.975
- **Potato Healthy:** Precision 93.94%, Recall 96.88%, F1 0.954
- **Tomato Bacterial Spot:** Precision 99.76%, Recall 100%, F1 0.999
- **Tomato Early Blight:** Precision 99.49%, Recall 97.50%, F1 0.985
- **Tomato Late Blight:** Precision 97.66%, Recall 98.43%, F1 0.980
- **Tomato Healthy:** Precision 99.69%, Recall 100%, F1 0.998

---

## 3. Generalization & The "Kenyan Farm" Reality
> [!IMPORTANT]
> The **99.05% accuracy metric is strictly from the held-out PlantVillage-derived test distribution**. 
> It **must NOT** be advertised as *"99% accurate on Kenyan farms"*.

Real Kenyan smallholder fields present out-of-distribution factors not present in laboratory benchmarks:
1. Multi-pathogen co-infections (e.g. Early Blight + Septoria or Bacterial Spot).
2. Complex non-leaf backgrounds (red laterite soil, weeds, intercropped beans, fingers/hands).
3. Extreme lighting variations (equatorial noon sun vs morning highland mist).
4. Camera variations across low-cost feature smartphones.

To address this honestly, the platform integrates:
- Pre-inference image quality and blur rejection.
- Dual uncertainty filtering (temperature-scaled confidence + normalized entropy).
- Extension officer ground-truth verification workflow.
- Verified dataset collection and export for future localized retraining.
