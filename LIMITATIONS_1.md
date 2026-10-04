# Limitations

1. **Domain shift:** PlantVillage mostly uses controlled backgrounds. Accuracy on field photos can be substantially lower.
2. **Closed-set labels:** Only 11 crop-condition classes are trained. The uncertainty gate reduces forced predictions but cannot guarantee OOD detection.
3. **Quality heuristic:** Blur/darkness/vegetation checks are simple computer-vision rules, not a trained leaf detector.
4. **Severity:** HSV affected-area estimation is project-defined and not validated against expert severity annotations.
5. **Advice localization:** KALRO guidance is used where available; some disease-specific details come from reputable university extension sources outside Kenya and should be localized by Kenyan agronomists before deployment.
6. **Chemical controls:** No dosage is supplied. Registration and labels can change; users must consult Kenyan labels/extension guidance.
7. **Language:** UI labels/messages include English and basic Swahili strings, but the detailed recommendation corpus is English-first and should receive professional agricultural translation before production.
8. **No guarantee of 90%:** Performance is measured only after actual training and is not pre-claimed.
