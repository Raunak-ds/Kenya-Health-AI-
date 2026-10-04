"""
Structured Recommendation Engine grounded in Kenya agricultural research.
Does NOT use LLM hallucination. Implements rule-based domain reasoning over
validated KALRO, FAO, CIMMYT, CIP, and extension agronomy guidelines.
"""
from pathlib import Path
import json
from typing import Dict, Any, Optional, List

ROOT = Path(__file__).resolve().parents[2]
KB_DIR = ROOT / "knowledge_base"

# Cache loaded KB artifacts
_DISEASES: Dict[str, dict] = {}
_CROPS: Dict[str, dict] = {}
_RULES: dict = {}
_SOURCES: dict = {}
_LEGACY_KB: dict = {}


def _load_kb():
    global _DISEASES, _CROPS, _RULES, _SOURCES, _LEGACY_KB
    if not _DISEASES:
        # Load legacy recommendations.json as baseline
        legacy_file = KB_DIR / "recommendations.json"
        if legacy_file.exists():
            try:
                _LEGACY_KB = json.loads(legacy_file.read_text(encoding="utf-8"))
            except Exception:
                _LEGACY_KB = {}

        # Load authoritative sources
        sources_file = KB_DIR / "sources" / "authoritative_sources.json"
        if sources_file.exists():
            try:
                _SOURCES = json.loads(sources_file.read_text(encoding="utf-8"))
            except Exception:
                _SOURCES = {}

        # Load rules
        rules_file = KB_DIR / "recommendations" / "rules.json"
        if rules_file.exists():
            try:
                _RULES = json.loads(rules_file.read_text(encoding="utf-8"))
            except Exception:
                _RULES = {}

        # Load crops
        crops_dir = KB_DIR / "crops"
        if crops_dir.exists():
            for f in crops_dir.glob("*.json"):
                try:
                    data = json.loads(f.read_text(encoding="utf-8"))
                    _CROPS[data.get("crop_id", f.stem)] = data
                except Exception:
                    pass

        # Load diseases
        diseases_dir = KB_DIR / "diseases"
        if diseases_dir.exists():
            for f in diseases_dir.glob("*.json"):
                try:
                    data = json.loads(f.read_text(encoding="utf-8"))
                    _DISEASES[data.get("disease_id", f.stem)] = data
                except Exception:
                    pass


