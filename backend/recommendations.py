from pathlib import Path
import json
from backend.services.recommendation_service import get_structured_recommendation

ROOT = Path(__file__).resolve().parents[1]
KB = json.loads((ROOT / 'knowledge_base/recommendations.json').read_text(encoding="utf-8"))
I18N = json.loads((ROOT / 'knowledge_base/i18n.json').read_text(encoding="utf-8"))

def get_recommendations(
    label,
    lang='en',
    severity=None,
    confidence=None,
    growth_stage=None,
    repeat_occurrence=False,
    weather_risk=None
):
    """
    Backwards-compatible recommendation getter with structured Kenyan agronomic logic.
    """
    return get_structured_recommendation(
        label=label,
        lang=lang,
        severity=severity,
        confidence=confidence,
        growth_stage=growth_stage,
        repeat_occurrence=repeat_occurrence,
        weather_risk=weather_risk,
    )
