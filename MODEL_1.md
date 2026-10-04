# Model and training

## Candidate backbones
`train.py` compares:
1. MobileNetV3-Small
2. ResNet-18
3. EfficientNet-B0

All use ImageNet transfer learning. Selection is based on validation macro recall/sensitivity, not the test set. This keeps the architecture decision empirical for the actual machine/run instead of claiming one backbone is universally best.

## Augmentation
Random resized crop, horizontal flip, ±15° rotation, modest brightness/contrast/saturation/hue jitter, then ImageNet normalization.

## Optimization
AdamW, label smoothing, early stopping. Key values live in `config.yaml`.

## Uncertainty and calibration
After final training, validation logits are temperature-scaled. A confidence threshold is searched on the validation set to favor high accepted-sample accuracy/sensitivity while controlling false accepts. Inference also uses normalized entropy as a second rejection signal. Low-confidence cases return `Unable to confidently identify this condition.`

## Image quality gate
Images are rejected for low resolution, extreme darkness, strong blur, or insufficient visible plant-like tissue. This is a conservative pre-check, not a botanical leaf detector.

## Explainability
Grad-CAM is generated from the last convolutional feature block and returned as an overlay. It indicates influential image regions; it does not prove causal disease evidence.

## Severity
Because PlantVillage has no validated severity labels, severity is not learned. `severity.py` estimates a leaf-tissue mask in HSV and measures non-green tissue fraction. Thresholds are project-defined: up to 10% Mild, 10–25% Moderate, >25% Severe. The UI labels this explicitly as unvalidated.
