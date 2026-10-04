# Judge presentation outline
1. Farmer problem: delayed access to crop-disease expertise.
2. Scope: tomato, maize, potato; 7 diseases + healthy conditions.
3. Data: PlantVillage benchmark; PlantDoc as optional field/OOD validation.
4. Leakage control: leaf-group-aware splitting and untouched held-out test.
5. Model selection: MobileNetV3 vs ResNet18 vs EfficientNet-B0 by validation macro recall.
6. Safety: calibrated uncertainty, entropy rejection, image-quality gate.
7. Explainability: Grad-CAM.
8. Severity: transparent heuristic, explicitly not validated.
9. Kenya focus: KALRO maize guidance, IPM-first recommendations, English/Swahili-ready UI.
10. Results: read directly from `artifacts/test_metrics.json`; never substitute a claimed number.
11. Limitations and field-validation roadmap.