def get_structured_recommendation(
    label: str,
    lang: str = "en",
    severity: Optional[Dict[str, Any]] = None,
    confidence: Optional[float] = None,
    growth_stage: Optional[str] = None,
    repeat_occurrence: bool = False,
    weather_risk: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Produce a complete, structured agronomic recommendation.
    """
    _load_kb()

    chemical_safety = (
        _LEGACY_KB.get("_policy", {}).get(
            "chemical_safety",
            "No dosage is provided. If a pesticide is considered, use only PCPB-registered products for the crop and disease in Kenya, strictly follow the product label, PPE, pre-harvest interval, and local agricultural extension guidance."
        )
    )

    if lang == "sw":
        chemical_safety = (
            "Hakuna vipimo vya viuadudu vinavyotolewa. Iwapo dawa inahitajika, tumia tu bidhaa zilizosajiliwa na Bodi ya Kudhibiti Viuadudu (PCPB) nchini Kenya. Fuata lebo ya bidhaa, vifaa vya kinga (PPE), na ushauri wa afisa ugani wa eneo lako."
        )

    # 1. Handle Healthy
    if label.endswith("_healthy") or "healthy" in label.lower():
        crop_name = label.split("_")[0]
        if lang == "sw":
            mgmt = [
                "Hakuna ugonjwa uliogunduliwa. Endelea na usafi wa shamba na palizi kwa wakati.",
                "Dumisha lishe bora ya mmea kulingana na mahitaji ya mchanga wako."
            ]
            prev = [
                "Zingatia mzunguko wa mazao ili kuzuia magonjwa kujikusanya ardhini.",
                "Tumia mbegu au vipandikizi vilivyoidhinishwa na KEPHIS / KALRO."
            ]
            mon = ["Endelea kukagua shamba kila baada ya siku 7 hadi 10."]
            esc = ["Hakuna hatua ya dharura inayohitajika kwa sasa."]
            kenya_notes = f"Mazao ya {crop_name} yana afya nzuri. Endelea kufuata mbinu bora za kilimo za KALRO."
        else:
            mgmt = [
                "No supported disease was confidently detected on this leaf.",
                "Continue standard weed management, soil moisture maintenance, and balanced nutrition."
            ]
            prev = [
                "Practice crop rotation to prevent soil-borne pathogens from accumulating.",
                "Source certified, disease-free planting seed or certified seed potatoes."
            ]
            mon = ["Continue routine field scouting every 7-10 days."]
            esc = ["No escalation needed at present. Continue monitoring."]
            kenya_notes = f"Crop foliage appears healthy and vigorous. Maintain good agricultural practices as recommended by KALRO."

        return {
            "management": mgmt,
            "prevention": prev,
            "monitoring": mon,
            "escalation": esc,
            "kenya_notes": kenya_notes,
            "sources": [
                "https://www.kalro.org/",
                "https://www.fao.org/pest-and-pesticide-management/ipm/integrated-pest-management/en"
            ],
            "safety": chemical_safety,
            "is_urgent": False,
            "follow_up_days": 14,
            "language": lang
        }

    # 2. Check Detailed Disease JSON
    disease_data = _DISEASES.get(label)
    severity_cat = (severity or {}).get("category", "Mild")

    if disease_data:
        mgmt = list(disease_data.get("management", []))
        prev = list(disease_data.get("prevention", []))
        mon = list(disease_data.get("monitoring", []))
        esc = list(disease_data.get("escalation", []))
        kenya_notes = disease_data.get("kenya_notes", "")
        sources_list = [s["url"] for s in disease_data.get("sources", [])]
    else:
        # Fallback to legacy recommendations.json
        legacy_item = _LEGACY_KB.get(label, {})
        mgmt = list(legacy_item.get("management", []))
        prev = list(legacy_item.get("prevention", []))
        mon = list(legacy_item.get("monitoring", []))
        esc = ["Seek physical inspection from your local Sub-County Agricultural Officer."]
        kenya_notes = "Consult local agricultural extension office for regional crop management guidelines."
        sources_list = legacy_item.get("sources", [_LEGACY_KB.get("_policy", {}).get("general_source", "https://www.fao.org")])

    # 3. Dynamic Rules Layer
    is_urgent = False
    follow_up_days = 5

    # Late Blight rules
    if "late_blight" in label:
        if severity_cat == "Severe":
            is_urgent = True
            follow_up_days = 2
            urgent_msg = (
                "HARAKA / URGENT: Phytophthora infestans (Late Blight) spreads rapidly in cool, humid weather. Bag and rogue severely infected material immediately."
                if lang != "sw" else
                "HATUA YA HARAKA: Kinyaushi chelewa kinaenea haraka sana katika hali ya hewa yenye ubaridi na unyevu. Ondoa na choma au fukia mimea iliyoathirika vibaya mara moja."
            )
            mgmt.insert(0, urgent_msg)
            esc.insert(0, "Immediate escalation: Contact your local agricultural extension officer within 24-48 hours to prevent total crop loss.")
        elif severity_cat == "Moderate":
            is_urgent = True
            follow_up_days = 3
            mgmt.insert(0, "Remove isolated infected lower leaves immediately; avoid overhead watering.")
    elif severity_cat == "Severe":
        follow_up_days = 3
        mgmt.insert(0, f"High severity observed. Check neighboring plants within 3 meters and minimize plant handling while foliage is wet.")

    # Repeat occurrence rule
    if repeat_occurrence:
        repeat_msg = (
            "REPEAT OCCURRENCE ALERT: This disease has been detected on this farm in consecutive scans. Pathogen inoculum has likely built up in the soil or crop residue. Strictly plan non-host crop rotation for the next planting season."
            if lang != "sw" else
            "ANGALIZO LA UGONJWA WA MARA KWA MARA: Ugonjwa huu umejitokeza mara kwa mara kwenye shamba hili. Hakikisha unapanga mzunguko wa mazao tofauti kwa msimu ujao."
        )
        prev.insert(0, repeat_msg)

    # Growth stage adaptation
    if growth_stage:
        gs_lower = growth_stage.lower()
        if "seedling" in gs_lower or "nursery" in gs_lower:
            mon.append("Nursery / seedling stage: Do NOT transplant diseased seedlings into main fields; discard infected seedlings.")
        elif "flowering" in gs_lower or "silking" in gs_lower or "tassel" in gs_lower:
            mon.append(f"Critical reproductive stage ({growth_stage}): Protect ear and fruit clusters; yield penalty is highest if leaf loss occurs now.")

    # Weather risk integration
    if weather_risk:
        for w_note in weather_risk:
            mon.append(f"Weather alert: {w_note}")

    return {
        "management": mgmt,
        "prevention": prev,
        "monitoring": mon,
        "escalation": esc,
        "kenya_notes": kenya_notes,
        "sources": sources_list,
        "safety": chemical_safety,
        "is_urgent": is_urgent,
        "follow_up_days": follow_up_days,
        "language": lang
    }
