# Platform Limitations & Agronomic Disclaimers

1. **Domain Shift & Real-World Generalization:**
   The base computer-vision classifier was trained on PlantVillage-derived imagery with largely uniform laboratory/neutral backgrounds. Field accuracy on Kenyan smallholder plots with background vegetation, weeds, shadows, or red soil may differ. The built-in uncertainty thresholding actively flags low-confidence images to prevent misleading farmers.

2. **Closed-Set Classification (11 Classes):**
   The model recognizes only the 11 specified conditions across Maize, Potato, and Tomato. Pests (e.g., Fall Armyworm, Tuta absoluta), nutrient deficiencies (nitrogen chlorosis, phosphorus purpling), viral diseases (Maize Lethal Necrosis, Tomato Yellow Leaf Curl), or unmodeled fungal blights will either trigger an "Uncertain" verdict or must be routed to an agricultural extension officer.

3. **Heuristic Severity Proxy:**
   Severity percentages and bands (Mild <10%, Moderate 10-25%, Severe >25%) are calculated using an HSV color-space vegetation heuristic (non-green vs healthy green pixel fraction). This is an informative visual proxy, not an agronomically certified phytopathology lesion assay.

4. **Decision Support, Not Chemical Prescriptions:**
   Under Kenyan regulations (Pest Control Products Act Cap 346), pesticide recommendations require product registration with the Pest Control Products Board (PCPB). The platform intentionally provides **zero chemical dosages**. Advice focuses on cultural sanitation, IPM, resistant seed varieties, scouting, and physical escalation to sub-county agricultural officers.

5. **Field Verification Requirement:**
   AI predictions should support, not replace, physical farm inspections. Extension officers should physically verify any high-severity outbreak before large-scale commercial interventions are initiated.
