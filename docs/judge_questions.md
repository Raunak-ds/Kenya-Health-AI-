# Likely judge questions

**Why these crops?** They satisfy the three-crop requirement and have strong labeled coverage in PlantVillage; maize, tomato, and potato are agriculturally relevant in Kenya.

**Why not claim 90%?** The pipeline writes measured held-out results after training. The source package never hard-codes performance.

**How do you prioritize sensitivity?** Model selection uses validation macro recall, and reports per-class false-negative rates. Threshold selection happens on validation only.

**How do you reduce false positives?** Temperature scaling, optimized confidence rejection, entropy rejection, crop filtering when selected, and image-quality rejection.

**Why PlantVillage if field conditions differ?** It is reproducible and sufficiently labeled for training, but the limitation is explicit. PlantDoc is documented for external field-domain evaluation and Kenyan field collection is the production roadmap.

**Is severity scientifically validated?** No. It is an affected-color-area heuristic and is clearly labeled project-defined.

**Why Grad-CAM?** It helps inspect whether model attention overlaps symptomatic leaf regions; it is not a proof of diagnosis.

**What about scalability?** The FastAPI service is stateless; model serving can be replicated horizontally. MobileNetV3 may be preferable for edge deployment if its measured recall is competitive.
