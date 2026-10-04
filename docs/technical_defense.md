# Technical defense

The system separates three uncertainty sources: unusable input quality, classifier uncertainty, and unsupported real-world conditions. It never uses the held-out test set to choose architecture, temperature, or confidence threshold. Model choice is made from validation macro recall after identical short comparison runs; the selected model is then trained longer with early stopping.

Temperature scaling adjusts confidence without changing class ranking. The threshold search explicitly trades coverage for safer accepted predictions. This is more defensible than raw argmax, though open-set/OOD detection remains imperfect.

Leakage is reduced by respecting the dataset's leaf-grouped test split and splitting training data by `leaf_id`. Exact hash duplicate removal runs before splitting.

For real deployment, the next experiment should be a prospectively collected Kenyan field set, stratified by crop, disease, county/agro-ecological zone, device, lighting, disease stage and healthy mimics. That set should remain external to model development until final validation.
